const { sequelize, Bid, Wallet, WalletTransaction, GameType, Market, User } = require('../../db/models');
const { Op } = require('sequelize');
const marketsService = require('./markets.service');

class BidService {
    /**
     * Place a bid
     * @param {Object} data { userId, marketId, gameTypeId, session, digit, amount }
     */
    async placeBid(data) {
        const { userId, marketId, gameTypeId, session, digit, amount } = data;

        // 1. Validate Amount
        if (amount < 10) throw new Error('Minimum bid amount is 10');

        // 2. Check Market Status
        const isOpen = await marketsService.isMarketOpen(marketId, session);
        if (!isOpen) throw new Error('Market is closed for betting');

        const transaction = await sequelize.transaction();
        try {
            // 3. Check Wallet Balance & Deduct
            const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction });
            if (!wallet) throw new Error('Wallet not found');

            if (parseFloat(wallet.balance) < amount) {
                throw new Error('Insufficient wallet balance');
            }

            const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
            await wallet.update({ balance: newBalance }, { transaction });

            // 4. Record Wallet Transaction
            await WalletTransaction.create({
                wallet_id: wallet.id,
                amount: amount,
                type: 'bid',
                description: `Bid on Market ${marketId} (${session}) - ${digit}`,
                status: 'success'
            }, { transaction });

            // 5. Create Bid Record
            const bid = await Bid.create({
                user_id: userId,
                market_id: marketId,
                game_type_id: gameTypeId,
                session,
                digit,
                amount,
                status: 'pending'
            }, { transaction });

            await transaction.commit();
            return bid;

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get User Bids
     */
    async getUserBids(userId, limit = 50, offset = 0) {
        return await Bid.findAndCountAll({
            where: { user_id: userId },
            include: [
                { model: Market, as: 'market', attributes: ['name'] },
                { model: GameType, as: 'game_type', attributes: ['name', 'rate'] }
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
    }

    /**
     * Place multiple bids transactionally
     * @param {Object} data { userId, marketId, gameTypeId, session, bids: [{ digit, amount }] }
     */
    async placeBids(data) {
        const { userId, marketId, gameTypeId, session, bids } = data;

        if (!bids || !Array.isArray(bids) || bids.length === 0) {
            throw new Error('No bids provided');
        }

        // 1. Calculate Total Amount
        const totalAmount = bids.reduce((sum, b) => sum + parseFloat(b.amount), 0);

        // 2. Validate Minimums (checking each bid)
        bids.forEach(b => {
            if (parseFloat(b.amount) < 10) throw new Error(`Minimum bid amount is 10. Invalid bid on ${b.digit}`);
        });

        // 3. Check Market Status
        const isOpen = await marketsService.isMarketOpen(marketId, session);
        if (!isOpen) throw new Error('Market is closed for betting');

        const transaction = await sequelize.transaction();
        try {
            // 4. Check & Deduct Wallet
            const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction });
            if (!wallet) throw new Error('Wallet not found');

            if (parseFloat(wallet.balance) < totalAmount) {
                throw new Error(`Insufficient wallet balance. Required: ${totalAmount}, Available: ${wallet.balance}`);
            }

            const newBalance = parseFloat(wallet.balance) - totalAmount;
            await wallet.update({ balance: newBalance }, { transaction });

            // 5. Record Wallet Transaction (Bulk Debit)
            await WalletTransaction.create({
                wallet_id: wallet.id,
                amount: totalAmount,
                type: 'bid',
                description: `Bulk Bid on Market ${marketId} (${session}) - ${bids.length} bets`,
                status: 'success'
            }, { transaction });

            // 6. Create Bid Records
            const bidRecords = bids.map(b => ({
                user_id: userId,
                market_id: marketId,
                game_type_id: gameTypeId,
                session,
                digit: b.digit || b.number, // Frontend sends 'number', backend schema uses 'digit'
                amount: parseFloat(b.amount),
                status: 'pending'
            }));

            const createdBids = await Bid.bulkCreate(bidRecords, { transaction });

            await transaction.commit();
            return { bids: createdBids, totalAmount, newBalance };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    /**
     * Get All Bids (Admin)
     */
    async getAllBids(filters = {}, limit = 50, offset = 0) {
        const where = {};
        const { marketId, session, date, userId } = filters;

        if (marketId) where.market_id = marketId;
        if (session) where.session = session;
        if (userId) where.user_id = userId;

        // Date Filter (Specific Date)
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // Assuming we filter by createdAt
            const { Op } = require('sequelize'); // Make sure Op is available or passed in
            where.createdAt = {
                [Op.between]: [startOfDay, endOfDay]
            };
        }

        return await Bid.findAndCountAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['full_name', 'phone'] },
                { model: Market, as: 'market', attributes: ['name'] },
                { model: GameType, as: 'game_type', attributes: ['name', 'rate'] }
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
    }
}

module.exports = new BidService();
