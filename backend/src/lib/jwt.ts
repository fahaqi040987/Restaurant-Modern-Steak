import jwt from 'jsonwebtoken';
import { env } from '../env.js';

export interface JWTClaims {
  user_id: string;
  username: string;
  role: string;
  iss: string;
  iat: number;
  exp: number;
}

export function generateToken(user: { id: string; username: string; role: string }): string {
  const payload = {
    user_id: user.id,
    username: user.username,
    role: user.role,
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'pos-system',
    algorithm: 'HS256',
  });
}

export function validateToken(token: string): JWTClaims {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: 'pos-system',
    algorithms: ['HS256'],
  }) as JWTClaims;
}
