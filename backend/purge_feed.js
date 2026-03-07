require('dotenv').config();
const { ScrapedResult, sequelize } = require('./src/db/models');
const { Op } = require('sequelize');

async function purge() {
    try {
        await sequelize.authenticate();
        console.log('[DB] Connected.');

        // Find all records sorted oldest to newest
        const allResults = await ScrapedResult.findAll({
            order: [['fetchedAt', 'ASC']]
        });

        const latestByGame = {};
        for (const r of allResults) {
            // Keep overwriting with the latest ID for each game
            latestByGame[r.game] = r.id;
        }

        const keepIds = Object.values(latestByGame);

        // Delete everything that is NOT the latest ID for that game
        const deleted = await ScrapedResult.destroy({
            where: {
                id: { [Op.notIn]: keepIds }
            }
        });

        console.log('Purged ' + deleted + ' duplicate lines.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
purge();
