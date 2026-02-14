const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protectAdmin, checkPermission } = require('../middlewares/rbac.middleware');

// Public Admin Login
router.post('/login', adminController.adminLogin);

// Protected Admin Routes
router.use(protectAdmin);

// Dashboard Stats
router.get('/stats', checkPermission('user_view'), adminController.getDashboardStats);

// User Management
router.get('/users', checkPermission('user_view'), adminController.getUsers);
router.put('/users/:id/status', checkPermission('user_edit'), adminController.updateUserInfoByAdmin);
router.get('/users/:id/history', checkPermission('user_view'), adminController.getUserHistory);
router.delete('/users/:id', checkPermission('user_delete'), adminController.deleteUser);
router.get('/withdrawals/pending', checkPermission('withdraw_approve'), adminController.getPendingWithdrawals);

// Role Management (RBAC)
router.get('/roles', checkPermission('rbac_manage'), adminController.getRoles);
router.post('/roles', checkPermission('rbac_manage'), adminController.createRole);
router.put('/roles/:id', checkPermission('rbac_manage'), adminController.updateRole);
router.delete('/roles/:id', checkPermission('rbac_manage'), adminController.deleteRole);

// Admin Management (RBAC)
router.get('/accounts', checkPermission('rbac_manage'), adminController.getAdmins);
router.post('/accounts', checkPermission('rbac_manage'), adminController.createAdminAccount);
router.put('/accounts/:id/status', checkPermission('rbac_manage'), adminController.updateAdminStatus);
router.post('/accounts/:id/reset-pin', checkPermission('rbac_manage'), adminController.resetAdminPin);

module.exports = router;
