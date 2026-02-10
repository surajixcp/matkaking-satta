// Test Render database connection with new SSL config
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { Sequelize } = require('sequelize');

async function testRenderConnection() {
    console.log('Testing Render PostgreSQL connection...\n');

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL not found');
        process.exit(1);
    }

    console.log('📋 Connection Details:');
    console.log('URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
    console.log('SSL Flag:', databaseUrl.includes('?ssl=true') ? '✅ Present' : '❌ Missing');
    console.log('');

    const sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
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

    console.log('🔗 Attempting connection...');

    try {
        await sequelize.authenticate();
        console.log('✅ Connection successful!\n');

        // List tables
        const [tables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('📋 Tables in database:');
        tables.forEach(t => console.log('  -', t.table_name));

        console.log('\n✅ All tests passed!');

    } catch (error) {
        console.error('\n❌ Connection failed:');
        console.error('Error:', error.message);
        if (error.parent) {
            console.error('Details:', error.parent.message);
        }
    } finally {
        await sequelize.close();
    }
}

testRenderConnection();
