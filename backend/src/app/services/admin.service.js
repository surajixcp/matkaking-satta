User, Wallet, Bid, Deposit, WithdrawRequest, WalletTransaction, Otp, FcmToken, sequelize
} = require('../../db/models');
const { Op } = require('sequelize');

class AdminService {
    /**
     * Get Dashboard Statistics
     */
    async getDashboardStats() {
        const totalUsers = await User.count({ where: { role: 'user' } });
        const activeUsers = await User.count({ where: { role: 'user', status: 'active' } });

        // Change 'activeBets' logic: Users with active status? Or actual active bids?
        // Frontend expects "Market Bids". Let's show total bids today.
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todaysBids = await Bid.count({
            where: { createdAt: { [Op.gte]: startOfDay } }
        });

        const totalBidAmount = await Bid.sum('amount') || 0;

        // Daily Revenue & Withdrawals
        const todayDeposits = await WalletTransaction.sum('amount', {
            where: {
                type: 'deposit',
                status: 'success',
                createdAt: { [Op.gte]: startOfDay }
            }
        }) || 0;

        const todayWithdrawals = await WithdrawRequest.count({
            where: {
                status: 'pending'
            }
        }); // "Payout Requests" usually implies pending ones

        // --- Charts Data ---

        // 1. User Acquisition (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const userAcquisitionData = await User.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                role: 'user',
                createdAt: { [Op.gte]: sevenDaysAgo }
            },
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
            raw: true
        });

        // 2. Revenue Performance (Last 7 Days)
        const revenueData = await WalletTransaction.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            where: {
                type: 'deposit',
                status: 'success',
                createdAt: { [Op.gte]: sevenDaysAgo }
            },
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
            raw: true
        });

        // 3. Recent Audit Logs
        const recentActivity = await WalletTransaction.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: [{
                model: Wallet,
                as: 'wallet',
                include: [{ model: User, as: 'user', attributes: ['id', 'full_name'] }]
            }]
        });

        // Process Charts Data into consistent format for frontend
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

            const userEntry = userAcquisitionData.find(x => x.date === dateStr);
            const revEntry = revenueData.find(x => x.date === dateStr);

            last7Days.push({
                name: dayName,
                date: dateStr,
                users: userEntry ? parseInt(userEntry.count) : 0,
                revenue: revEntry ? parseFloat(revEntry.total) : 0
            });
        }

        // Process Activity Log
        const activityLog = recentActivity.map(txn => ({
            id: txn.id,
            user: txn.wallet?.user?.full_name || 'Unknown',
            type: txn.type,
            amount: parseFloat(txn.amount),
            date: txn.createdAt,
            description: txn.description
        }));

        return {
            stats: {
                totalUsers,
                marketBids: todaysBids,
                dailyRevenue: todayDeposits,
                payoutRequests: todayWithdrawals
            },
            charts: last7Days,
            recentActivity: activityLog
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
