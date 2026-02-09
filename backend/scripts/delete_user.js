const { User, Wallet, sequelize } = require('../src/db/models');

const deleteUser = async (phone) => {
    try {
        const user = await User.findOne({ where: { phone } });
        if (!user) {
            console.log(`User with phone ${phone} not found.`);
            return;
        }

        console.log(`Found user: ${user.full_name} (ID: ${user.id})`);

        // Delete wallet first due to foreign key
        await Wallet.destroy({ where: { user_id: user.id } });
        console.log('Deleted wallet.');

        await user.destroy();
        console.log('Deleted user.');

    } catch (error) {
        console.error('Error deleting user:', error);
    } finally {
        await sequelize.close();
    }
};

const phone = process.argv[2];
if (!phone) {
    console.log('Please provide a phone number. Usage: node scripts/delete_user.js <phone>');
} else {
    deleteUser(phone);
}
