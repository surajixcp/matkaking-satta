const express = require('express');
const router = express.Router();
const resultsController = require('../controllers/results.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.post('/', protect, authorize('admin'), resultsController.declareResult);
router.get('/', protect, authorize('admin'), resultsController.getHistory);
router.post('/reprocess', protect, authorize('admin'), resultsController.reprocessResults);
router.delete('/:id', protect, authorize('admin'), resultsController.revokeResult);

module.exports = router;
