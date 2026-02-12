const {
    User, Wallet, Bid, Deposit, WithdrawRequest, WalletTransaction, Otp, FcmToken
} = require('../../db/models');
const { Op } = require('sequelize');

class AdminService {
    /**
     * Get Dashboard Statistics
     */
    async getDashboardStats() {
        const totalUsers = await User.count({ where: { role: 'user' } });
        const activeUsers = await User.count({ where: { role: 'user', status: 'active' } });

        const totalBids = await Bid.count();
        const totalBidAmount = await Bid.sum('amount') || 0;

        // Calculate total deposits and withdrawals today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayDeposits = await Transaction.sum('amount', {
            where: {
                type: 'deposit',
                status: 'success',
                created_at: { [Op.gte]: startOfDay }
            }
        }) || 0;

        const todayWithdrawals = await Transaction.sum('amount', {
            where: {
                type: 'withdrawal',
                status: 'success',
                created_at: { [Op.gte]: startOfDay }
            }
        }) || 0;

        return {
            users: { total: totalUsers, active: activeUsers },
            bids: { count: totalBids, totalAmount: totalBidAmount },
            finance: { todayDeposits, todayWithdrawals }
        };
    }

    /**
     * Get all users with pagination and search
     */
    async getAllUsers(page = 1, limit = 10, search = '') {
        const offset = (page - 1) * limit;
        const whereClause = { role: 'user' };

        if (search) {
            whereClause[Op.or] = [
                { full_name: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ['password', 'mpin'] },
            include: [{ model: Wallet, as: 'wallet' }],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        return {
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            users: rows
        };
    }

    /**
     * Update user status (block/unblock)
     */
    async updateUserStatus(userId, status) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        user.status = status;
        await user.save();
        return user;
    }

    /**
     * Get pending withdrawals
     */
    async getPendingWithdrawals() {
        return await Transaction.findAll({
            where: { type: 'withdrawal', status: 'pending' },
            include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'phone'] }],
            order: [['created_at', 'ASC']]
        });
    }

    /**
     * Get user history (transactions and withdrawals)
     */
    async getUserHistory(userId) {
        const user = await User.findByPk(userId, {
            include: [{ model: Wallet, as: 'wallet' }]
        });

        if (!user) throw new Error('User not found');

        const transactions = await Transaction.findAll({
            where: { wallet_id: user.wallet.id },
            order: [['created_at', 'DESC']]
        });

        const withdrawals = await WithdrawRequest.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });

        const bids = await Bid.findAll({
            where: { user_id: userId },
            include: [
                { model: Market, as: 'market', attributes: ['name'] },
                { model: GameType, as: 'game_type', attributes: ['name', 'rate'] }
            ],
            order: [['created_at', 'DESC']]
        });

        // Calculate total winnings
        const totalWinnings = await Bid.sum('win_amount', {
            where: {
                user_id: userId,
                status: 'won'
            }
        }) || 0;

        return { transactions, withdrawals, bids, totalWinnings };
    }
    /**
     * Delete user by ID
     * @param {string} userId
     */
    async deleteUser(userId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Delete all related records first to avoid Foreign Key Constraint violations
        // Models: Wallet, Bid, Deposit, WithdrawRequest, WalletTransaction, Otp, FcmToken, ScrapedResult? (no)

        // 1. Delete Wallet and Transactions
        // Wallet depends on User. Transactions depend on Wallet.
        const wallet = await Wallet.findOne({ where: { user_id: userId } });
        if (wallet) {
            await WalletTransaction.destroy({ where: { wallet_id: wallet.id } });
            await wallet.destroy();
        }

        // 2. Delete Bids
        await Bid.destroy({ where: { user_id: userId } });

        // 3. Delete Deposits & Withdrawals
        await Deposit.destroy({ where: { user_id: userId } });
        await WithdrawRequest.destroy({ where: { user_id: userId } });

        // 4. Delete other stuff
        await Otp.destroy({ where: { phone_number: user.phone } });
        await FcmToken.destroy({ where: { user_id: userId } });

        // Finally delete the user
        await user.destroy();
        return { message: 'User deleted successfully' };
    }
}

module.exports = new AdminService();
