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

module.exports = db;
