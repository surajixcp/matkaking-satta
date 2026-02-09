const { sequelize, Deposit, User } = require('../src/db/models');

async function debugDB() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // 1. Check Tables
        const [results] = await sequelize.query("SELECT * FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Table Lookups:', results.map(t => t.table_name));

        // 2. Check Users
        const userCount = await User.count();
        console.log('User Count:', userCount);

        if (userCount === 0) {
            console.log('Creating dummy user...');
            await User.create({
                phone: '9999999999',
                full_name: 'Test Admin',
                role: 'admin',
                balance: 0
            });
        }

        // 3. Check Deposits
        const depCount = await Deposit.count();
        console.log('Deposit Count:', depCount);

        // 4. Try Fetch with Include (The failing query)
        console.log('Testing specific query...');
        const deposits = await Deposit.findAndCountAll({
            include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'phone'] }],
            limit: 1
        });
        console.log('Query Success. Rows:', deposits.count);

    } catch (error) {
        console.error('DEBUG ERROR:', error);
    } finally {
        await sequelize.close();
    }
}

debugDB();
