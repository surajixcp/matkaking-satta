const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

async function checkAdmin() {
    try {
        console.log('\nConnecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected to database\n');

        // Query for admin users
        const [admins] = await sequelize.query(
            "SELECT id, full_name, phone, role, status, mpin IS NOT NULL as has_mpin, password IS NOT NULL as has_password FROM \"Users\" WHERE role = 'admin'"
        );

        if (admins.length === 0) {
            console.log('❌ NO ADMIN USERS FOUND\n');
            console.log('Creating admin user...');

            const hashedMpin = await bcrypt.hash('1234', 10);

            await sequelize.query(
                `INSERT INTO "Users" (full_name, phone, role, mpin, status, is_verified, "createdAt", "updatedAt") 
                 VALUES ('Super Admin', '9876543210', 'admin', :mpin, 'active', true, NOW(), NOW())`,
                {
                    replacements: { mpin: hashedMpin }
                }
            );

            console.log('✅ Admin user created!');
            console.log('Phone: 9876543210');
            console.log('MPIN: 1234\n');
        } else {
            console.log(`✅ Found ${admins.length} admin user(s):\n`);
            admins.forEach((admin, i) => {
                console.log(`Admin #${i + 1}:`);
                console.log(`  ID: ${admin.id}`);
                console.log(`  Name: ${admin.full_name}`);
                console.log(`  Phone: ${admin.phone}`);
                console.log(`  Role: ${admin.role}`);
                console.log(`  Status: ${admin.status}`);
                console.log(`  Has MPIN: ${admin.has_mpin}`);
                console.log(`  Has Password: ${admin.has_password}\n`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

checkAdmin();
