
const { sequelize, User } = require('./src/db/models');

async function checkBankDetails() {
    try {
        console.log('🔄 Connecting to DB...');
        // Find the most recently updated use
        const user = await User.findOne({
            order: [['updatedAt', 'DESC']],
        });

        if (user) {
            console.log('✅ Found User:', user.full_name || user.phone);
            console.log('--------------------------------------------------');
            console.log('Bank Name:', user.bank_name);
            console.log('Account Number:', user.account_number);
            console.log('IFSC Code:', user.ifsc_code);
            console.log('Holder Name:', user.account_holder_name);
            console.log('UPI ID:', user.upi_id);
            console.log('--------------------------------------------------');
        } else {
            console.log('❌ No users found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkBankDetails();
