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

        // 3. Fetch GameType and Validate Digit Format
        const gameType = await GameType.findByPk(gameTypeId);
        if (!gameType) throw new Error('Invalid game type');
        this.validateDigitFormat(gameType.name, digit);

        const transaction = await sequelize.transaction();
        try {
            // 4. Check Wallet Balance & Deduct
            const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction });
            if (!wallet) throw new Error('Wallet not found');

            if (parseFloat(wallet.balance) < amount) {
                throw new Error('Insufficient wallet balance');
            }

            const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
            await wallet.update({ balance: newBalance }, { transaction });

            // 5. Record Wallet Transaction
            await WalletTransaction.create({
                wallet_id: wallet.id,
                amount: amount,
                type: 'bid',
                description: `Bid on Market ${marketId} (${session}) - ${digit}`,
                status: 'success'
            }, { transaction });

            // 6. Create Bid Record
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

        // 4. Fetch GameType and Validate Digit Formats
        const gameType = await GameType.findByPk(gameTypeId);
        if (!gameType) throw new Error('Invalid game type');

        bids.forEach(b => {
            const digit = b.digit || b.number;
            this.validateDigitFormat(gameType.name, digit);
        });

        const transaction = await sequelize.transaction();
        try {
            // 5. Check & Deduct Wallet
            const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction });
            if (!wallet) throw new Error('Wallet not found');

            if (parseFloat(wallet.balance) < totalAmount) {
                throw new Error(`Insufficient wallet balance. Required: ${totalAmount}, Available: ${wallet.balance}`);
            }

            const newBalance = parseFloat(wallet.balance) - totalAmount;
            await wallet.update({ balance: newBalance }, { transaction });

            // 6. Record Wallet Transaction (Bulk Debit)
            await WalletTransaction.create({
                wallet_id: wallet.id,
                amount: totalAmount,
                type: 'bid',
                description: `Bulk Bid on Market ${marketId} (${session}) - ${bids.length} bets`,
                status: 'success'
            }, { transaction });

            // 7. Create Bid Records
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

    /**
     * Helper to validate if a digit matches the rules for a GameType
     */
    validateDigitFormat(gameTypeName, digitStr) {
        if (!digitStr || typeof digitStr !== 'string') {
            throw new Error(`Invalid bet format: number must be a string. Got ${typeof digitStr}`);
        }

        digitStr = digitStr.trim();
        const name = gameTypeName.toLowerCase();

        // 1. Single Digit: exactly 1 numeric digit (0-9)
        if (name.includes('single digit') || name === 'single') {
            if (!/^\d{1}$/.test(digitStr)) throw new Error('Single Digit must be exactly 1 number (0-9).');
        }

        // 2. Jodi Digit: exactly 2 numeric digits (00-99)
        else if (name.includes('jodi') || name.includes('pair')) {
            if (!/^\d{2}$/.test(digitStr)) throw new Error('Jodi must be exactly 2 numbers (00-99).');
        }

        // 3. Single Patti: exactly 3 numeric digits, all unique
        else if (name.includes('single patti') || name.includes('single panna')) {
            if (!/^\d{3}$/.test(digitStr)) throw new Error('Single Patti must be exactly 3 numbers.');
            const d = digitStr.split('');
            if (d[0] === d[1] || d[1] === d[2] || d[0] === d[2]) {
                throw new Error('Single Patti must have 3 unique digits (no repeating numbers).');
            }
        }

        // 4. Double Patti: exactly 3 numeric digits, exactly 2 the same
        else if (name.includes('double patti') || name.includes('double panna')) {
            if (!/^\d{3}$/.test(digitStr)) throw new Error('Double Patti must be exactly 3 numbers.');
            const d = digitStr.split('');
            const isDouble = (d[0] === d[1] && d[1] !== d[2]) ||
                (d[1] === d[2] && d[0] !== d[1]) ||
                (d[0] === d[2] && d[0] !== d[1]);
            if (!isDouble) {
                throw new Error('Double Patti must have exactly 2 repeating numbers (e.g. 112, 225).');
            }
        }

        // 5. Triple Patti: exactly 3 numeric digits, all 3 the same
        else if (name.includes('triple patti') || name.includes('triple panna')) {
            if (!/^\d{3}$/.test(digitStr)) throw new Error('Triple Patti must be exactly 3 numbers.');
            const d = digitStr.split('');
            if (d[0] !== d[1] || d[1] !== d[2]) {
                throw new Error('Triple Patti must have all 3 numbers the same (e.g. 111, 222).');
            }
        }

        // 6. Half Sangam: 3 digits + 1 digit OR 1 digit + 3 digits (e.g. "123-6" or "6-123")
        else if (name.includes('half sangam')) {
            if (!/^(\d{3}-\d{1}|\d{1}-\d{3})$/.test(digitStr)) {
                throw new Error('Half Sangam must be formatted as XXX-Y or Y-XXX (e.g. 123-6 or 6-123).');
            }
        }

        // 7. Full Sangam: 3 digits + 3 digits (e.g. "123-456")
        else if (name.includes('full sangam') || name === 'sangam') {
            if (!/^\d{3}-\d{3}$/.test(digitStr)) {
                throw new Error('Full Sangam must be formatted as XXX-YYY (e.g. 123-456).');
            }
        }

        return true;
    }
}

module.exports = new BidService();
