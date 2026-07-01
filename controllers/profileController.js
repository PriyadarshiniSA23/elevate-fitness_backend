const pool = require('../config/db');

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        // Get user details
        const [users] = await pool.query(
            'SELECT id, member_id, full_name, email, phone_number, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];

        // Get membership details
        const [memberships] = await pool.query(
            'SELECT * FROM user_memberships WHERE user_id = ? ORDER BY id DESC LIMIT 1',
            [userId]
        );

        let membership = null;
        if (memberships.length > 0) {
            const m = memberships[0];
            membership = {
                type: m.membership_type,
                status: m.membership_status,
                activationDate: m.start_date,
                expiryDate: m.end_date
            };
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                member_id: user.member_id,
                full_name: user.full_name,
                email: user.email,
                phone_number: user.phone_number,
                role: user.role,
                created_at: user.created_at,
                membership: membership
            }
        });
    } catch (error) {
        console.error('Get Profile error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { full_name, phone_number } = req.body;

        if (!full_name || !phone_number) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields (full_name, phone_number)' });
        }

        // Phone number format validation (simple regex for basic format)
        const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
        if (!phoneRegex.test(phone_number) || phone_number.replace(/\D/g,'').length < 7) {
            return res.status(400).json({ success: false, message: 'Invalid phone format' });
        }

        // Check if phone number is used by someone else
        const [existingPhone] = await pool.query(
            'SELECT id FROM users WHERE phone_number = ? AND id != ?',
            [phone_number, userId]
        );

        if (existingPhone.length > 0) {
            return res.status(400).json({ success: false, message: 'Phone number is already in use by another account' });
        }

        // Update user
        await pool.query(
            'UPDATE users SET full_name = ?, phone_number = ? WHERE id = ?',
            [full_name, phone_number, userId]
        );

        // Fetch updated user to return
        const [updatedUsers] = await pool.query(
            'SELECT id, member_id, full_name, email, phone_number, role, created_at FROM users WHERE id = ?',
            [userId]
        );
        
        const updatedUser = updatedUsers[0];

        // Fetch membership
        const [memberships] = await pool.query(
            'SELECT * FROM user_memberships WHERE user_id = ? ORDER BY id DESC LIMIT 1',
            [userId]
        );

        let membership = null;
        if (memberships.length > 0) {
            const m = memberships[0];
            membership = {
                type: m.membership_type,
                status: m.membership_status,
                activationDate: m.start_date,
                expiryDate: m.end_date
            };
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                member_id: updatedUser.member_id,
                full_name: updatedUser.full_name,
                email: updatedUser.email,
                phone_number: updatedUser.phone_number,
                role: updatedUser.role,
                created_at: updatedUser.created_at,
                membership: membership
            }
        });
    } catch (error) {
        console.error('Update Profile error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getProfile,
    updateProfile
};
