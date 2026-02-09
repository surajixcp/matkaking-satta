const { sequelize, Deposit, User } = require('../src/db/models');

async function verifyDeposits() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        const deposits = await Deposit.findAll({
            include: [{ model: User, as: 'user', attributes: ['full_name', 'phone'] }],
            order: [['createdAt', 'DESC']]
        });

        console.log('Deposits Found:', deposits.length);
        deposits.forEach(d => {
            console.log(` - ID: ${d.id}, User: ${d.user?.full_name}, Amount: ${d.amount}, Status: ${d.status}, Date: ${d.createdAt}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

verifyDeposits();
