const { sequelize } = require('../src/db/models');

async function verifyTables() {
    try {
        await sequelize.authenticate();
        const config = sequelize.config;
        console.log(`Connected to Database: ${config.database} on ${config.host}:${config.port}`);

        const [results] = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        );

        console.log('Tables Found:');
        results.forEach(r => console.log(` - ${r.table_name}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

verifyTables();
