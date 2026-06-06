const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.get('/profile', authMiddleware, AuthController.getProfile);
router.get('/seed', AuthController.seed);

module.exports = router;
