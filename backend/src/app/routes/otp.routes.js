const express = require('express');
const router = express.Router();
const controller = require('../controllers/otp.controller');
const { otpRateLimiter } = require('../middlewares/otp.middleware');

// Apply rate limiting to OTP generation
router.post('/generate', otpRateLimiter, controller.generateOTP);
router.post('/verify', controller.verifyOTP);

module.exports = router;
