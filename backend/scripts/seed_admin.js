const bcrypt = require('bcryptjs');
const { User, Wallet, sequelize } = require('../src/db/models');

const seedAdmin = async () => {
    try {
        const phone = '9999999999'; // Default Admin Phone
        const mpin = '1234';         // Default Admin MPIN
        const fullName = 'Super Admin';

        console.log(`Seeding Admin... Phone: ${phone}, MPIN: ${mpin}`);

        // Check if exists
        const existing = await User.findOne({ where: { phone } });
        if (existing) {
            console.log('Admin user already exists.');
            // Optional: Update to admin role if not
            if (existing.role !== 'admin') {
                await existing.update({ role: 'admin' });
                console.log('Updated existing user to admin role.');
            }
            return;
        }

        // Hash MPIN (Explicit string conversion, same as fix)
        const mpin_hash = await bcrypt.hash(String(mpin).trim(), 10);

        const transaction = await sequelize.transaction();
        try {
            const user = await User.create({
                phone,
                mpin_hash,
                full_name: fullName,
                role: 'admin',
                status: 'active',
                device_token: 'admin_device_token'
            }, { transaction });

            await Wallet.create({
                user_id: user.id,
                balance: 1000000.00, // Large balance for admin testing
                bonus: 0
            }, { transaction });

            await transaction.commit();
            console.log('✅ Admin created successfully.');
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    } finally {
        await sequelize.close();
    }
};

seedAdmin();
