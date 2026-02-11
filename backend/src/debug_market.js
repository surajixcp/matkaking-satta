const { Market, Result, sequelize } = require('./db/models');

async function checkMarket() {
    try {
        const marketId = 7;
        const market = await Market.findByPk(marketId);

        if (!market) {
            console.log("Market not found");
            return;
        }

        console.log("Market Details:");
        console.log(`ID: ${market.id}`);
        console.log(`Name: ${market.name}`);
        console.log(`Open Time: ${market.open_time}`);
        console.log(`Close Time: ${market.close_time}`);
        console.log(`Status (Active?): ${market.status}`);

        const today = new Date().toISOString().split('T')[0];
        const result = await Result.findOne({
            where: { market_id: marketId, date: today }
        });

        console.log("\nResult for Today:");
        if (result) {
            console.log(`Open Declared: ${result.open_declare}`);
            console.log(`Close Declared: ${result.close_declare}`);
        } else {
            console.log("No result record found for today.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
}

checkMarket();
