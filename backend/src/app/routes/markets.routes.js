const express = require('express');
const router = express.Router();
const marketsController = require('../controllers/markets.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Public request to see markets
router.get('/', marketsController.getMarkets);
router.get('/:id/game-types', marketsController.getGameTypes);

// Admin only routes
router.post('/', protect, authorize('admin'), marketsController.createMarket);
router.put('/:id', protect, authorize('admin'), marketsController.updateMarket);
router.delete('/:id', protect, authorize('admin'), marketsController.deleteMarket);

module.exports = router;
