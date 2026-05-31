import { generateToken } from '../../lib/jwt.js';

export function generateTestToken() {
  return generateToken({
    id: 'test-user-id',
    username: 'testuser',
    role: 'admin'
  });
}
