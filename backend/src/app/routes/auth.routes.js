const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/firebase-login', authController.firebaseLogin);

// Profile Picture Routes
const upload = require('../middlewares/upload.middleware');
const { protect } = require('../middlewares/auth.middleware');

router.post('/profile-pic', protect, upload.single('image'), authController.updateProfilePic);
router.delete('/profile-pic', protect, authController.removeProfilePic);
router.post('/change-mpin', protect, authController.changeMpin);

module.exports = router;
