import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Hono } from 'hono';
import { setupRoutes } from '../../routes/index.js';
import { generateTestToken } from './auth-helper';

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
      const response = await request(app.fetch)
        .post('/api/v1/admin/logistics/auto-deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_items: [
            { product_id: '1', quantity: 2 },
            { product_id: '2', quantity: 1 }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('deducted_items');
    });

    it('should return 400 for invalid item data', async () => {
      const response = await request(app.fetch)
        .post('/api/v1/admin/logistics/auto-deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_items: [
            { product_id: '-1', quantity: 0 }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthorized requests', async () => {
      const response = await request(app.fetch)
        .post('/api/v1/admin/logistics/auto-deduct')
        .send({
          order_items: [
            { product_id: '1', quantity: 2 }
          ]
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/admin/inventory/adjust', () => {
    it('should successfully adjust stock', async () => {
      const response = await request(app.fetch)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: '1',
          quantity: 10,
          reason: 'Initial stock'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app.fetch)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: '1'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for negative quantity', async () => {
      const response = await request(app.fetch)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: '1',
          quantity: -5,
          reason: 'Test'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for unauthorized requests', async () => {
      const response = await request(app.fetch)
        .post('/api/v1/admin/inventory/adjust')
        .send({
          product_id: '1',
          quantity: 10,
          reason: 'Test'
        });

      expect(response.status).toBe(401);
    });
  });
});
