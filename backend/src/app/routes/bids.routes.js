const express = require('express');
const router = express.Router();
const bidsController = require('../controllers/bids.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/place', bidsController.placeBid);
router.get('/history', bidsController.getMyBids);

// Admin Routes
router.get('/all', bidsController.getAllBids); // Add protect/authorize('admin') in production wrapper if not global

module.exports = router;
