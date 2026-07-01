const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// Get and Update Profile
router.route('/')
    .get(protect, profileController.getProfile)
    .put(protect, profileController.updateProfile);

module.exports = router;
