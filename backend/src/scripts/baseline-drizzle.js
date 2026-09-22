#!/usr/bin/env node
// File: backend/src/scripts/baseline-drizzle.js
/**
 * Baseline the drizzle migrations journal for databases whose schema was
 * applied out-of-band (created before the migrations workflow existed).
 *
 * Writes one row per migration from drizzle/meta/_journal.json into
 * `drizzle.__drizzle_migrations` — the exact table `drizzle-kit migrate`
 * (drizzle-orm migrator) consults. Without a baseline, the first
 * `npm run db:migrate` on such a database replays 0000 from scratch and
 * fails with `relation "..." already exists`.
 *
 * Guards:
 *  - Refuses to run if sentinel tables from the migrations are missing,
 *    so it can never baseline an empty/unfinished database. On a fresh
 *    database you want `npm run db:migrate`, not this script.
 *  - Idempotent: migrations already recorded in the journal table are skipped.
 *
 * Usage:
 *   npm run db:baseline
 *   (or: node src/scripts/baseline-drizzle.js)
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

// Tables introduced by migration 0000 and 0001 respectively — both must
// exist for baselining to be safe.
const SENTINEL_TABLES = ['public.bio_link_clicks', 'public.payment_methods'];

async function main() {
  const journalPath = path.join(DRIZZLE_DIR, 'meta', '_journal.json');
  if (!existsSync(journalPath)) {
    console.error(`❌ Journal not found: ${journalPath}`);
    process.exit(1);
  }
  const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
  const entries = journal.entries ?? journal; // drizzle journal shape: { entries: [{ tag, when }] }

  console.log(`🔍 Baseline target: ${config.host}:${config.port}/${config.database}`);
  console.log(`📑 Migrations in journal: ${entries.map((e) => e.tag).join(', ')}\n`);

  const client = new Client(config);
  await client.connect();

  try {
    // ── Guard: the schema must already reflect all migrations ────────────────
    const sentinels = await client.query(
      `SELECT to_regclass('public.bio_link_clicks') AS t0, to_regclass('public.payment_methods') AS t1`,
    );
    const { t0, t1 } = sentinels.rows[0];
    const missing = [
      !t0 && SENTINEL_TABLES[0],
      !t1 && SENTINEL_TABLES[1],
    ].filter(Boolean);

    if (missing.length > 0) {
      console.error(`❌ Refusing to baseline: missing table(s) ${missing.join(', ')}.`);
      console.error('💡 The database schema does not match the migration history.');
      console.error('   On a fresh database run "npm run db:migrate" instead.');
      process.exit(1);
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

    // ── Record every journal migration as applied ────────────────────────────
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
    console.log('💡 Verify with: npm run db:migrate (should apply nothing)');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ Baseline failed:', err.message);
  process.exit(1);
});
