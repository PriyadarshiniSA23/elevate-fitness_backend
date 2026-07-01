const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .get(programController.getPrograms)
    .post(protect, isAdmin, programController.createProgram);

router.route('/:id')
    .get(programController.getProgramById)
    .put(protect, isAdmin, programController.updateProgram)
    .delete(protect, isAdmin, programController.deleteProgram);

module.exports = router;
