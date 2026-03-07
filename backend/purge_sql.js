require('dotenv').config();
const { Sequelize } = require('sequelize');

async function purge() {
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        dialectOptions: {
            ssl: { require: true, rejectUnauthorized: false }
        },
        logging: false
    });

    try {
        await sequelize.authenticate();
        console.log('[DB] Connected via raw Sequelize.');

        // This is safe from windows command prompt escaping hell
        const query = 'DELETE FROM "ScrapedResults" WHERE id NOT IN (SELECT MAX(id) FROM "ScrapedResults" GROUP BY game)';
        await sequelize.query(query);

        console.log('Purged all duplicate rows from Live Feed successfully.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
purge();
