const https = require('https');
const url = require('url');
const readline = require('readline');

// The remote API address
const API_BASE = 'https://matkakingapi.duckdns.org/api/v1';

async function fetchJson(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
        const u = url.parse(API_BASE + endpoint);
        const req = https.request({
            hostname: u.hostname,
            port: u.port,
            path: u.path,
            method: options.method || 'GET',
            headers: options.headers || {}
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse: ' + data));
                }
            });
        });

        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

async function fix() {
    try {
        console.log('--- Remote Reprocess Tool ---\n');

        // 1. Login
        console.log('Logging into Admin Account...');
        const loginRes = await fetchJson('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '9999999999', mpin: '1234' })
        });

        if (!loginRes.success) throw new Error(loginRes.error || 'Login failed');
        const token = loginRes.data.token;
        console.log('✅ Logged in successfully.\n');

        // 2. Find Market ID
        console.log('Fetching markets...');
        const marketsRes = await fetchJson('/markets', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const marketName = await askQuestion('Enter Market Name to reprocess (e.g. MADHUR NIGHT): ');
        const market = marketsRes.data.find(m => m.name.toLowerCase().includes(marketName.toLowerCase()));

        if (!market) {
            console.error(`❌ Market '${marketName}' not found.`);
            process.exit(1);
        }
        console.log(`✅ Found Market: ${market.name} (ID: ${market.id})`);

        // 3. Ask Date
        const dateInput = await askQuestion('Enter Date to reprocess (YYYY-MM-DD) [e.g. 2026-02-20]: ');

        console.log(`\n⏳ Reprocessing ${market.name} for date ${dateInput}...`);

        const reproRes = await fetchJson('/results/reprocess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ marketId: market.id, date: dateInput })
        });

        if (reproRes.success) {
            console.log('\n🎉 SUCCESS! All pending bids for this date have been processed (Wins/Losses updated).');
            console.log('Check your app to verify they are matched correctly.');
        } else {
            console.error('\n❌ Reprocess Failed from server:', reproRes);
        }
    } catch (e) {
        console.error('\n❌ Script Error:', e.message);
    }
}

fix();
