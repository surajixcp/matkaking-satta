const { sequelize, User, Wallet } = require('../src/db/models');

const checkUsers = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const users = await User.findAll({
            where: { role: 'user' },
            include: [{ model: Wallet, as: 'wallet' }]
        });
        console.log(`Found ${users.length} users.`);
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Name: ${u.full_name}, Phone: ${u.phone}, Wallet Balance: ${u.wallet ? u.wallet.balance : 'No Wallet'}`);
        });
    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await sequelize.close();
    }
};

checkUsers();
