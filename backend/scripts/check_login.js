const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function testLogin() {
    try {
        console.log('Attempting login...');
        const res = await axios.post(`${API_URL}/admin/login`, {
            phone: '9876543210',
            password: 'password'
        });
        console.log('Login Response:', res.status, res.data);
    } catch (error) {
        console.error('Login Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Code:', error.code);
            console.error('Error Message:', error.message);
            console.error('Full Error:', error);
        }
    }
}

testLogin();
