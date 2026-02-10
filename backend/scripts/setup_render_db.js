// Sync all database tables and seed admin user on Render
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { sequelize, User, Wallet } = require('../src/db/models');
const bcrypt = require('bcryptjs');

// Admin credentials
const ADMIN_PHONE = '9999999999';
const ADMIN_MPIN = '1234';
const ADMIN_NAME = 'Super Admin';

async function syncAndSeed() {
    try {
        console.log('🔗 Connecting to Render database...');
        console.log('URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'Not found');

        // Test connection with retry
        let retries = 5;
        while (retries > 0) {
            try {
                await sequelize.authenticate();
                console.log('✅ Database connection established\n');
                break;
            } catch (error) {
                retries--;
                if (retries === 0) throw error;
                console.log(`⏳ Retrying connection... (${retries} attempts remaining)`);
                await new Promise(r => setTimeout(r, 5000));
            }
        }

        // Sync all models (create tables)
        console.log('📋 Syncing database models...');
        console.log('⚠️  This will create all tables if they don\'t exist\n');

        await sequelize.sync({ alter: false }); // Use alter: true to modify existing tables
        console.log('✅ All tables synced successfully\n');

        // List all tables
        const [tables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('📋 Tables in database:');
        tables.forEach(t => console.log('  ✓', t.table_name));
        console.log('');

        // Check if admin user exists
        console.log('👤 Checking for admin user...');
        const existingAdmin = await User.findOne({
            where: { phone: ADMIN_PHONE }
        });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists');

            // Update to admin role if needed
            if (existingAdmin.role !== 'admin') {
                await existingAdmin.update({ role: 'admin' });
                console.log('✅ Updated existing user to admin role');
            }

            // Check wallet
            const wallet = await Wallet.findOne({
                where: { user_id: existingAdmin.id }
            });

            if (wallet) {
                console.log(`💰 Wallet balance: ₹${wallet.balance.toLocaleString('en-IN')}`);
            }

            console.log('\n📋 Admin Credentials:');
            console.log('   Phone:', ADMIN_PHONE);
            console.log('   MPIN:', ADMIN_MPIN);
            console.log('   Name:', existingAdmin.full_name);
            console.log('   Role:', existingAdmin.role);

        } else {
            // Create admin user
            console.log('🔐 Creating admin user...');

            const mpinHash = await bcrypt.hash(String(ADMIN_MPIN).trim(), 10);

            const transaction = await sequelize.transaction();

            try {
                const admin = await User.create({
                    phone: ADMIN_PHONE,
                    mpin_hash: mpinHash,
                    full_name: ADMIN_NAME,
                    role: 'admin',
                    status: 'active',
                    device_token: 'admin_device_token'
                }, { transaction });

                console.log('✅ Admin user created with ID:', admin.id);

                await Wallet.create({
                    user_id: admin.id,
                    balance: 1000000.00,
                    bonus: 0
                }, { transaction });

                console.log('✅ Admin wallet created with balance: ₹1,000,000');

                await transaction.commit();

                console.log('\n🎉 Admin user created successfully!');
                console.log('\n📋 Admin Credentials:');
                console.log('   Phone:', ADMIN_PHONE);
                console.log('   MPIN:', ADMIN_MPIN);
                console.log('   Name:', ADMIN_NAME);
                console.log('   Role: admin');
                console.log('   Wallet Balance: ₹1,000,000');

            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        }

        console.log('\n✅ Database setup complete!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.parent) {
            console.error('Database error:', error.parent.message);
        }
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('\n🔌 Database connection closed');
    }
}

syncAndSeed();
