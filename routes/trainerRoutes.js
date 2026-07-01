const express = require('express');
const router = express.Router();
const { getTrainers, getTrainerById, createTrainer, updateTrainer, deleteTrainer } = require('../controllers/trainerController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getTrainers)
    .post(protect, isAdmin, createTrainer);

router.route('/:id')
    .get(getTrainerById)
    .put(protect, isAdmin, updateTrainer)
    .delete(protect, isAdmin, deleteTrainer);

module.exports = router;
