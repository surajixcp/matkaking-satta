const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Public Admin Login
router.post('/login', adminController.adminLogin);

// Protected Admin Routes
router.use(protect);
router.use(authorize('admin', 'super_admin'));

router.get('/stats', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.get('/withdrawals/pending', adminController.getPendingWithdrawals);

module.exports = router;
