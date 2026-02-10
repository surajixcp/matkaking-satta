/**
 * Withdraw Routes
 */

const express = require('express');
const router = express.Router();
const withdrawController = require('./withdraw.controller.js');
const { protect } = require('../../middlewares/auth.middleware.js');
const adminMiddleware = require('../../middlewares/admin.middleware.js');

// User routes
router.post('/', protect, withdrawController.requestWithdraw);
router.get('/history', protect, withdrawController.getWithdrawHistory);

// Admin routes
router.get('/admin/all', protect, adminMiddleware, withdrawController.getAllWithdrawals);
router.post('/admin/:id/approve', protect, adminMiddleware, withdrawController.approveWithdrawal);
router.post('/admin/:id/reject', protect, adminMiddleware, withdrawController.rejectWithdrawal);

module.exports = router;
