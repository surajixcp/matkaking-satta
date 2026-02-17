const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Result, Bid, Market, GameType, sequelize } = require('../src/db/models');
const { Op } = require('sequelize');

async function debugPendingBids() {
    try {
        console.log("=== Debugging Pending Bids ===");

        // 1. List all GameTypes
        const gameTypes = await GameType.findAll();
        console.log("\n--- Game Types ---");
        gameTypes.forEach(gt => console.log(`${gt.id}: ${gt.name}`));

        // 2. Find Markets (Sridevi, Milan Day)
        const markets = await Market.findAll({
            where: {
                name: { [Op.iLike]: '%SRIDEVI%' } // Or just grab all to be safe
            }
        });
        const milanMarkets = await Market.findAll({
            where: {
                name: { [Op.iLike]: '%MILAN DAY%' }
            }
        });

        const allMarkets = [...markets, ...milanMarkets];
        console.log("\n--- Relevant Markets ---");
        allMarkets.forEach(m => console.log(`${m.id}: ${m.name}`));

        // 3. Check Results and Bids for specific dates
        // User screenshot dates: 16/02/2026, 13/02/2026, 12/02/2026
        const checkDates = ['2026-02-16', '2026-02-13', '2026-02-12'];

        for (const date of checkDates) {
            console.log(`\n\n=== Checking Date: ${date} ===`);

            for (const market of allMarkets) {
                // Check Result
                const result = await Result.findOne({
                    where: { market_id: market.id, date: date }
                });

                if (result) {
                    console.log(`[Result] Market: ${market.name} (${market.id}) | Open: ${result.open_declare} | Close: ${result.close_declare}`);
                } else {
                    console.log(`[Result] Market: ${market.name} (${market.id}) | **NO RESULT DECLARED**`);
                }

                // Check Pending Bids count
                const pendingBids = await Bid.findAll({
                    where: {
                        market_id: market.id,
                        status: 'pending',
                        createdAt: {
                            [Op.gte]: new Date(date + 'T00:00:00Z'),
                            [Op.lt]: new Date(date + 'T23:59:59Z')
                        }
                    },
                    include: [{ model: GameType, as: 'game_type' }]
                });

                if (pendingBids.length > 0) {
                    console.log(`[Pending Bids] Market: ${market.name} | Count: ${pendingBids.length}`);
                    pendingBids.forEach(b => {
                        console.log(`   - ID: ${b.id} | Type: ${b.game_type?.name} (${b.game_type_id}) | Session: ${b.session} | Digit: ${b.digit} | Amount: ${b.amount}`);
                    });
                } else {
                    console.log(`[Pending Bids] Market: ${market.name} | None found.`);
                }
            }
        }

    } catch (error) {
        console.error("Error running debug script:", error);
    } finally {
        await sequelize.close();
    }
}

debugPendingBids();
