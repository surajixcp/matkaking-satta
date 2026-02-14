const { sequelize, Role, Admin } = require('./src/db/models');
const bcrypt = require('bcryptjs');

async function verify() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        // Seed Super Admin role if not exists
        let [superAdminRole] = await Role.findOrCreate({
            where: { name: 'Super Admin' },
            defaults: {
                permissions: {
                    user_view: true,
                    user_edit: true,
                    user_delete: true,
                    market_manage: true,
                    result_declare: true,
                    withdraw_approve: true,
                    deposit_approve: true,
                    settings_edit: true,
                    rbac_manage: true
                },
                description: 'Full system access'
            }
        });

        console.log('Super Admin role verified.');

        const adminPhone = '9999999999';
        let admin = await Admin.findOne({ where: { phone: adminPhone } });
        if (!admin) {
            const pinHash = await bcrypt.hash('1234', 10);
            admin = await Admin.create({
                full_name: 'Super Admin',
                phone: adminPhone,
                pin_hash: pinHash,
                role_id: superAdminRole.id,
                status: 'active'
            });
            console.log('✅ Super Admin account created: 9999999999 / 1234');
        } else {
            console.log('ℹ️ Super Admin account already exists.');
            // Ensure it has the correct role
            await admin.update({ role_id: superAdminRole.id, status: 'active' });
            console.log('✅ Super Admin account permissions updated.');
        }

        console.log('Verification script completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        if (error.message.includes('getaddrinfo')) {
            console.error('\n⚠️  CONNECTION ERROR: It seems you are trying to connect to a Render internal hostname from your local machine.');
            console.error('Please update the DATABASE_URL in your backend/.env to the EXTERNAL Database URL provided by Render.');
        }
        process.exit(1);
    }
}

verify();
