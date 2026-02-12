const { User, ReferralTransaction, ReferralSetting, Wallet, sequelize } = require('../../db/models');
const { Op } = require('sequelize');

class ReferralController {
    /**
     * Get Referral Stats for User
     */
    async getStats(req, res, next) {
        try {
            const userId = req.user.id;

            // 1. Get User's Referral Code
            // 1. Get User
            const user = await User.findByPk(userId);

            // Auto-generate referral code if missing (for existing users)
            if (!user.referral_code) {
                const namePrefix = user.full_name ? user.full_name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() : 'USR';
                let isUnique = false;
                let newCode = '';

                // Simple collision check loop (though collision is unlikely with random 4 digits)
                while (!isUnique) {
                    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                    newCode = `${namePrefix}${randomSuffix}`;
                    const existing = await User.findOne({ where: { referral_code: newCode } });
                    if (!existing) isUnique = true;
                }

                user.referral_code = newCode;
                await user.save();
            }

            // 2. Count Referrals
            const totalReferrals = await User.count({ where: { referred_by: userId } });

            // 3. Calculate Total Earnings
            const totalEarnings = await ReferralTransaction.sum('amount', {
                where: { referrer_id: userId, status: 'completed' }
            }) || 0;

            // 4. Get Recent Referrals (List)
            const referrals = await User.findAll({
                where: { referred_by: userId },
                attributes: ['full_name', 'createdAt'],
                order: [['createdAt', 'DESC']],
                limit: 10
            });

            // Mask names
            const maskedReferrals = referrals.map(r => ({
                name: r.full_name ? r.full_name.substring(0, 2) + '*'.repeat(r.full_name.length - 2) : 'User',
                date: r.createdAt
            }));

            res.json({
                success: true,
                data: {
                    referralCode: user.referral_code,
                    totalReferrals,
                    totalEarnings: parseFloat(totalEarnings),
                    referrals: maskedReferrals
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Settings (Admin)
     */
    async getSettings(req, res, next) {
        try {
            let settings = await ReferralSetting.findOne();
            if (!settings) {
                settings = await ReferralSetting.create({
                    bonus_amount: 50,
                    min_deposit_amount: 500,
                    is_enabled: true
                });
            }
            res.json({ success: true, data: settings });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update Settings (Admin)
     */
    async updateSettings(req, res, next) {
        try {
            const { bonus_amount, min_deposit_amount, is_enabled } = req.body;
            let settings = await ReferralSetting.findOne();

            if (!settings) {
                settings = await ReferralSetting.create({
                    bonus_amount: 50,
                    min_deposit_amount: 500,
                    is_enabled: true
                });
            }

            // Update
            if (bonus_amount !== undefined) settings.bonus_amount = bonus_amount;
            if (min_deposit_amount !== undefined) settings.min_deposit_amount = min_deposit_amount;
            if (is_enabled !== undefined) settings.is_enabled = is_enabled;

            await settings.save();

            res.json({ success: true, data: settings });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReferralController();
