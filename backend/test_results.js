const { Result, Market } = require('./src/db/models');

async function testResults() {
    try {
        const res = await Result.findAll({
            include: [{ model: Market, as: 'market', attributes: ['name'] }],
            limit: 10,
            order: [['createdAt', 'DESC']]
        });
        const out = res.map(r => ({
            id: r.id,
            date: r.date,
            open: r.open_declare,
            close: r.close_declare,
            mkt: r.market?.name
        }));
        console.log("Recent Results Query:\n", JSON.stringify(out, null, 2));

        const marketService = require('./src/app/services/markets.service.js');
        const markets = await marketService.getMarkets();
        const testM = markets.find(m => m.name.includes("KALYAN SRIDEVI NIGHT"));
        console.log("\KALYAN SRIDEVI NIGHT API Data:\n", JSON.stringify(testM, null, 2));
    } catch (e) {
        console.error(e);
    }
}

testResults().then(() => process.exit(0));
