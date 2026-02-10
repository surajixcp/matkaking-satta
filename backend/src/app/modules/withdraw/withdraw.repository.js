/**
 * Withdraw Repository
 * Database layer for withdrawal operations using Sequelize
 */

const { WithdrawRequest, User, sequelize } = require('../../../db/models');
const { Op } = require('sequelize');

/**
 * Create a new withdrawal request
 */
async function createWithdraw(data) {
    return await WithdrawRequest.create({
        user_id: data.user_id,
        amount: data.amount,
        status: data.status || 'pending',
        admin_remark: data.remark || null,
        bank_details: data.bank_details || null, // Should capture snapshot of user's bank details
    });
}

/**
 * Get withdrawal by ID
 */
async function getWithdrawById(id) {
    return await WithdrawRequest.findByPk(id, {
        include: [
            { model: User, as: 'user', attributes: ['id', 'full_name', 'phone', 'username'] },
            { model: User, as: 'approver', attributes: ['id', 'full_name', 'username'] }
        ]
    });
}

/**
 * Get withdrawals by user ID
 */
async function getWithdrawsByUserId(userId, limit = 50) {
    return await WithdrawRequest.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
        limit: limit
    });
}

/**
 * Get all withdrawals with filters
 */
async function getAllWithdraws(filters = {}) {
    const query = {
        where: {},
        include: [
            { model: User, as: 'user', attributes: ['id', 'full_name', 'phone', 'username'] }
        ],
        order: [['createdAt', 'DESC']],
    };

    if (filters.status) {
        query.where.status = filters.status;
    }

    if (filters.limit) {
        query.limit = filters.limit;
    }

    return await WithdrawRequest.findAll(query);
}

/**
 * Update withdrawal status
 */
async function updateWithdraw(id, data) {
    const [updatedCount] = await WithdrawRequest.update(data, {
        where: { id }
    });

    if (updatedCount === 0) return null;
    return await getWithdrawById(id);
}

/**
 * Count user withdrawals today
 */
async function countUserWithdrawsToday(userId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return await WithdrawRequest.count({
        where: {
            user_id: userId,
            createdAt: {
                [Op.gte]: startOfDay
            }
        }
    });
}

/**
 * Get total withdrawn amount today for user
 */
async function getTotalWithdrawnToday(userId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await WithdrawRequest.sum('amount', {
        where: {
            user_id: userId,
            createdAt: {
                [Op.gte]: startOfDay
            },
            status: {
                [Op.in]: ['pending', 'approved']
            }
        }
    });

    return result || 0;
}

module.exports = {
    createWithdraw,
    getWithdrawById,
    getWithdrawsByUserId,
    getAllWithdraws,
    updateWithdraw,
    countUserWithdrawsToday,
    getTotalWithdrawnToday,
};
