import 'dotenv/config';

export const env = {
  DB_HOST: process.env.DB_HOST || 'postgres',
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres123',
  DB_NAME: process.env.DB_NAME || 'pos_system',
  DB_SSLMODE: process.env.DB_SSLMODE || 'disable',
  PORT: Number(process.env.PORT) || 8080,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-secret-change-in-production-min-32-chars',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:8000,http://localhost:3001,http://localhost:5173',
  UPLOADS_DIR: process.env.UPLOADS_DIR || './uploads',
} as const;

if (env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters for security');
}
