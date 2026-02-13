const express = require('express');
const router = express.Router();

// Debug Route to check deployment version
router.get('/version', (req, res) => {
    res.json({
        version: '1.5.0-atomic-fix',
        timestamp: new Date().toISOString(),
        message: 'If you see this, the atomic transaction fix is DEPLOYED.'
    });
});

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
router.use('/withdraw', require('../modules/withdraw/withdraw.routes'));
router.use('/notices', require('./notices.routes'));
router.use('/referral', require('./referral.routes'));

const scrapedResultsController = require('../controllers/scraped-results.controller');

// Scraper Routes
router.get('/scraper/results', scrapedResultsController.getRecent);

module.exports = router;
