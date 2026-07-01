const pool = require('../config/db');

// @route   GET /api/users
// @desc    Get all users with their latest membership info
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, 
                u.member_id, 
                u.full_name, 
                u.email, 
                u.phone_number, 
                u.role, 
                u.is_active, 
                u.created_at,
                u.complimentary_sessions_used,
                um.membership_status,
                mp.plan_name as membership_type
            FROM users u
            LEFT JOIN (
                SELECT user_id, membership_status, membership_plan_id
                FROM user_memberships
                WHERE id IN (
                    SELECT MAX(id)
                    FROM user_memberships
                    GROUP BY user_id
                )
            ) um ON u.id = um.user_id
            LEFT JOIN membership_plans mp ON um.membership_plan_id = mp.id
            ORDER BY u.created_at DESC
        `;
        
        const [users] = await pool.query(query);

        const formattedUsers = users.map(user => ({
            id: user.id,
            member_id: user.member_id,
            full_name: user.full_name,
            email: user.email,
            phone_number: user.phone_number,
            role: user.role,
            status: user.is_active ? 'Active' : 'Suspended',
            registrationDate: new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            created_at: user.created_at,
            membership: user.membership_status ? {
                status: user.membership_status,
                type: user.membership_type || 'Standard'
            } : null,
            remainingTrials: 2 - (user.complimentary_sessions_used || 0)
        }));

        res.json({ success: true, users: formattedUsers });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await pool.query('SELECT * FROM users WHERE id = ? OR member_id = ? OR email = ?', [id, id, id]);
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                member_id: user.member_id,
                full_name: user.full_name,
                email: user.email,
                phone_number: user.phone_number,
                role: user.role,
                status: user.is_active ? 'Active' : 'Suspended',
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   PUT /api/users/:email
// @desc    Update a user
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const { email } = req.params; 
        const { status } = req.body;
        
        let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        const queryParams = [];

        if (status) {
            updateQuery += ', is_active = ?';
            queryParams.push(status === 'Active' ? 1 : 0);
        }

        updateQuery += ' WHERE email = ?';
        queryParams.push(email);

        const [result] = await pool.query(updateQuery, queryParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @route   DELETE /api/users/:email
// @desc    Delete a user
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const { email } = req.params;
        const [result] = await pool.query('DELETE FROM users WHERE email = ?', [email]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};
