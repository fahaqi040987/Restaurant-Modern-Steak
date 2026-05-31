const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/restaurant_db' });
  await client.connect();
  const res = await client.query(`
    SELECT pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'notifications_type_check'
  `);
  console.log(res.rows[0]);
  await client.end();
}
main().catch(console.error);
