const { sequelize, Deposit, Wallet, WalletTransaction, User, ReferralSetting, ReferralTransaction } = require('../../db/models');
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

            // 4. Process Referral Bonus
            const user = await User.findByPk(deposit.user_id, { transaction });
            if (user && user.referred_by) {
                // Get Settings
                let settings = await ReferralSetting.findOne({ transaction });
                if (!settings) {
                    // Create default settings if not exists
                    settings = { bonus_amount: 50, min_deposit_amount: 500, is_enabled: true };
                }

                if (settings.is_enabled && parseFloat(deposit.amount) >= parseFloat(settings.min_deposit_amount)) {
                    // Check if bonus already given
                    const existingBonus = await ReferralTransaction.findOne({
                        where: { referred_id: user.id },
                        transaction
                    });

                    if (!existingBonus) {
                        // Credit Referrer
                        const referrerWallet = await Wallet.findOne({ where: { user_id: user.referred_by }, transaction });

                        if (referrerWallet) {
                            const bonus = parseFloat(settings.bonus_amount);

                            // Update Referrer Wallet
                            await referrerWallet.update({
                                balance: parseFloat(referrerWallet.balance) + bonus
                            }, { transaction });

                            // Log Wallet Transaction (Referrer)
                            await WalletTransaction.create({
                                wallet_id: referrerWallet.id,
                                amount: bonus,
                                type: 'deposit', // specific type 'bonus' would be better but 'deposit' increases balance
                                description: `Referral Bonus: ${user.phone}`,
                                status: 'success'
                            }, { transaction });

                            // Log Referral Transaction
                            await ReferralTransaction.create({
                                referrer_id: user.referred_by,
                                referred_id: user.id,
                                amount: bonus,
                                type: 'bonus',
                                status: 'completed'
                            }, { transaction });
                        }
                    }
                }
            }

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
