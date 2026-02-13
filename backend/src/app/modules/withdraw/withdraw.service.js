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
const { WalletTransaction } = require('../../../db/models');

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

    // Create withdrawal request FIRST (Pending)
    const withdraw = await withdrawRepo.createWithdraw({
        user_id: userId,
        amount,
        status: 'pending',
    });

    try {
        // Debit wallet immediately
        // Pass withdraw.id as referenceId to link transaction
        await walletService.debit(userId, amount, 'Withdrawal Request', withdraw.id.toString());
        return withdraw;
    } catch (error) {
        // If debit fails (e.g. insufficient balance), delete the request
        // We need to use a raw query or add a method to repo, or just use the model directly if needed.
        // But since we have withdrawRepo, let's assume we can delete or we just leave it as failed? 
        // Better to delete. 
        // Since we don't have delete method in repo exposed, let's try to update it to 'failed' or use direct model if available.
        // Actually, let's just use the repo's update to set it to 'rejected'/failed or similar if we can't delete. 
        // Or better, let's just throw and let the user handle it? No, we created a record.
        // Let's add a delete/destroy to repo or just direct import Model here?
        // For now, let's just mark it as 'rejected' with remark 'Insufficient Balance'
        // But the user didn't even get to submit it technically.
        // Let's use the withdraw instance if it's a sequelize model.
        if (withdraw && typeof withdraw.destroy === 'function') {
            await withdraw.destroy();
        }
        throw error;
    }
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
        admin_remark: remark,
    });

    // Sync Wallet Transaction Status
    const walletTxn = await WalletTransaction.findOne({
        where: {
            reference_id: withdrawId.toString(),
            type: 'withdraw'
        }
    });

    if (walletTxn) {
        walletTxn.status = 'success';
        await walletTxn.save();
    }

    return updated;
}

/**
 * Reject withdrawal
 */
async function rejectWithdraw(withdrawId, adminId, remark = null) {
    console.log(`[WithdrawService] Rejecting withdrawal #${withdrawId} by admin ${adminId}`);
    const withdraw = await withdrawRepo.getWithdrawById(withdrawId);

    if (!withdraw) {
        throw new Error('Withdrawal request not found');
    }

    if (withdraw.status !== 'pending') {
        throw new Error(`Cannot reject ${withdraw.status} request`);
    }

    // Refund wallet
    console.log(`[WithdrawService] Refunding user ${withdraw.user_id} amount ${withdraw.amount}`);
    try {
        await walletService.credit(
            withdraw.user_id,
            parseFloat(withdraw.amount), // Ensure float
            'Withdrawal Refund',
            withdrawId.toString()
        );
        console.log(`[WithdrawService] Refund successful`);
    } catch (err) {
        console.error(`[WithdrawService] Refund failed:`, err);
        throw err;
    }

    // Update status
    const updated = await withdrawRepo.updateWithdraw(withdrawId, {
        status: 'rejected',
        approved_by: adminId,
        admin_remark: remark,
    });

    // Sync Wallet Transaction Status (The original debit should count as failed/rejected)
    const walletTxn = await WalletTransaction.findOne({
        where: {
            reference_id: withdrawId.toString(),
            type: 'withdraw'
        }
    });

    if (walletTxn) {
        walletTxn.status = 'failed';
        walletTxn.description += ` (Rejected: ${remark || 'Admin'})`;
        await walletTxn.save();
    }

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
