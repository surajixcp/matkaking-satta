const { GameType, sequelize } = require('./src/db/models');

async function checkAndUpdateRates() {
    try {
        await sequelize.authenticate();
        console.log('DB connected');

        const games = await GameType.findAll();
        console.log('Current rates:');
        games.forEach(g => console.log(`${g.name}: ${g.rate}`));

        console.log('\nUpdating to new rates...');

        const updates = [
            { key: 'single_digit', rate: 9.5 },
            { key: 'jodi_digit', rate: 95.0 },
            { key: 'single_patti', rate: 150.0 },
            { key: 'double_patti', rate: 300.0 },
            { key: 'triple_patti', rate: 900.0 },  // Updated from 700
            { key: 'half_sangam', rate: 1000.0 },
            { key: 'full_sangam', rate: 10000.0 }
        ];

        for (const update of updates) {
            await GameType.update({ rate: update.rate }, { where: { key: update.key } });
        }

        console.log('\nUpdated rates:');
        const updatedGames = await GameType.findAll();
        updatedGames.forEach(g => console.log(`${g.name}: ${g.rate}`));

    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

checkAndUpdateRates();
