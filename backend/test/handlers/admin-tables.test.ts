// File: backend/test/handlers/admin-tables.test.ts
// Regression test for Bug 1: tables created via the admin UI must get a
// non-null qr_code (NULL qr_code renders an unscannable, empty QR in the
// admin table dialog). See scripts/qa-qr-loop.sh for the end-to-end loop.
import { describe, it, expect, afterEach } from 'vitest';
import { createTable, updateTable } from '../../src/handlers/admin';
import { pool } from '../../src/db/connection.js';

const created: string[] = [];

async function makeContext(body: unknown, param?: string) {
  return {
    req: {
      json: async () => body,
      param: (key: string) => (key === 'id' ? param : undefined),
    },
    json: (data: unknown, status?: number) => new Response(JSON.stringify(data), { status: status ?? 200 }),
  } as any;
}

afterEach(async () => {
  for (const id of created.splice(0)) {
    await pool.query('DELETE FROM dining_tables WHERE id = $1', [id]);
  }
});

describe('createTable (Bug 1 regression: qr_code auto-generated)', () => {
  it('generates a readable qr_code following the seed convention', async () => {
    const c = await makeContext({ table_number: 'QA-T01', seating_capacity: 2, location: 'QA' });
    const res = await createTable(c);
    const body = await res.json();

    expect(res.status).toBe(201);
    const id = body.data.id as string;
    created.push(id);

    const { rows } = await pool.query('SELECT table_number, qr_code FROM dining_tables WHERE id = $1', [id]);
    expect(rows[0].qr_code).toBe('table-qa-t01');
  });

  it('falls back to a unique qr_code when the readable one is taken', async () => {
    // Seed-like table already owns "table-qa-t02"; a differently-numbered
    // table that slugs to the same code must still be created with a code.
    const { rows: seeded } = await pool.query(
      `INSERT INTO dining_tables (table_number, qr_code) VALUES ('QA-T02', 'table-qa-t02') RETURNING id`,
    );
    created.push(seeded[0].id);

    const c = await makeContext({ table_number: 'QA_T02', seating_capacity: 4 });
    const res = await createTable(c);
    const body = await res.json();

    expect(res.status).toBe(201);
    created.push(body.data.id);

    const { rows } = await pool.query('SELECT qr_code FROM dining_tables WHERE id = $1', [body.data.id]);
    expect(rows[0].qr_code).toMatch(/^table-/);
    expect(rows[0].qr_code).not.toBe('table-qa-t02'); // must not collide
  });
});

describe('updateTable (Bug 1 regression: qr_code regeneration)', () => {
  it('regenerates qr_code for a table with NULL qr_code', async () => {
    const { rows } = await pool.query(
      `INSERT INTO dining_tables (table_number, qr_code) VALUES ('QA-T03', NULL) RETURNING id`,
    );
    const id = rows[0].id;
    created.push(id);

    const c = await makeContext({ qr_code: true }, id);
    const res = await updateTable(c);

    expect(res.status).toBe(200);
    const { rows: after } = await pool.query('SELECT qr_code FROM dining_tables WHERE id = $1', [id]);
    expect(after[0].qr_code).toBe('table-qa-t03');
  });
});
