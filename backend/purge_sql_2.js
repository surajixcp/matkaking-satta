require('dotenv').config();
const { ScrapedResult, sequelize } = require('./src/db/models');
const { Op } = require('sequelize');

async function purge() {
    try {
        await sequelize.authenticate();
        console.log('[DB] Connected using exact project configuration.');

        const query = 'DELETE FROM "ScrapedResults" WHERE id NOT IN (SELECT MAX(id) FROM "ScrapedResults" GROUP BY game)';
        await sequelize.query(query);

        console.log('[+] Purged all duplicate rows from Live Feed successfully.');
    } catch (e) {
        console.error('[-] Error executing purge:', e.message);
    } finally {
        process.exit(0);
    }
}
purge();
