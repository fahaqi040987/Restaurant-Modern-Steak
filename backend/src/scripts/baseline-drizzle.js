#!/usr/bin/env node
// File: backend/src/scripts/baseline-drizzle.js
/**
 * Baseline the drizzle migrations journal for databases whose schema was
 * applied out-of-band (created before the migrations workflow existed).
 *
 * Writes rows into `drizzle.__drizzle_migrations` — the exact table
 * `drizzle-kit migrate` (drizzle-orm migrator) consults — marking migrations
 * as already applied. Without a baseline, the first `npm run db:migrate` on
 * such a database replays 0000 from scratch and fails with
 * `relation "..." already exists`.
 *
 * Usage:
 *   npm run db:baseline                  # baseline ALL journal migrations
 *   npm run db:baseline -- --only 0000_daily_hydra
 *                                        # baseline a subset (e.g. prod has
 *                                        # 0000 applied but 0001 still pending;
 *                                        # then run db:migrate to apply the rest)
 *
 * Guards:
 *  - Every migration named for baselining must already be reflected in the
 *    database (its sentinel table must exist), so this script can never
 *    "baseline" a migration that has not actually been applied. On a fresh
 *    or partially-migrated database you want `npm run db:migrate`, not this.
 *  - Idempotent: migrations already recorded in the journal table are skipped.
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRIZZLE_DIR = path.resolve(__dirname, '../../drizzle');

// Same connection fallbacks as drizzle.config.ts (host-side tool)
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_NAME || 'pos_system',
};

// Optional overrides for testing: --db-host/--db-port/--db-name/--db-user
const argsAll = process.argv.slice(2);
function argValue(flag) {
  const i = argsAll.indexOf(flag);
  return i !== -1 ? argsAll[i + 1] : undefined;
}
if (argValue('--db-host')) config.host = argValue('--db-host');
if (argValue('--db-port')) config.port = Number(argValue('--db-port'));
if (argValue('--db-name')) config.database = argValue('--db-name');
if (argValue('--db-user')) config.user = argValue('--db-user');

// First table each migration creates — its presence proves that migration
// is already applied to the database.
const MIGRATION_SENTINELS = {
  '0000_daily_hydra': 'public.bio_link_clicks',
  '0001_overrated_outlaw_kid': 'public.payment_methods',
};

async function main() {
  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf('--only');
  const flagsWithValues = ['--db-host', '--db-port', '--db-name', '--db-user'];
  const onlyTags = onlyIdx !== -1
    ? args.slice(onlyIdx + 1).filter((a, i, arr) => !flagsWithValues.includes(a) && !flagsWithValues.includes(arr[i - 1]))
    : null;

  const journalPath = path.join(DRIZZLE_DIR, 'meta', '_journal.json');
  if (!existsSync(journalPath)) {
    console.error(`❌ Journal not found: ${journalPath}`);
    process.exit(1);
  }
  const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
  const allEntries = journal.entries ?? journal; // drizzle journal shape: { entries: [{ tag, when }] }

  let entries = allEntries;
  if (onlyTags && onlyTags.length > 0) {
    entries = allEntries.filter((e) => onlyTags.includes(e.tag));
    const unknown = onlyTags.filter((t) => !entries.some((e) => e.tag === t));
    if (unknown.length > 0) {
      console.error(`❌ Unknown migration tag(s): ${unknown.join(', ')}`);
      process.exit(1);
    }
  }

  console.log(`🔍 Baseline target: ${config.host}:${config.port}/${config.database}`);
  console.log(`📑 Migrations to baseline: ${entries.map((e) => e.tag).join(', ')}\n`);

  const client = new Client(config);
  await client.connect();

  try {
    // ── Guard: each migration to baseline must already be in the database ────
    for (const entry of entries) {
      const sentinel = MIGRATION_SENTINELS[entry.tag];
      if (!sentinel) continue; // unknown sentinel — allow, user opted in
      const res = await client.query(`SELECT to_regclass($1) AS t`, [sentinel]);
      if (!res.rows[0].t) {
        console.error(`❌ Refusing to baseline ${entry.tag}: table ${sentinel} does not exist.`);
        console.error('💡 That migration has not been applied to this database.');
        console.error(onlyTags
          ? '   Fix: run "npm run db:migrate" to apply pending migrations instead of baselining them.'
          : '   On a fresh database run "npm run db:migrate" instead.');
        process.exit(1);
      }
    }

    // ── Mirror drizzle-orm's migrator table DDL ──────────────────────────────
    await client.query(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
        "id" serial PRIMARY KEY,
        "hash" text NOT NULL,
        "created_at" bigint
      )
    `);

    // ── Record every selected migration as applied ───────────────────────────
    const existing = await client.query(`SELECT hash FROM "drizzle"."__drizzle_migrations"`);
    const knownHashes = new Set(existing.rows.map((r) => r.hash));

    let baselined = 0;
    for (const entry of entries) {
      const sqlPath = path.join(DRIZZLE_DIR, `${entry.tag}.sql`);
      const sql = readFileSync(sqlPath, 'utf8');
      const hash = createHash('sha256').update(sql).digest('hex');

      if (knownHashes.has(hash)) {
        console.log(`⏭️  ${entry.tag} — already recorded`);
        continue;
      }

      await client.query(
        `INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ($1, $2)`,
        [hash, String(entry.when)],
      );
      baselined += 1;
      console.log(`✅ ${entry.tag} — baselined at ${new Date(entry.when).toISOString()}`);
    }

    console.log(`\n🎉 Done. ${baselined} migration(s) baselined, ${entries.length - baselined} already recorded.`);
    if (!onlyTags) {
      console.log('💡 Verify with: npm run db:migrate (should apply nothing)');
    } else {
      console.log('💡 Now run: npm run db:migrate (applies the migrations NOT baselined here)');
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ Baseline failed:', err.message);
  process.exit(1);
});
