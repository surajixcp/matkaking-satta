const marketsService = require("../src/app/services/markets.service");
const { sequelize } = require("../src/db/models");

async function main() {
    await sequelize.authenticate();
    const markets = await marketsService.getMarkets();
    const kalyan = markets.find(m => m.name.toLowerCase().includes('kalyan'));
    console.log("Kalyan Result:", kalyan ? kalyan.results : 'Not found');
    console.log("Kalyan Masking:", kalyan ? { openSessionOpen: kalyan.openSessionOpen, closeSessionOpen: kalyan.closeSessionOpen } : '');

    // Check first 3 markets 
    for (let i = 0; i < 3 && i < markets.length; i++) {
        console.log(`Market: ${markets[i].name}, Results:`, markets[i].results, "Masking:", { open: markets[i].openSessionOpen, close: markets[i].closeSessionOpen });
    }
}

main().catch(console.error).finally(() => process.exit(0));
