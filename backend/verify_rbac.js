const { sequelize, Role, Admin } = require('./src/db/models');
const bcrypt = require('bcryptjs');

async function verify() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Running migrations...');
        // We can't easily run sequelize migrations from here without umzug, 
        // but we can sync the models or run the specific SQL if needed.
        // For verification, let's just try to create the tables if they don't exist.
        await sequelize.sync({ alter: true });
        console.log('Database synced.');

        // Seed Super Admin if not exists
        let superAdminRole = await Role.findOne({ where: { name: 'Super Admin' } });
        if (!superAdminRole) {
            superAdminRole = await Role.create({
                name: 'Super Admin',
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
            });
            console.log('Super Admin role created.');
        }

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
            console.log('Super Admin account created: 9999999999 / 1234');
        } else {
            console.log('Super Admin account already exists.');
        }

        console.log('Verification script completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verify();
