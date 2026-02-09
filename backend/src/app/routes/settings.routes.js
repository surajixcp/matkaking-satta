const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Public or Authenticated User Routes
// Allowing public access for app init, or restrict to protect if needed. 
// For now, let's protect it so only logged in users can fetch config/UPI ID.
router.get('/', protect, settingsController.getSettings);

// Admin Routes
router.put('/', protect, authorize('admin'), settingsController.updateSettings);

module.exports = router;
