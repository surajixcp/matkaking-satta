const { Market } = require('../src/db/models');

async function test() {
    const markets = await Market.findAll({ where: { status: true } });
    for (const m of markets) {
        console.log(`${m.name}: OPEN=${m.open_time}, CLOSE=${m.close_time}`);
    }
    process.exit(0);
}

test().catch(console.error);
