require('dotenv').config(); // Load env vars explicitly just in case
const { Sequelize } = require('sequelize');
const config = require('./src/config/database');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

console.log('--- CONFIG CHECK ---');
console.log('Environment:', env);
console.log('Database:', dbConfig.database);
console.log('Host:', dbConfig.host);
console.log('Username:', dbConfig.username);
console.log('Port:', dbConfig.port);
console.log('--- END CONFIG CHECK ---');

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    port: dbConfig.port,
    logging: false
});

async function listTables() {
    try {
        await sequelize.authenticate();
        console.log('Connection successful.');

        // List ALL tables
        const [results, metadata] = await sequelize.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')");
        console.log(`Found ${results.length} user tables.`);
        console.log("--- TABLE LIST ---");
        results.forEach(r => console.log(`${r.table_schema}.${r.table_name}`));
        console.log("--- END TABLE LIST ---");

        // Check SequelizeMeta
        try {
            const [metaResults] = await sequelize.query("SELECT * FROM \"SequelizeMeta\"");
            console.log("--- MIGRATIONS ---");
            console.log(metaResults);
        } catch (e) {
            console.log("SequelizeMeta table not found or error:", e.message);
        }

    } catch (error) {
        console.error('Database connection error:', error);
    } finally {
        await sequelize.close();
    }
}

listTables();
