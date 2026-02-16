const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Public User Routes
router.get('/stats', protect, referralController.getStats);

// Admin Routes
router.get('/settings', protect, referralController.getSettings);
router.put('/settings', protect, authorize('admin'), referralController.updateSettings);

module.exports = router;
