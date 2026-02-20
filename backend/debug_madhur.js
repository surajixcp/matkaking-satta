require('dotenv').config();
const { Result, Bid, Market, GameType, sequelize } = require('./src/db/models');

async function debug() {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log("Today's date is:", today);

        const market = await Market.findOne({ where: { name: 'MADHUR NIGHT' } });
        if (!market) {
            console.log("Madhur Night market not found");
            return;
        }
        console.log("Market found:", market.id);

        const result = await Result.findOne({ where: { market_id: market.id, date: today } });
        console.log("Result for today:", result ? result.toJSON() : "None");

        const pendingBids = await Bid.findAll({
            where: { market_id: market.id, status: 'pending' },
            include: [{ model: GameType, as: 'game_type' }]
        });
        console.log(`Found ${pendingBids.length} pending bids for Madhur Night`);

        for (const b of pendingBids.slice(0, 5)) {
            console.log(`- Bid ID: ${b.id}, Session: ${b.session}, Digit: ${b.digit}, GT: ${b.game_type?.name} (ID: ${b.game_type_id})`);
        }

        const gameTypes = await GameType.findAll();
        gameTypes.forEach(gt => console.log(`GT: ${gt.id} - ${gt.name}`));

    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

debug();
