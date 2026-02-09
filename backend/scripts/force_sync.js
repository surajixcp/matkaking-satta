const { sequelize } = require('../src/db/models');

async function forceSync() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB:', sequelize.config.database, 'on', sequelize.config.host, ':', sequelize.config.port);

        console.log('Syncing Models with DB (Alter True)...');
        await sequelize.sync({ alter: true });
        console.log('Sync Complete.');

        // List tables to confirm
        const [results] = await sequelize.query("SELECT * FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables now in DB:', results.map(r => r.table_name));

    } catch (error) {
        console.error('SYNC ERROR:', error);
    } finally {
        await sequelize.close();
    }
}

forceSync();
