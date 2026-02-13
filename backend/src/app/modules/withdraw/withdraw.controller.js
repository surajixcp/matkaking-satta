/**
 * Withdraw Controller
 * HTTP handlers for withdrawal endpoints
 */

const withdrawService = require('./withdraw.service.js');

/**
 * Request withdrawal
 */
async function requestWithdraw(req, res) {
    try {
        const { amount } = req.body;
        const userId = req.user.id; // User ID from auth middleware (usually req.user.id or req.user.userId)

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount',
            });
        }

        const withdraw = await withdrawService.requestWithdraw(userId, parseFloat(amount));

        res.status(201).json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            data: withdraw,
        });
    } catch (error) {
        console.error('Request withdraw error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to request withdrawal',
        });
    }
}

/**
 * Get user withdrawal history
 */
async function getWithdrawHistory(req, res) {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;

        const withdrawals = await withdrawService.getUserWithdrawals(userId, limit);

        res.json({
            success: true,
            data: withdrawals,
        });
    } catch (error) {
        console.error('Get withdraw history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawal history',
        });
    }
}

/**
 * Get all withdrawals (admin)
 */
async function getAllWithdrawals(req, res) {
    try {
        const { status, limit } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (limit) filters.limit = parseInt(limit);

        const withdrawals = await withdrawService.getAllWithdrawals(filters);

        res.json({
            success: true,
            data: withdrawals,
        });
    } catch (error) {
        console.error('Get all withdrawals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawals',
        });
    }
}

/**
 * Approve withdrawal (admin)
 */
async function approveWithdrawal(req, res) {
    try {
        const { id } = req.params;
        const { remark } = req.body || {};
        const adminId = req.user.id;

        const withdraw = await withdrawService.approveWithdraw(
            parseInt(id),
            adminId,
            remark
        );

        res.json({
            success: true,
            message: 'Withdrawal approved successfully',
            data: withdraw,
        });
    } catch (error) {
        console.error('Approve withdrawal error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to approve withdrawal',
        });
    }
}

/**
 * Reject withdrawal (admin)
 */
async function rejectWithdrawal(req, res) {
    try {
        const { id } = req.params;
        const { remark } = req.body || {};
        const adminId = req.user.id;

        const withdraw = await withdrawService.rejectWithdraw(
            parseInt(id),
            adminId,
            remark
        );

        res.json({
            success: true,
            message: 'Withdrawal rejected and amount refunded',
            data: withdraw,
        });
    } catch (error) {
        console.error('Reject withdrawal error:', error);
        console.error('Error Stack:', error.stack);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to reject withdrawal',
            details: error.stack
        });
    }
}

module.exports = {
    requestWithdraw,
    getWithdrawHistory,
    getAllWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
};
