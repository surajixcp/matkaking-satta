const marketService = require('./src/app/services/markets.service');
const { Market } = require('./src/db/models');

async function testTiming() {
    let transaction;
    try {
        const dummyMarket = await Market.create({
            name: "Test Timing Market",
            open_time: "15:10:00",
            close_time: "16:00:00",
            status: true,
            is_open_for_betting: true
        });

        console.log("Created dummy market ID: " + dummyMarket.id);

        const markets = await marketService.getMarkets();
        const testMarket = markets.find(m => m.id === dummyMarket.id);

        console.log("Current System Time IST:", new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        console.log("Test Market state:", {
            isOpen: testMarket.isOpen,
            openSessionOpen: testMarket.openSessionOpen,
            closeSessionOpen: testMarket.closeSessionOpen,
        });

        // Test the strict validation function on placing bets
        const isOpenSessionBetValid = await marketService.isMarketOpen(dummyMarket.id, 'open');
        const isCloseSessionBetValid = await marketService.isMarketOpen(dummyMarket.id, 'close');

        console.log("Can place bet on Open Session? ", isOpenSessionBetValid);
        console.log("Can place bet on Close Session? ", isCloseSessionBetValid);

        await dummyMarket.destroy();
        console.log("Cleaned up");
    } catch (e) {
        console.error("Test failed", e);
    }
}

testTiming().then(() => process.exit(0));
