import { defineConfig } from 'vitest/config';

// Tests run on the host against the dockerized dev Postgres (published on
// localhost:5432). Without these, env.ts defaults to DB_HOST='postgres'
// (the docker-internal hostname), which does not resolve outside compose.
export default defineConfig({
  test: {
    env: {
      DB_HOST: 'localhost',
      DB_PORT: '5432',
    },
    testTimeout: 15000,
  },
});
