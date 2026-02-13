const { sequelize, User, Wallet, WalletTransaction, WithdrawRequest } = require('../../db/models');

class WalletService {
    /**
     * Get user wallet balance
     */
    async getBalance(userId) {
        let wallet = await Wallet.findOne({ where: { user_id: userId } });
        if (!wallet) {
            // Auto-create wallet if missing (self-healing)
            wallet = await Wallet.create({
                user_id: userId,
                balance: 0.00,
                status: 'active'
            });
        }
        return wallet;
    }

    /**
     * Request Deposit (User initiated)
     */
    async requestDeposit(userId, amount, paymentDetails) {
        const transaction = await sequelize.transaction();
        try {
            const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction });
            if (!wallet) throw new Error('Wallet not found');

            // Record Transaction as PENDING (Do not add balance yet)
            const walletTxn = await WalletTransaction.create({
                wallet_id: wallet.id,
                amount: amount,
                type: 'deposit',
                description: `Deposit Request (${paymentDetails.method})`,
                reference_id: paymentDetails.utr, // Store UTR/Ref
                status: 'pending',
                screenshot_url: paymentDetails.screenshot_url,
                metadata: paymentDetails // Store full details if needed
            }, { transaction });

            await transaction.commit();
            return walletTxn;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Add funds (Admin manual or Payment Gateway callback)
     * Uses atomic transaction
     */
    async addFunds(userId, amount, referenceId, description = 'Deposit') {
        const transaction = await sequelize.transaction();
        try {
            const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction });
            if (!wallet) throw new Error('Wallet not found');

            // Update Balance
            const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
            await wallet.update({ balance: newBalance }, { transaction });

            // Record Transaction
            await WalletTransaction.create({
                wallet_id: wallet.id,
                amount: amount,
                type: 'deposit',
                description,
                reference_id: referenceId,
                status: 'success'
            }, { transaction });

            await transaction.commit();
            return wallet;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Debit funds from wallet (for withdrawals, bets, etc.)
     * Uses atomic transaction
     */
    async debit(userId, amount, description = 'Debit', referenceId = null) {
        const transaction = await sequelize.transaction();
        try {
            const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction });
            if (!wallet) throw new Error('Wallet not found');

            // Check balance
            if (parseFloat(wallet.balance) < parseFloat(amount)) {
                throw new Error('Insufficient balance');
            }

            // Update Balance
            const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
            await wallet.update({ balance: newBalance }, { transaction });

            // Record Transaction
            await WalletTransaction.create({
                wallet_id: wallet.id,
                amount: amount,
                type: 'withdraw',
                description,
                reference_id: referenceId,
                status: 'pending'
            }, { transaction });

            await transaction.commit();
            return wallet;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Credit funds to wallet (for refunds, wins, etc.)
     * Uses atomic transaction
     */
    async credit(userId, amount, description = 'Credit', referenceId = null) {
        const transaction = await sequelize.transaction();
        try {
            const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction });
            if (!wallet) throw new Error('Wallet not found');

            // Update Balance
            const newBalance = parseFloat(wallet.balance) + parseFloat(amount);
            console.log(`[WalletService] Credit User ${userId}: Amount ${amount}, Old ${wallet.balance}, New ${newBalance}`);
            await wallet.update({ balance: newBalance }, { transaction });

            // Record Transaction
            await WalletTransaction.create({
                wallet_id: wallet.id,
                amount: amount,
                type: 'deposit',
                description,
                reference_id: referenceId,
                status: 'success'
            }, { transaction });

            await transaction.commit();
            return wallet;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Request Withdrawal
     */
    async requestWithdraw(userId, amount, bankDetails) {
        const transaction = await sequelize.transaction();
        try {
            const wallet = await Wallet.findOne({ where: { user_id: userId }, transaction });
            if (!wallet) throw new Error('Wallet not found');

            if (parseFloat(wallet.balance) < parseFloat(amount)) {
                throw new Error('Insufficient balance');
            }

            // Deduct balance immediately or freeze it? 
            // Requirement says "After approval, payment processed". 
            // Usually best practice is to deduct immediately to prevent double spend.
            const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
            await wallet.update({ balance: newBalance }, { transaction });

            // Create Request
            const request = await WithdrawRequest.create({
                user_id: userId,
                amount,
                bank_details: bankDetails,
                status: 'pending'
            }, { transaction });

            // Record Transaction
            await WalletTransaction.create({
                wallet_id: wallet.id,
                amount: amount,
                type: 'withdraw',
                description: 'Withdrawal Request',
                reference_id: request.id.toString(),
                status: 'pending' // Pending until approved
            }, { transaction });

            await transaction.commit();
            return request;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get Transaction History
     */
    async getHistory(userId, limit = 20, offset = 0) {
        const wallet = await Wallet.findOne({ where: { user_id: userId } });
        if (!wallet) throw new Error('Wallet not found');

        // Fetch Wallet Transactions
        const transactions = await WalletTransaction.findAll({
            where: { wallet_id: wallet.id },
            order: [['createdAt', 'DESC']],
            limit: limit * 2 // Fetch more to allow for merging/deduping
        });

        // Fetch Deposits (Pending/Rejected/Approved)
        // We need all of them to show history of requests
        const { Deposit } = require('../../db/models');
        const deposits = await Deposit.findAll({
            where: { user_id: userId },
            order: [['createdAt', 'DESC']],
            limit: limit * 2
        });

        // Merge and Map
        // Strategy: 
        // 1. Convert all to a unified structure
        // 2. Sort by date DESC
        // 3. Slice to limit/offset

        const unifiedHistory = [];

        // Add Transactions
        transactions.forEach(t => {
            unifiedHistory.push({
                id: `txn_${t.id}`,
                type: t.type, // 'deposit', 'withdraw', 'bid', 'win'
                amount: t.amount,
                status: t.status, // 'success', 'pending', 'failed'
                description: t.description,
                reference: t.reference_id,
                date: t.createdAt,
                // source: 'transaction'
            });
        });

        // Add Deposits (Pending & Rejected only, or all?)
        // If we add 'approved' deposits here, they might duplicate with 'success' transactions
        // logic:
        // - If deposit is pending -> Add it (it's not in transactions yet)
        // - If deposit is rejected -> Add it (it's not in transactions)
        // - If deposit is approved -> It SHOULD be in transactions. 
        //   However, to be safe and avoid duplicates, we can check if a transaction with reference_id == deposit.utr exists?
        //   Actually, wallet.controller.js saves 'reference_id: deposit.id' now for manual approvals?
        //   Let's just add Pending and Rejected deposits for now.
        //   Wait, 'approved' manual deposits create a transaction with ref_id = deposit.id.

        deposits.forEach(d => {
            if (d.status !== 'approved') {
                unifiedHistory.push({
                    id: `dep_${d.id}`,
                    type: 'deposit',
                    amount: d.amount,
                    status: d.status, // 'pending', 'rejected'
                    description: d.status === 'rejected' ? `Deposit Rejected: ${d.admin_remark || ''}` : 'Deposit Request',
                    reference: d.utr_number,
                    date: d.createdAt,
                    // source: 'deposit_request'
                });
            }
        });

        // Sort by date DESC
        unifiedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Pagination (Manual slice since we merged lists)
        const paginated = unifiedHistory.slice(offset, offset + parseInt(limit));

        return {
            count: unifiedHistory.length, // Approximate count
            rows: paginated
        };
    }

    /**
     * Get All Withdrawal Requests (Admin)
     */
    async getAllWithdrawals(status, limit = 50, offset = 0) {
        const where = {};
        if (status && status !== 'all') where.status = status;

        return await WithdrawRequest.findAndCountAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['username', 'phone_number'] }],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
    }

    /**
     * Approve Withdrawal
     */
    async approveWithdrawal(requestId) {
        const transaction = await sequelize.transaction();
        try {
            const request = await WithdrawRequest.findByPk(requestId, { transaction });
            if (!request) throw new Error('Request not found');
            if (request.status !== 'pending') throw new Error('Request already processed');

            // 1. Mark Request as Approved
            request.status = 'approved';
            await request.save({ transaction });

            // 2. Find and Update Wallet Transaction
            const walletTxn = await WalletTransaction.findOne({
                where: { reference_id: requestId.toString(), type: 'withdraw' },
                transaction
            });

            if (walletTxn) {
                walletTxn.status = 'success';
                await walletTxn.save({ transaction });
            }

            // Note: Balance was already deducted at request time. No further balance change needed.

            await transaction.commit();
            return request;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Reject Withdrawal (Refund)
     */
    async rejectWithdrawal(requestId, reason) {
        const transaction = await sequelize.transaction();
        try {
            const request = await WithdrawRequest.findByPk(requestId, { transaction });
            if (!request) throw new Error('Request not found');
            if (request.status !== 'pending') throw new Error('Request already processed');

            // 1. Mark Request as Rejected
            request.status = 'rejected';
            request.admin_remark = reason;
            await request.save({ transaction });

            // 2. Refund User Wallet
            const wallet = await Wallet.findOne({ where: { user_id: request.user_id }, transaction });
            if (wallet) {
                wallet.balance = parseFloat(wallet.balance) + parseFloat(request.amount);
                await wallet.save({ transaction });

                // 3. Update Original Transaction to Failed/Rejected
                const walletTxn = await WalletTransaction.findOne({
                    where: { reference_id: requestId.toString(), type: 'withdraw' },
                    transaction
                });

                if (walletTxn) {
                    walletTxn.status = 'failed';
                    walletTxn.description += ` (Rejected: ${reason})`;
                    await walletTxn.save({ transaction });
                }

                // 4. Create Refund Transaction (Optional, but good for audit)
                await WalletTransaction.create({
                    wallet_id: wallet.id,
                    amount: request.amount,
                    type: 'deposit', // Treat as deposit/refund
                    description: `Refund: Rejected Withdrawal #${requestId}`,
                    status: 'success'
                }, { transaction });
            }

            await transaction.commit();
            return request;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new WalletService();
