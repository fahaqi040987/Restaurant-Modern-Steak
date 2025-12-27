// Load Test Script for Restaurant POS API
// Run with: k6 run load-test.js
// Install k6: brew install k6 (macOS) or https://k6.io/docs/get-started/installation/

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const menuResponseTime = new Trend('menu_response_time');
const ordersResponseTime = new Trend('orders_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Sustain 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],  // 95% of requests < 200ms
    errors: ['rate<0.01'],              // Error rate < 1%
    menu_response_time: ['avg<150'],    // Average menu response < 150ms
    orders_response_time: ['avg<200'],  // Average orders response < 200ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api/v1';

// Test scenarios
export default function () {
  // Scenario 1: GET /public/menu (Public endpoint - most common)
  const menuRes = http.get(`${BASE_URL}/public/menu`);
  menuResponseTime.add(menuRes.timings.duration);

  const menuCheck = check(menuRes, {
    'menu status is 200': (r) => r.status === 200,
    'menu response is JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
    'menu has products': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data?.products);
      } catch {
        return false;
      }
    },
  });
  errorRate.add(!menuCheck);

  sleep(0.5);

  // Scenario 2: GET /public/restaurant-info
  const infoRes = http.get(`${BASE_URL}/public/restaurant-info`);
  check(infoRes, {
    'restaurant-info status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}

// Separate test function for authenticated endpoints
export function authenticatedTests() {
  // Login first
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    username: 'admin',
    password: 'admin123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status !== 200) {
    errorRate.add(1);
    return;
  }

  let token;
  try {
    const body = JSON.parse(loginRes.body);
    token = body.data?.token;
  } catch {
    errorRate.add(1);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // GET /orders (Admin endpoint)
  const ordersRes = http.get(`${BASE_URL}/orders`, { headers: authHeaders });
  ordersResponseTime.add(ordersRes.timings.duration);

  const ordersCheck = check(ordersRes, {
    'orders status is 200': (r) => r.status === 200,
    'orders response is JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
  });
  errorRate.add(!ordersCheck);

  sleep(1);
}
