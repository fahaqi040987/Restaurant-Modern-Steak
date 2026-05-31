const { Client } = require('pg');
const jwt = require('jsonwebtoken');

async function main() {
  const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/restaurant_db' });
  await client.connect();
  const res = await client.query('SELECT * FROM users');
  console.log('USERS:', JSON.stringify(res.rows, null, 2));
  
  const admin = res.rows.find(u => u.username === 'admin');
  if (admin) {
    const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, 'pos_super_secret_key_123!@#', { expiresIn: '1d' });
    console.log('TOKEN=' + token);
  }
  await client.end();
}
main().catch(console.error);
