const { sequelize, Deposit, User } = require('../src/db/models');

async function seedSuraj() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        const user = await User.findOne({ where: { phone: '7302629920' } }); // Suraj Giri
        if (!user) {
            console.log('User Suraj Giri not found!');
            return;
        }

        console.log('Creating Deposit for User:', user.full_name, 'ID:', user.id);

        await Deposit.create({
            user_id: user.id,
            amount: 1000,
            utr_number: 'UTR_SURAJ_' + Date.now(),
            status: 'pending',
            screenshot_url: 'https://via.placeholder.com/150'
        });

        console.log('Deposit Created Successfully!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

seedSuraj();
