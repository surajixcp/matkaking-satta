const axios = require('axios');

const API_URL = 'http://localhost:5001/api/v1';

async function runTest() {
    try {
        console.log('1. Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/admin/login`, {
            phone: '9876543210',
            password: 'password'
        });

        if (!loginRes.data.success) {
            console.error('Login failed:', loginRes.data);
            return;
        }

        const token = loginRes.data.token;
        console.log('Login successful. Token received.');

        console.log('2. Creating "Kalyan Main" Market...');
        const createRes = await axios.post(`${API_URL}/markets`, {
            name: 'Kalyan Main',
            open_time: '09:00:00',
            close_time: '21:00:00'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Market created:', createRes.data);

        console.log('3. Verifying Market list...');
        const listRes = await axios.get(`${API_URL}/markets`);
        const markets = listRes.data.data;
        const exists = markets.find(m => m.name === 'Kalyan Main');

        if (exists) {
            console.log('SUCCESS: Market found in list!');
        } else {
            console.error('FAILURE: Market not found in list.');
        }

    } catch (error) {
        console.error('Test Failed:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

runTest();
