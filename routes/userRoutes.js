const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/', protect, isAdmin, getUsers);
router.get('/:id', protect, isAdmin, getUserById);
router.put('/:email', protect, isAdmin, updateUser);
router.delete('/:email', protect, isAdmin, deleteUser);

module.exports = router;
