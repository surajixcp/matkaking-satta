const express = require('express');
const router = express.Router();
const controller = require('../controllers/otp.controller');

router.post('/generate', controller.generateOTP);
router.post('/verify', controller.verifyOTP);

module.exports = router;
