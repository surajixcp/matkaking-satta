const express = require('express');
const router = express.Router();
const depositController = require('../controllers/deposit.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// User Routes
router.post('/', protect, depositController.createDeposit);

// Admin Routes
router.get('/admin/all', protect, authorize('admin'), depositController.getAllDeposits);
router.put('/:id/approve', protect, authorize('admin'), depositController.approveDeposit);
router.put('/:id/reject', protect, authorize('admin'), depositController.rejectDeposit);

module.exports = router;
