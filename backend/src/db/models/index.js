'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
console.log(`[DB Init] Loading database config for environment: ${env}`);
const config = require('../../config/database')[env];
console.log(`[DB Init] Config loaded:`, JSON.stringify({ ...config, password: '***' }, null, 2));
const db = {};

let sequelize;
if (config.use_env_variable) {
    const connectionString = process.env[config.use_env_variable];
    const options = { ...config };
    delete options.use_env_variable; // Remove this key as it's not a Sequelize option
    sequelize = new Sequelize(connectionString, options);
    console.log(`[DB Init] Using DATABASE_URL with SSL:`, options.dialectOptions?.ssl ? 'enabled' : 'disabled');
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
    console.log(`[DB Init] Using individual credentials`);
}

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== basename &&
            file.slice(-3) === '.js' &&
            file.indexOf('.test.js') === -1
        );
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

/**
 * Ensure database connection with retry mechanism
 * Production-grade reconnection logic with retry limit
 */
async function ensureDBConnection(retries = 5) {
    try {
        await sequelize.authenticate();
        console.log('[DB] Connection verified');
    } catch (error) {
        if (retries === 0) {
            console.error('[DB] Failed permanently after all retries');
            throw error;
        }
        console.log(`[DB] Retry connection... (${retries} attempts remaining)`, error.message);
        await new Promise(r => setTimeout(r, 5000));
        return ensureDBConnection(retries - 1);
    }
}

/**
 * Start heartbeat to prevent Render free DB from sleeping
 * Pings database every 4 minutes
 */
function startHeartbeat() {
    setInterval(async () => {
        try {
            await sequelize.query("SELECT 1");
            console.log('[DB Heartbeat] Ping successful');
        } catch (error) {
            console.error('[DB Heartbeat] Failed:', error.message);
        }
    }, 240000); // 4 minutes
    console.log('[DB] Heartbeat started (4-minute interval)');
}

// Export connection helpers
db.ensureDBConnection = ensureDBConnection;
db.startHeartbeat = startHeartbeat;

module.exports = db;
