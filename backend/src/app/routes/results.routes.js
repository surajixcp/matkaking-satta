const express = require('express');
const router = express.Router();
const resultsController = require('../controllers/results.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/', protect, resultsController.getHistory);
router.post('/reprocess', protect, authorize('admin'), resultsController.reprocessResults);
router.delete('/today/clear', protect, authorize('admin'), resultsController.deleteTodayResults);
module.exports = router;
