// Only load .env in non-production (local development)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const dbConfig = {
    username: process.env.DB_USERNAME || process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
};

// If DATABASE_URL is present (e.g., Render/Heroku), use it preferentially
if (process.env.DATABASE_URL) {
    Object.assign(dbConfig, {
        use_env_variable: 'DATABASE_URL',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        pool: {
            max: 5,
            min: 1,
            acquire: 60000,
            idle: 10000,
            evict: 1000
        }
    });
}

module.exports = {
    development: { ...dbConfig, logging: console.log },
    test: { ...dbConfig, database: process.env.DB_NAME_TEST || 'database_test' },
    production: {
        ...dbConfig,
        logging: false,
        pool: {
            max: 5,
            min: 1,
            acquire: 60000,
            idle: 10000,
            evict: 1000
        }
    }
};
