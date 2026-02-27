process.env.DATABASE_URL = 'postgresql://matka:matka@localhost:5432/matka';
const { Result } = require('./src/db/models');

async function run() {
    try {
        console.log("Connecting to DB and finding bad results for today...");
        const results = await Result.findAll({ where: { market_id: 6, date: '2026-02-27' } });
        console.log("Found Results:", results.map(r => r.toJSON()));

        for (let r of results) {
            console.log(`Deleting result ID: ${r.id}`);
            await r.destroy();
        }

        console.log("Successfully deleted.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
