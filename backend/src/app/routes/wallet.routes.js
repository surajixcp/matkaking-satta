const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // All wallet routes require auth

router.get('/balance', walletController.getBalance);
router.post('/deposit', walletController.addFunds); // Admin/System
const upload = require('../middlewares/upload.middleware');

router.post('/deposit-request', upload.single('screenshot'), walletController.requestDeposit); // Manual UPI
router.post('/razorpay/order', walletController.createRazorpayOrder); // Auto UPI - Step 1
router.post('/razorpay/verify', walletController.verifyRazorpayPayment); // Auto UPI - Step 2
router.post('/withdraw', walletController.requestWithdraw);
router.get('/history', walletController.getHistory);

// Admin Routes for Withdrawals
router.get('/withdrawals', walletController.getAllWithdrawals);
router.put('/withdrawals/:id/approve', walletController.approveWithdrawal);
router.put('/withdrawals/:id/reject', walletController.rejectWithdrawal);

module.exports = router;
