/**
 * Withdraw Routes
 */

const express = require('express');
const router = express.Router();
const withdrawController = require('./withdraw.controller.js');
const authMiddleware = require('../../middleware/auth.middleware.js');
const adminMiddleware = require('../../middleware/admin.middleware.js');

// User routes
router.post('/', authMiddleware, withdrawController.requestWithdraw);
router.get('/history', authMiddleware, withdrawController.getWithdrawHistory);

// Admin routes
router.get('/admin/all', authMiddleware, adminMiddleware, withdrawController.getAllWithdrawals);
router.post('/admin/:id/approve', authMiddleware, adminMiddleware, withdrawController.approveWithdrawal);
router.post('/admin/:id/reject', authMiddleware, adminMiddleware, withdrawController.rejectWithdrawal);

module.exports = router;
