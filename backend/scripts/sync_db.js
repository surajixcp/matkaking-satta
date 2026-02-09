const { sequelize } = require('../src/db/models');

const syncDatabase = async () => {
    try {
        console.log('Syncing database...');
        // alter: true adds missing columns without dropping tables
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');
    } catch (error) {
        console.error('Error syncing database:', error);
    } finally {
        await sequelize.close();
    }
};

syncDatabase();
