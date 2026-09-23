import { generateToken } from '../../lib/jwt.js';
import { randomUUID } from 'node:crypto';

// A valid uuid: processed_by is a uuid FK, so tokens used against endpoints
// that persist user ids must carry a real uuid (not a placeholder string).
const TEST_USER_ID = randomUUID();

export function testUserId() {
  return TEST_USER_ID;
}

export function generateTestToken() {
  return generateToken({
    id: TEST_USER_ID,
    username: 'testuser',
    role: 'admin'
  });
}
