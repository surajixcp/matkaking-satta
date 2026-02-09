const { sequelize, Deposit, Wallet, WalletTransaction, User } = require('../../db/models');
const { Op } = require('sequelize');

class DepositService {
    /**
     * Create a new deposit request
     */
    async createDeposit(userId, data) {
        const { amount, utr, screenshotUrl } = data;

        // Check for duplicate UTR
        const existingup = await Deposit.findOne({ where: { utr_number: utr } });
        if (existingup) {
            throw new Error('UTR number already submitted');
        }

        return await Deposit.create({
            user_id: userId,
            amount,
            utr_number: utr,
            screenshot_url: screenshotUrl,
            status: 'pending'
        });
    }

    /**
     * Get all deposits (Admin)
     */
    async getAllDeposits(filters = {}, limit = 50, offset = 0) {
        const where = {};
        if (filters.status && filters.status !== 'all') where.status = filters.status;
        if (filters.userId) where.user_id = filters.userId;

        return await Deposit.findAndCountAll({
            where,
            include: [
                { model: User, as: 'user', attributes: ['full_name', 'phone'] }
            ],
            distinct: true,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
    }

    /**
     * Approve Deposit
     */
    async approveDeposit(depositId, adminId) {
        const transaction = await sequelize.transaction();
        try {
            const deposit = await Deposit.findByPk(depositId, { transaction });
            if (!deposit) throw new Error('Deposit not found');
            if (deposit.status !== 'pending') throw new Error('Deposit already processed');

            // 1. Update Deposit Status
            deposit.status = 'approved';
            deposit.approved_by = adminId;
            await deposit.save({ transaction });

            // 2. Credit User Wallet
            const wallet = await Wallet.findOne({ where: { user_id: deposit.user_id }, transaction });
            if (!wallet) throw new Error('User wallet not found');

            const newBalance = parseFloat(wallet.balance) + parseFloat(deposit.amount);
            await wallet.update({ balance: newBalance }, { transaction });

            // 3. Create Wallet Transaction
            await WalletTransaction.create({
                wallet_id: wallet.id,
                amount: deposit.amount,
                type: 'deposit',
                description: `Manual Deposit Approved (UTR: ${deposit.utr_number})`,
                reference_id: deposit.id.toString(),
                status: 'success'
            }, { transaction });

            await transaction.commit();
            return deposit;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Reject Deposit
     */
    async rejectDeposit(depositId, adminId, reason) {
        const deposit = await Deposit.findByPk(depositId);
        if (!deposit) throw new Error('Deposit not found');
        if (deposit.status !== 'pending') throw new Error('Deposit already processed');

        deposit.status = 'rejected';
        deposit.approved_by = adminId;
        deposit.admin_remark = reason;
        return await deposit.save();
    }
}

module.exports = new DepositService();
