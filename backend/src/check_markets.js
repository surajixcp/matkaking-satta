const { Market, sequelize } = require('./db/models');

async function listMarkets() {
    try {
        await sequelize.authenticate();
        const markets = await Market.findAll({ attributes: ['id', 'name'] });
        console.log("Existing Markets:");
        markets.forEach(m => console.log(`ID: ${m.id}, Name: "${m.name}"`));
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
}

listMarkets();
