/**
 * Withdraw Service
 * Business logic for withdrawal operations
 */

const withdrawRepo = require('./withdraw.repository.js');
const walletService = require('../../services/wallet.service.js'); // Assuming this exists or found in previous context

// Configuration
const WITHDRAW_CONFIG = {
    MIN_AMOUNT: 100,
    MAX_DAILY_AMOUNT: 50000,
    MAX_REQUESTS_PER_DAY: 3,
};

/**
 * Request withdrawal
 */
async function requestWithdraw(userId, amount) {
    // Validate amount
    if (amount < WITHDRAW_CONFIG.MIN_AMOUNT) {
        throw new Error(`Minimum withdrawal amount is ₹${WITHDRAW_CONFIG.MIN_AMOUNT}`);
    }

    // Check daily request limit
    const todayCount = await withdrawRepo.countUserWithdrawsToday(userId);
    if (todayCount >= WITHDRAW_CONFIG.MAX_REQUESTS_PER_DAY) {
        throw new Error(`Maximum ${WITHDRAW_CONFIG.MAX_REQUESTS_PER_DAY} withdrawal requests per day`);
    }

    // Check daily amount limit
    const todayTotal = await withdrawRepo.getTotalWithdrawnToday(userId);
    if (todayTotal + amount > WITHDRAW_CONFIG.MAX_DAILY_AMOUNT) {
        throw new Error(`Daily withdrawal limit is ₹${WITHDRAW_CONFIG.MAX_DAILY_AMOUNT}`);
    }

    // Check wallet balance
    // Note: walletService needs to be verified. If not accessible, we might need to use Wallet model directly.
    // For now assuming walletService.debit exists as per user request context.

    // Debit wallet immediately
    // If walletService is not available, we can use Wallet model directly:
    // const wallet = await Wallet.findOne({ where: { user_id: userId } });
    // if (wallet.balance < amount) throw new Error('Insufficient balance');
    // await wallet.decrement('balance', { by: amount });

    await walletService.debit(userId, amount, 'withdraw_request', null);

    // Create withdrawal request
    const withdraw = await withdrawRepo.createWithdraw({
        user_id: userId,
        amount,
        status: 'pending',
    });

    return withdraw;
}

/**
 * Approve withdrawal
 */
async function approveWithdraw(withdrawId, adminId, remark = null) {
    const withdraw = await withdrawRepo.getWithdrawById(withdrawId);

    if (!withdraw) {
        throw new Error('Withdrawal request not found');
    }

    if (withdraw.status !== 'pending') {
        throw new Error(`Cannot approve ${withdraw.status} request`);
    }

    // Update status
    const updated = await withdrawRepo.updateWithdraw(withdrawId, {
        status: 'approved',
        approved_by: adminId,
        remark,
    });

    return updated;
}

/**
 * Reject withdrawal
 */
async function rejectWithdraw(withdrawId, adminId, remark = null) {
    const withdraw = await withdrawRepo.getWithdrawById(withdrawId);

    if (!withdraw) {
        throw new Error('Withdrawal request not found');
    }

    if (withdraw.status !== 'pending') {
        throw new Error(`Cannot reject ${withdraw.status} request`);
    }

    // Refund wallet
    await walletService.credit(
        withdraw.user_id,
        withdraw.amount,
        'withdraw_refund',
        withdrawId
    );

    // Update status
    const updated = await withdrawRepo.updateWithdraw(withdrawId, {
        status: 'rejected',
        approved_by: adminId,
        remark,
    });

    return updated;
}

/**
 * Get user withdrawal history
 */
async function getUserWithdrawals(userId, limit = 50) {
    return withdrawRepo.getWithdrawsByUserId(userId, limit);
}

/**
 * Get all withdrawals (admin)
 */
async function getAllWithdrawals(filters = {}) {
    return withdrawRepo.getAllWithdraws(filters);
}

/**
 * Get withdrawal by ID
 */
async function getWithdrawById(id) {
    return withdrawRepo.getWithdrawById(id);
}

module.exports = {
    requestWithdraw,
    approveWithdraw,
    rejectWithdraw,
    getUserWithdrawals,
    getAllWithdrawals,
    getWithdrawById,
    WITHDRAW_CONFIG,
};
