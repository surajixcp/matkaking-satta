const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
// const userRoutes = require('./user.routes');
const walletRoutes = require('./wallet.routes');
const marketsRoutes = require('./markets.routes');
const bidsRoutes = require('./bids.routes');

router.use('/auth', authRoutes);
// router.use('/user', userRoutes);
router.use('/wallet', walletRoutes);
router.use('/markets', marketsRoutes);
router.use('/bids', bidsRoutes);
router.use('/fcm', require('./fcm.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/otp', require('./otp.routes'));
router.use('/results', require('./results.routes'));
router.use('/deposits', require('./deposit.routes'));
router.use('/settings', require('./settings.routes'));

module.exports = router;
