
const { User, sequelize } = require('../src/db/models');
const bcrypt = require('bcryptjs');

const ensureAdmin = async () => {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        // Check for existing admin
        const admin = await User.findOne({ where: { role: 'admin' } });

        if (admin) {
            console.log('-----------------------------------');
            console.log('✅ Admin user found:');
            console.log(`ID: ${admin.id}`);
            console.log(`Name: ${admin.full_name}`);
            console.log(`Phone: ${admin.phone}`);
            console.log(`Role: ${admin.role}`);
            console.log(`MPIN Hash Present: ${!!admin.mpin}`);
            console.log(`Password Hash Present: ${!!admin.password}`);
            console.log('-----------------------------------');

            // Helpful debug: Check if '1234' verifies against stored MPIN
            if (admin.mpin) {
                const isMpinValid = await bcrypt.compare('1234', admin.mpin);
                console.log(`Test Login (MPIN '1234'): ${isMpinValid ? 'SUCCESS' : 'FAILED'}`);
            }
            if (admin.password) {
                const isPassValid = await bcrypt.compare('123456', admin.password);
                console.log(`Test Login (Password '123456'): ${isPassValid ? 'SUCCESS' : 'FAILED'}`);
            }

        } else {
            console.log('❌ No admin user found. Creating one...');

            const newAdmin = await User.create({
                full_name: 'Super Admin',
                phone: '9876543210',
                role: 'admin',
                mpin: await bcrypt.hash('1234', 10), // Default MPIN
                password: await bcrypt.hash('123456', 10), // Default Password
                is_verified: true,
                status: 'active'
            });

            console.log('✅ Admin user created successfully.');
            console.log('Phone: 9876543210');
            console.log('MPIN: 1234');
            console.log('Password: 123456');
        }

    } catch (error) {
        console.error('Error ensuring admin:', error);
    } finally {
        await sequelize.close();
    }
};

ensureAdmin();
