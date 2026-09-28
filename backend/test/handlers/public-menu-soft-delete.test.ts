// File: backend/test/handlers/public-menu-soft-delete.test.ts
// Regression test: soft-deleted products must not appear in the public menu.
//
// deleteProduct soft-deletes by setting is_deleted (leaving is_available=true),
// but getPublicMenu filtered only on is_available. Deleted items (e.g. Ice
// Waffle, Pempek) kept showing on the public /site/menu page.
import { describe, it, expect, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { deleteProduct } from '../../src/handlers/products';
import { getPublicMenu } from '../../src/handlers/public';
import { pool } from '../../src/db/connection.js';

const created: string[] = [];

async function insertProduct(name: string) {
  const { rows } = await pool.query(
    `INSERT INTO products (name, price, is_available, is_deleted) VALUES ($1, 10000, true, false) RETURNING id`,
    [name],
  );
  const id = rows[0].id as string;
  created.push(id);
  return id;
}

function makeContext(opts: { param?: string; query?: Record<string, string> } = {}) {
  return {
    req: {
      param: (key: string) => (key === 'id' ? opts.param : undefined),
      query: (key: string) => opts.query?.[key],
    },
    json: (data: unknown, status?: number) => new Response(JSON.stringify(data), { status: status ?? 200 }),
  } as any;
}

afterEach(async () => {
  for (const id of created.splice(0)) {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
  }
});

describe('getPublicMenu (regression: soft-deleted products must be hidden)', () => {
  it('hides a product after it is soft-deleted via the admin API', async () => {
    const name = `QA Waffle ${randomUUID().slice(0, 8)}`;
    const id = await insertProduct(name);

    // Admin deletes the product (soft delete; is_available stays true)
    const delRes = await deleteProduct(makeContext({ param: id }));
    expect(delRes.status).toBe(200);

    // Public menu must no longer list it
    const res = await getPublicMenu(makeContext({ query: {} }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const names: string[] = body.data.map((i: { name: string }) => i.name);
    expect(names).not.toContain(name);
  });

  it('still shows products that are available and not deleted', async () => {
    const name = `QA Available ${randomUUID().slice(0, 8)}`;
    await insertProduct(name);

    const res = await getPublicMenu(makeContext({ query: {} }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const names: string[] = body.data.map((i: { name: string }) => i.name);
    expect(names).toContain(name);
  });
});
