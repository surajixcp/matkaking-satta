const cron = require('node-cron');
const { Otp } = require('../db/models');

/**
 * Cleanup expired OTP records
 * Runs every hour to prevent database bloat
 */
const cleanupExpiredOTPs = async () => {
    try {
        const result = await Otp.destroy({
            where: {
                expires_at: {
                    [require('sequelize').Op.lt]: new Date()
                }
            }
        });

        if (result > 0) {
            console.log(`[OTP Cleanup] Deleted ${result} expired OTP record(s)`);
        }
    } catch (error) {
        console.error('[OTP Cleanup] Error:', error.message);
    }
};

/**
 * Start OTP cleanup cron job
 * Schedule: Every hour at minute 0
 */
const startOTPCleanupCron = () => {
    // Run every hour
    cron.schedule('0 * * * *', cleanupExpiredOTPs);
    console.log('[OTP Cleanup] Cron job started (runs every hour)');

    // Run immediately on startup
    cleanupExpiredOTPs();
};

module.exports = { startOTPCleanupCron, cleanupExpiredOTPs };
