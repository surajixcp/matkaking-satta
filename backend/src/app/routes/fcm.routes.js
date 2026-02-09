const express = require('express');
const router = express.Router();
const fcmController = require('../controllers/fcm.controller');

// Route to register/update FCM token
router.post('/register-token', fcmController.registerToken);

module.exports = router;
