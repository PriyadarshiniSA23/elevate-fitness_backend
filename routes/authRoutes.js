const express = require('express');
const { 
    register, 
    login, 
    getProfile, 
    forgotPassword, 
    logout 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/logout', logout);

module.exports = router;
