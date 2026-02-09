const { User, Wallet, Bid, Market, Result, Transaction, sequelize } = require('../../db/models');
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
}

module.exports = new AdminService();
