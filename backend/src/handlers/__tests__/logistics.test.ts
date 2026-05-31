import { describe, it, expect, beforeAll, vi } from 'vitest';
import { Hono } from 'hono';
import { setupRoutes } from '../../routes/index.js';
import { generateTestToken } from './auth-helper.js';

// Mock DB connection
vi.mock('../../db/connection.js', () => {
  const mClient = {
    query: vi.fn().mockResolvedValue({ rows: [{ ingredient_id: '1', quantity: 1, ingredient_name: 'Test Ingredient', current_stock: 10 }] }),
    release: vi.fn(),
  };
  return {
    pool: {
      connect: vi.fn().mockResolvedValue(mClient),
      query: vi.fn().mockResolvedValue({ rows: [] }),
    },
    db: {
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    }
  };
});

describe('Logistics Handler', () => {
  let authToken: string;
  let app: Hono;

  beforeAll(() => {
    authToken = generateTestToken();
    app = new Hono();
    setupRoutes(app);
  });

  describe('POST /api/v1/admin/logistics/auto-deduct', () => {
    it('should successfully auto deduct inventory', async () => {
      const response = await app.request('/api/v1/admin/logistics/auto-deduct', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_items: [
            { product_id: '1', quantity: 2 },
            { product_id: '2', quantity: 1 }
          ]
        })
      });

      const body = await response.json() as any;
      expect(response.status).toBe(200);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('message');
      expect(body.data).toHaveProperty('deducted_items');
    });

    it('should return 400 for invalid item data', async () => {
      const response = await app.request('/api/v1/admin/logistics/auto-deduct', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_items: [
            { product_id: '-1', quantity: 0 }
          ]
        })
      });

      const body = await response.json() as any;
      expect(response.status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('should return 401 for unauthorized requests', async () => {
      const response = await app.request('/api/v1/admin/logistics/auto-deduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_items: [
            { product_id: '1', quantity: 2 }
          ]
        })
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/admin/inventory/adjust', () => {
    it('should successfully adjust stock', async () => {
      const response = await app.request('/api/v1/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: '1',
          quantity: 10,
          reason: 'Initial stock'
        })
      });

      const body = await response.json() as any;
      expect(response.status).toBe(200);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('message');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await app.request('/api/v1/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: '1'
        })
      });

      const body = await response.json() as any;
      expect(response.status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('should return 400 for negative quantity', async () => {
      const response = await app.request('/api/v1/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: '1',
          quantity: -5,
          reason: 'Test'
        })
      });

      const body = await response.json() as any;
      expect(response.status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('should return 401 for unauthorized requests', async () => {
      const response = await app.request('/api/v1/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: '1',
          quantity: 10,
          reason: 'Test'
        })
      });

      expect(response.status).toBe(401);
    });
  });
});
