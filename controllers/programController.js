const pool = require('../config/db');

// @route   GET /api/programs
// @desc    Get all active programs
// @access  Public
const getPrograms = async (req, res) => {
    try {
        const [programs] = await pool.query('SELECT * FROM programs WHERE is_active = 1');
        res.json({ success: true, programs });
    } catch (error) {
        console.error('Error fetching programs:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   GET /api/programs/:id
// @desc    Get program by ID
// @access  Public
const getProgramById = async (req, res) => {
    try {
        const [programs] = await pool.query('SELECT * FROM programs WHERE id = ?', [req.params.id]);
        if (programs.length === 0) {
            return res.status(404).json({ success: false, message: 'Program not found' });
        }
        res.json({ success: true, program: programs[0] });
    } catch (error) {
        console.error('Error fetching program:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   POST /api/programs
// @desc    Create a new program
// @access  Private/Admin
const createProgram = async (req, res) => {
    try {
        const { program_name, description, duration, price, capacity, program_image, availability, membership_access_level, difficulty_level, calories_estimate } = req.body;

        if (!program_name || !description || !duration) {
            return res.status(400).json({ success: false, message: 'Program name, description, and duration are required' });
        }
        if (duration <= 0) return res.status(400).json({ success: false, message: 'Duration must be greater than 0' });
        if (price !== undefined && price !== null && price < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative' });
        if (capacity !== undefined && capacity !== null && capacity <= 0) return res.status(400).json({ success: false, message: 'Capacity must be greater than 0' });

        const [result] = await pool.query(
            `INSERT INTO programs 
            (program_name, description, duration, price, capacity, program_image, availability, membership_access_level, difficulty_level, calories_estimate) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                program_name, 
                description, 
                duration, 
                price || 0, 
                capacity || null, 
                program_image || null, 
                availability || 'Available', 
                membership_access_level || null, 
                difficulty_level || null, 
                calories_estimate || null
            ]
        );

        res.status(201).json({ success: true, message: 'Program created successfully', insertId: result.insertId });
    } catch (error) {
        console.error('Error creating program:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   PUT /api/programs/:id
// @desc    Update a program
// @access  Private/Admin
const updateProgram = async (req, res) => {
    try {
        const { program_name, description, duration, price, capacity, program_image, availability, membership_access_level, difficulty_level, calories_estimate } = req.body;

        if (!program_name || !description || !duration) {
            return res.status(400).json({ success: false, message: 'Program name, description, and duration are required' });
        }
        if (duration <= 0) return res.status(400).json({ success: false, message: 'Duration must be greater than 0' });
        if (price !== undefined && price !== null && price < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative' });
        if (capacity !== undefined && capacity !== null && capacity <= 0) return res.status(400).json({ success: false, message: 'Capacity must be greater than 0' });

        await pool.query(
            `UPDATE programs SET 
            program_name = ?, description = ?, duration = ?, price = ?, capacity = ?, program_image = ?, availability = ?, membership_access_level = ?, difficulty_level = ?, calories_estimate = ?
            WHERE id = ?`,
            [
                program_name, 
                description, 
                duration, 
                price || 0, 
                capacity || null, 
                program_image || null, 
                availability || 'Available', 
                membership_access_level || null, 
                difficulty_level || null, 
                calories_estimate || null,
                req.params.id
            ]
        );

        res.json({ success: true, message: 'Program updated successfully' });
    } catch (error) {
        console.error('Error updating program:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   DELETE /api/programs/:id
// @desc    Soft delete a program
// @access  Private/Admin
const deleteProgram = async (req, res) => {
    try {
        await pool.query('UPDATE programs SET is_active = 0 WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Program deactivated successfully' });
    } catch (error) {
        console.error('Error deleting program:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getPrograms,
    getProgramById,
    createProgram,
    updateProgram,
    deleteProgram
};
