const http = require('http');

const HOST = 'localhost';
const PORT = 8080;
const USERNAME = 'server1';
const PASSWORD = 'admin123';
const TABLE_ID = '4f550571-5024-4fcf-8a41-74a8f79b1f7e'; // T01
const PRODUCT_ID = '98fe0eef-3ea1-4d37-b79c-61a6d105d066'; // Wagyu Steak

function request(path, method, data, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOST,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
            console.log('Token length:', token.length);
            console.log('Sending headers:', options.headers);
        }

        if (data) {
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(data);
        }
        req.end();
    });
}

async function run() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginData = JSON.stringify({ username: USERNAME, password: PASSWORD });
        const loginRes = await request('/api/v1/auth/login', 'POST', loginData);

        if (loginRes.status !== 200) {
            console.error('Login failed:', loginRes.body);
            return;
        }

        const loginBody = JSON.parse(loginRes.body);
        const token = loginBody.token;
        console.log('Login successful, token received.');

        // 2. Create Order
        console.log('Creating order...');
        const orderData = JSON.stringify({
            table_id: TABLE_ID, // Use table_id for server orders
            items: [
                {
                    product_id: PRODUCT_ID,
                    quantity: 1,
                    special_instructions: 'Medium rare'
                }
            ],
            notes: "Test order"
        });

        // Note: Server API expects different payload structure in createDineInOrder wrapper?
        // Let's check api/routes.go again.
        // createDineInOrder expects: TableID, CustomerName, Items, Notes.
        // And Items has ProductID (string), Quantity (int), SpecialInstructions (string).

        // The payload above matches what I saw in routes.go

        const orderRes = await request('/api/v1/server/orders', 'POST', orderData, token);

        console.log('Create Order Status:', orderRes.status);
        console.log('Create Order Response:', orderRes.body);

    } catch (error) {
        console.error('Error:', error);
    }
}

run();
