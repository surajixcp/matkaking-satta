const { sequelize, Market, Bid, User, GameType } = require('../src/db/models');

async function testDelete() {
    const t = await sequelize.transaction();
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // 1. Create a Test Market
        const market = await Market.create({
            name: 'Delete Test Market',
            open_time: '10:00',
            close_time: '22:00',
            status: true
        }, { transaction: t });

        console.log('Test Market Created:', market.id);

        // 2. Create a User (if needed)
        let user = await User.findOne({ where: { phone: '9999999999' } });
        if (!user) user = await User.create({ phone: '9999999999', full_name: 'Tester', role: 'admin' }, { transaction: t });

        // 3. Create a Bid linked to this market
        let gt = await GameType.findOne();
        if (!gt) gt = await GameType.create({ name: 'Single', key: 'single', rate: 9 }, { transaction: t });

        await Bid.create({
            user_id: user.id,
            market_id: market.id,
            game_type_id: gt.id,
            session: 'open',
            digit: '1',
            amount: 10,
            status: 'pending'
        }, { transaction: t });

        console.log('Linked Bid Created.');

        // 4. Attempt Delete
        console.log('Attempting Delete...');
        await
            await market.destroy({ transaction: t });

        console.log('Delete Successful (Unexpected)');
        await t.commit();

    } catch (error) {
        console.error('DELETE ERROR:', error.message);
        console.error('Code:', error.original ? error.original.code : 'N/A');
        await t.rollback();
    } finally {
        await sequelize.close();
    }
}

testDelete();
