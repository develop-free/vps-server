const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authMiddleware.authenticate, authController.logout);
router.post('/logout-all', authMiddleware.authenticate, authController.logoutAll);
router.get('/check', authMiddleware.authenticate, authController.checkAuth);

module.exports = router;