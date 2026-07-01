const pool = require('../config/db');

// @route   GET /api/trainers
// @desc    Get all active trainers (optionally filtered by program_id)
// @access  Public
const getTrainers = async (req, res) => {
    try {
        const { program_id } = req.query;
        let query = `
            SELECT t.*, 
                   IFNULL(
                       JSON_ARRAYAGG(
                           JSON_OBJECT('id', p.id, 'title', p.program_name)
                       ), 
                   JSON_ARRAY()) as mapped_programs
            FROM trainers t
            LEFT JOIN trainer_programs tp ON t.id = tp.trainer_id
            LEFT JOIN programs p ON tp.program_id = p.id
            WHERE t.is_active = 1
        `;
        
        let queryParams = [];

        if (program_id) {
            query += ` AND t.id IN (SELECT trainer_id FROM trainer_programs WHERE program_id = ?)`;
            queryParams.push(program_id);
        }

        query += ` GROUP BY t.id`;

        const [trainers] = await pool.query(query, queryParams);

        // Normalize mapped_programs array (JSON_ARRAYAGG might produce [null] if no programs exist)
        const normalizedTrainers = trainers.map(trainer => {
            const mapped = (trainer.mapped_programs || []).filter(p => p && p.id);
            return {
                ...trainer,
                mapped_programs: mapped,
                // Assign assignedPrograms array of titles for the frontend AddTrainerModal compatibility
                assignedPrograms: mapped.map(p => p.title)
            };
        });

        res.json({ success: true, trainers: normalizedTrainers });
    } catch (error) {
        console.error('Error fetching trainers:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   GET /api/trainers/:id
// @desc    Get trainer by ID
// @access  Public
const getTrainerById = async (req, res) => {
    try {
        const { id } = req.params;
        const [trainers] = await pool.query(`
            SELECT t.*, 
                   IFNULL(JSON_ARRAYAGG(JSON_OBJECT('id', p.id, 'title', p.program_name)), JSON_ARRAY()) as mapped_programs
            FROM trainers t
            LEFT JOIN trainer_programs tp ON t.id = tp.trainer_id
            LEFT JOIN programs p ON tp.program_id = p.id
            WHERE t.id = ? AND t.is_active = 1
            GROUP BY t.id
        `, [id]);

        if (trainers.length === 0) {
            return res.status(404).json({ success: false, message: 'Trainer not found' });
        }

        const trainer = trainers[0];
        trainer.mapped_programs = (trainer.mapped_programs || []).filter(p => p && p.id);
        trainer.assignedPrograms = trainer.mapped_programs.map(p => p.title);

        res.json({ success: true, trainer });
    } catch (error) {
        console.error('Error fetching trainer:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   POST /api/trainers
// @desc    Create a new trainer
// @access  Private/Admin
const createTrainer = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { 
            trainer_name, email, phone, specialization, years_of_experience, certifications, 
            biography, membership_access_level, availability, category, title, profile_image, 
            assignedPrograms 
        } = req.body;

        if (!trainer_name || !specialization || !years_of_experience) {
            return res.status(400).json({ success: false, message: 'Name, specialization, and experience are required' });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO trainers 
            (trainer_name, email, phone, specialization, years_of_experience, certifications, biography, membership_access_level, availability, category, title, profile_image, rating) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                trainer_name, email || null, phone || null, specialization, years_of_experience, 
                certifications || null, biography || null, membership_access_level || 'Standard', 
                availability || 'Active', category || 'strength', title || 'Performance Coach', 
                profile_image || null, 5.0
            ]
        );

        const trainerId = result.insertId;

        // Map assignedPrograms (array of titles) to program IDs
        if (assignedPrograms && assignedPrograms.length > 0) {
            for (const programTitle of assignedPrograms) {
                const [programs] = await connection.query('SELECT id FROM programs WHERE program_name = ? LIMIT 1', [programTitle]);
                if (programs.length > 0) {
                    await connection.query('INSERT INTO trainer_programs (trainer_id, program_id) VALUES (?, ?)', [trainerId, programs[0].id]);
                }
            }
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Trainer created successfully', id: trainerId });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating trainer:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    } finally {
        connection.release();
    }
};

// @route   PUT /api/trainers/:id
// @desc    Update an existing trainer
// @access  Private/Admin
const updateTrainer = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { 
            // Required API naming conventions from requirements list
            full_name,
            email,
            phone_number,
            specialization,
            biography,
            experience,
            tier_access,
            availability,
            
            // Legacy / alternate naming conventions
            trainer_name,
            phone,
            years_of_experience,
            membership_access_level,
            certifications,
            category,
            title,
            profile_image,
            bio,

            // Program mappings
            programIds,
            assignedPrograms
        } = req.body;

        // Map values to database columns with robust fallbacks
        const db_trainer_name = full_name !== undefined ? full_name : trainer_name;
        const db_email = email;
        const db_phone = phone_number !== undefined ? phone_number : phone;
        const db_specialization = specialization;
        const db_years_of_experience = experience !== undefined ? experience : years_of_experience;
        const db_biography = biography !== undefined ? biography : bio;
        const db_membership_access_level = tier_access !== undefined ? tier_access : membership_access_level;
        const db_availability = availability;
        const db_certifications = certifications;
        const db_category = category;
        const db_title = title;
        const db_profile_image = profile_image;

        if (!db_trainer_name || !db_specialization || db_years_of_experience === undefined || db_years_of_experience === null) {
            return res.status(400).json({ success: false, message: 'Name, specialization, and experience are required' });
        }

        await connection.beginTransaction();

        // Step 1: Update the trainers table
        await connection.query(
            `UPDATE trainers SET 
            trainer_name = ?, email = ?, phone = ?, specialization = ?, years_of_experience = ?, 
            certifications = ?, biography = ?, membership_access_level = ?, availability = ?, 
            category = ?, title = ?, profile_image = ?
            WHERE id = ?`,
            [
                db_trainer_name,
                db_email || null,
                db_phone || null,
                db_specialization,
                db_years_of_experience,
                db_certifications || null,
                db_biography || null,
                db_membership_access_level || 'Standard',
                db_availability || 'Active',
                db_category || 'strength',
                db_title || 'Performance Coach',
                db_profile_image || null,
                id
            ]
        );

        // Step 2: Synchronize trainer_programs
        let resolvedProgramIds = [];

        if (Array.isArray(programIds)) {
            resolvedProgramIds = [...new Set(programIds)];
        } else if (Array.isArray(assignedPrograms)) {
            const uniquePrograms = [...new Set(assignedPrograms)];
            for (const item of uniquePrograms) {
                if (typeof item === 'number' || !isNaN(item)) {
                    resolvedProgramIds.push(Number(item));
                } else {
                    const [programs] = await connection.query('SELECT id FROM programs WHERE program_name = ? LIMIT 1', [item]);
                    if (programs.length > 0) {
                        resolvedProgramIds.push(programs[0].id);
                    }
                }
            }
            resolvedProgramIds = [...new Set(resolvedProgramIds)];
        }

        // Delete all existing mappings for this trainer
        await connection.query('DELETE FROM trainer_programs WHERE trainer_id = ?', [id]);

        // Insert new mappings (unique only)
        if (resolvedProgramIds.length > 0) {
            for (const progId of resolvedProgramIds) {
                await connection.query('INSERT IGNORE INTO trainer_programs (trainer_id, program_id) VALUES (?, ?)', [id, progId]);
            }
        }

        // Fetch updated trainer to return
        const [updatedTrainers] = await connection.query('SELECT * FROM trainers WHERE id = ?', [id]);
        if (updatedTrainers.length === 0) {
            throw new Error('Trainer not found after update');
        }
        const updatedTrainer = updatedTrainers[0];

        // Fetch latest assigned programs (names)
        const [programMappings] = await connection.query(
            `SELECT p.program_name 
             FROM trainer_programs tp 
             JOIN programs p ON tp.program_id = p.id 
             WHERE tp.trainer_id = ?`, 
            [id]
        );
        updatedTrainer.assignedPrograms = programMappings.map(row => row.program_name);

        // Fetch latest mapped programs (as objects with id and title) to match GET /api/trainers format
        const [mappedPrograms] = await connection.query(
            `SELECT p.id, p.program_name as title
             FROM trainer_programs tp
             JOIN programs p ON tp.program_id = p.id
             WHERE tp.trainer_id = ?`,
            [id]
        );
        updatedTrainer.mapped_programs = mappedPrograms;

        // Step 3: Commit transaction
        await connection.commit();
        res.json({ success: true, message: 'Trainer updated successfully', trainer: updatedTrainer });
    } catch (error) {
        // Rollback transaction if any operation fails
        await connection.rollback();
        console.error('Error updating trainer:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    } finally {
        connection.release();
    }
};

// @route   DELETE /api/trainers/:id
// @desc    Soft delete a trainer
// @access  Private/Admin
const deleteTrainer = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('UPDATE trainers SET is_active = 0 WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Trainer not found' });
        }

        res.json({ success: true, message: 'Trainer deleted successfully' });
    } catch (error) {
        console.error('Error deleting trainer:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getTrainers,
    getTrainerById,
    createTrainer,
    updateTrainer,
    deleteTrainer
};
