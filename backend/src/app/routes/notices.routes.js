const express = require('express');
const router = express.Router();
const noticesController = require('../controllers/notices.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Public route to get active notices (or all if admin)
// We might want to allow public access without token if it's for the home page before login?
// But typically app requires login. If app allows guest view, remove 'protect' or handle optional auth.
// For now, assuming logged in users or public endpoint.
// Let's make it public for fetching, but if token is present, controller checks role.
// To support "optional auth", we'd need a middleware that doesn't fail if no token.
// For simplicity: Public GET (active only), Admin GET (all).
// Actually, let's just make GET public and always return active only unless we create a separate specific admin endpoint.
// OR: Admin uses a different route or query param?
// Let's use `protect` but simple logic:
// Public: GET / (active only)
// Admin: GET /all (all notices)

// Standard implementation:
router.get('/', noticesController.getNotices); // If we want to support Admin seeing inactive, we might need to know if they are admin.
// If the user app hits this without a token, `req.user` is undefined -> returns active only. Correct.

// Admin routes
router.post('/', protect, authorize('admin'), noticesController.createNotice);
router.put('/:id', protect, authorize('admin'), noticesController.updateNotice);
router.delete('/:id', protect, authorize('admin'), noticesController.deleteNotice);

module.exports = router;
