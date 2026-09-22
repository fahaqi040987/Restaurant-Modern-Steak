import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { setupRoutes } from '../../routes/index.js';
import { pool } from '../../db/connection.js';
import { generateTestToken } from './auth-helper.js';
import { getActivePaymentMethodCodes } from '../payment-methods.js';

// Integration tests for the configurable payment_methods feature:
//   - public endpoint exposes only active methods and never leaks
//     api_endpoint / webhook_url
//   - admin endpoint exposes all methods (incl. inactive)
//   - admin PUT updates and persists configuration
//   - payments validate against active methods (fallback helper)
//
// Requires the 0001 migration (payment_methods table + seeds) to be applied.
// Skips gracefully when the DB is unreachable or the migration is missing.

const migrationApplied = await pool
  .query<{ t: string | null }>("SELECT to_regclass('payment_methods') AS t")
  .then((r) => r.rows[0]?.t !== null)
  .catch(() => false);

const d = migrationApplied ? describe : describe.skip;

const SEED_CODES = ['cash', 'qris', 'debit_card', 'credit_card', 'digital_wallet'];

d('Payment methods configuration (integration)', () => {
  let app: Hono;
  let authHeader: Record<string, string>;
  let publicCodesBefore: string[];

  beforeAll(async () => {
    app = new Hono();
    setupRoutes(app);
    authHeader = { Authorization: `Bearer ${generateTestToken()}` };

    // Mirror the migration seeds so the suite is deterministic even if rows
    // were removed manually. No-op when the seeds already exist.
    await pool.query(
      `INSERT INTO payment_methods (code, label, description, is_active, provider, sort_order) VALUES
        ('cash','Tunai','Bayar tunai di kasir',true,'manual',1),
        ('qris','QRIS','Scan QRIS untuk membayar',true,'midtrans',2),
        ('debit_card','Kartu Debit','Bayar dengan kartu debit (EDC)',true,'edc',3),
        ('credit_card','Kartu Kredit','Bayar dengan kartu kredit (EDC)',true,'edc',4),
        ('digital_wallet','Dompet Digital','GoPay/OVO/DANA/e-wallet lainnya',true,'midtrans',5)
       ON CONFLICT (code) DO NOTHING`,
    );

    const active = await pool.query<{ code: string }>(
      'SELECT code FROM payment_methods WHERE is_active = true',
    );
    publicCodesBefore = active.rows.map((r) => r.code);
  });

  afterAll(async () => {
    // Restore original state: seeds active, drop any test-created rows
    await pool.query('UPDATE payment_methods SET is_active = true WHERE code = ANY($1)', [SEED_CODES]);
    await pool.query("DELETE FROM payment_methods WHERE code LIKE 'test-%'");
    await pool.end();
  });

  it('public endpoint returns only active methods without api_endpoint/webhook_url', async () => {
    // Deactivate one seed so we can prove inactive methods are hidden
    await pool.query("UPDATE payment_methods SET is_active = false WHERE code = 'digital_wallet'");

    const res = await app.request('/api/v1/public/payment-methods');
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; data: Record<string, unknown>[] };
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);

    const codes = body.data.map((m) => m.code);
    expect(codes).toContain('cash');
    expect(codes).not.toContain('digital_wallet');
    expect(codes.sort()).toEqual([...publicCodesBefore].filter((c) => c !== 'digital_wallet').sort());

    for (const method of body.data) {
      expect(Object.keys(method)).not.toContain('api_endpoint');
      expect(Object.keys(method)).not.toContain('webhook_url');
      expect(Object.keys(method)).not.toContain('is_active');
    }
  });

  it('admin endpoint returns all seeds including the deactivated one', async () => {
    const res = await app.request('/api/v1/admin/payment-methods', { headers: authHeader });
    expect(res.status).toBe(200);

    const body = (await res.json()) as { success: boolean; data: Record<string, unknown>[] };
    expect(body.success).toBe(true);

    const codes = body.data.map((m) => m.code as string);
    for (const code of SEED_CODES) {
      expect(codes).toContain(code);
    }

    const wallet = body.data.find((m) => m.code === 'digital_wallet');
    expect(wallet?.is_active).toBe(false);
    // Admin payload carries the full configuration
    expect(Object.keys(wallet ?? {})).toEqual(
      expect.arrayContaining(['api_endpoint', 'webhook_url', 'sort_order', 'is_active']),
    );
  });

  it('admin PUT toggles is_active false→true and persists it', async () => {
    const { rows } = await pool.query<{ id: string }>(
      "SELECT id FROM payment_methods WHERE code = 'digital_wallet'",
    );
    const id = rows[0].id;

    const res = await app.request(`/api/v1/admin/payment-methods/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ is_active: true }),
    });
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      success: boolean;
      message: string;
      data: { is_active: boolean };
    };
    expect(body.success).toBe(true);
    expect(body.message).toBe('Payment method updated successfully');
    expect(body.data.is_active).toBe(true);

    const persisted = await pool.query<{ is_active: boolean }>(
      'SELECT is_active FROM payment_methods WHERE id = $1',
      [id],
    );
    expect(persisted.rows[0].is_active).toBe(true);
  });

  it('admin PUT rejects a webhook_url that is not http(s)', async () => {
    const { rows } = await pool.query<{ id: string }>(
      "SELECT id FROM payment_methods WHERE code = 'qris'",
    );
    const id = rows[0].id;

    const res = await app.request(`/api/v1/admin/payment-methods/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ webhook_url: 'ftp://example.com/hook' }),
    });
    expect(res.status).toBe(400);

    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);

    const persisted = await pool.query<{ webhook_url: string | null }>(
      'SELECT webhook_url FROM payment_methods WHERE id = $1',
      [id],
    );
    expect(persisted.rows[0].webhook_url).toBeNull();
  });

  it('getActivePaymentMethodCodes returns active codes including cash', async () => {
    const codes = await getActivePaymentMethodCodes();
    expect(codes).not.toBeNull();
    expect(codes).toContain('cash');
  });
});
