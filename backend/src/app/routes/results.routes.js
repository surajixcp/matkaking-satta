const express = require('express');
const router = express.Router();
const resultsController = require('../controllers/results.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/', protect, resultsController.getHistory);
router.delete('/:id', protect, authorize('admin'), resultsController.revokeResult);
router.post('/reprocess', protect, authorize('admin'), resultsController.reprocessResults);

module.exports = router;
