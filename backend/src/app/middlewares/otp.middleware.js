const rateLimit = require('express-rate-limit');
const { Otp } = require('../../db/models');

/**
 * Rate limiter for OTP generation
 * Limits to 3 OTP requests per phone number per 5 minutes
 */
const otpRequestTracker = new Map();

const otpRateLimiter = async (req, res, next) => {
    const { phone } = req.body;

    if (!phone) {
        return next(); // Let the controller handle validation
    }

    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutes
    const maxRequests = 3;

    // Get or initialize tracker for this phone
    if (!otpRequestTracker.has(phone)) {
        otpRequestTracker.set(phone, []);
    }

    const requests = otpRequestTracker.get(phone);

    // Remove requests older than the time window
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    otpRequestTracker.set(phone, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
        const oldestRequest = Math.min(...recentRequests);
        const retryAfter = Math.ceil((windowMs - (now - oldestRequest)) / 1000);

        console.log(`[OTP Rate Limit] Phone ${phone} exceeded limit (${recentRequests.length}/${maxRequests})`);

        return res.status(429).json({
            success: false,
            message: `Too many OTP requests. Please try again after ${retryAfter} seconds.`,
            retryAfter
        });
    }

    // Add current request
    recentRequests.push(now);
    otpRequestTracker.set(phone, recentRequests);

    next();
};

/**
 * Cleanup tracker periodically (every 10 minutes)
 * Prevents memory leaks from accumulating phone numbers
 */
setInterval(() => {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000;

    for (const [phone, requests] of otpRequestTracker.entries()) {
        const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);

        if (recentRequests.length === 0) {
            otpRequestTracker.delete(phone);
        } else {
            otpRequestTracker.set(phone, recentRequests);
        }
    }

    console.log(`[OTP Rate Limit] Cleanup complete. Tracking ${otpRequestTracker.size} phone numbers.`);
}, 10 * 60 * 1000);

module.exports = { otpRateLimiter };
