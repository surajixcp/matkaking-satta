const { GameType, sequelize } = require('../src/db/models');

async function seedGameTypes() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        const count = await GameType.count();
        console.log(`Current GameTypes count: ${count}`);

        if (count === 0) {
            console.log('Seeding GameTypes...');
            const gameTypes = [
                { name: 'Single Digit', key: 'single_digit', rate: 9.5 },
                { name: 'Jodi Digit', key: 'jodi_digit', rate: 95.0 },
                { name: 'Single Patti', key: 'single_patti', rate: 150.0 },
                { name: 'Double Patti', key: 'double_patti', rate: 300.0 },
                { name: 'Triple Patti', key: 'triple_patti', rate: 700.0 },
                { name: 'Half Sangam', key: 'half_sangam', rate: 1000.0 },
                { name: 'Full Sangam', key: 'full_sangam', rate: 10000.0 }
            ];

            await GameType.bulkCreate(gameTypes);
            console.log('GameTypes seeded successfully!');
        } else {
            console.log('GameTypes already exist. skipping seed.');
            const types = await GameType.findAll();
            console.log('Existing types:', types.map(t => t.name).join(', '));
        }

    } catch (error) {
        console.error('Error seeding GameTypes:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

seedGameTypes();
