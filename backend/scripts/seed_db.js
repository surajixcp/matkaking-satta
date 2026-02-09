const { sequelize, User, Deposit, Market, GameType, Bid, Wallet } = require('../src/db/models');

async function seed() {
    const t = await sequelize.transaction();
    try {
        console.log('Syncing...');
        // We do NOT use sync() as it might alter schemas strictly. We rely on migrations.
        // But we can check if tables exist by trying to count.

        // 1. Ensure User
        console.log('Checking User...');
        let user = await User.findOne({ where: { phone: '9876543210' } });
        if (!user) {
            console.log('Creating User...');
            user = await User.create({
                phone: '9876543210',
                full_name: 'Demo User',
                role: 'user',
                status: 'active'
            }, { transaction: t });

            await Wallet.create({ user_id: user.id, balance: 0 }, { transaction: t });
        }

        // 2. Ensure GameType
        console.log('Checking GameTypes...');
        let gt = await GameType.findOne({ where: { key: 'single' } });
        if (!gt) {
            console.log('Creating GameType...');
            gt = await GameType.create({
                name: 'Single Digit',
                key: 'single',
                rate: 9, // 10 ka 90
                description: 'Single Digit Game'
            }, { transaction: t });
        }

        // 3. Ensure Market
        console.log('Checking Markets...');
        let market = await Market.findOne({ where: { name: 'Kalyan' } });
        if (!market) {
            console.log('Creating Market...');
            market = await Market.create({
                name: 'Kalyan',
                open_time: '10:00',
                close_time: '22:00',
                status: true
            }, { transaction: t });
        }

        // 4. Create Pending Deposit
        console.log('Creating Test Deposit...');
        // Check duplication
        const existingDep = await Deposit.findOne({ where: { utr_number: 'UTR123456789' } });
        if (!existingDep) {
            await Deposit.create({
                user_id: user.id,
                amount: 500,
                utr_number: 'UTR123456789',
                status: 'pending',
                admin_remark: null
            }, { transaction: t });
            console.log('Deposit created.');
        } else {
            console.log('Test Deposit already exists.');
        }

        // 5. Create Test Bid
        console.log('Creating Test Bid...');
        await Bid.create({
            user_id: user.id,
            market_id: market.id,
            game_type_id: gt.id,
            session: 'open',
            digit: '5',
            amount: 100,
            status: 'pending'
        }, { transaction: t });
        console.log('Bid created.');

        await t.commit();
        console.log('Seed Successful!');

    } catch (error) {
        await t.rollback();
        console.error('SEED ERROR:', error);
    } finally {
        await sequelize.close();
    }
}

seed();
