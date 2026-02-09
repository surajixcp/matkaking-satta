const { sequelize } = require('../src/db/models');

async function listTables() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        const [results] = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        );

        console.log('Tables in DB:', results.map(r => r.table_name));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

listTables();
