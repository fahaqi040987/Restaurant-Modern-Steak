const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: 'postgres://postgres:postgres123@localhost:5432/pos_system' });
  await client.connect();
  await client.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check`);
  console.log('Constraint dropped successfully');
  await client.end();
}
main().catch(console.error);
