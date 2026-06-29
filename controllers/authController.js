const bcrypt = require('bcrypt');
const authService = require('../services/authService');
const generateToken = require('../utils/generateToken');

// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields (name, email, phone, password)' });
        }

        const existingEmail = await authService.getUserByEmail(email);
        if (existingEmail) {
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }

        const existingPhone = await authService.getUserByPhone(phone);
        if (existingPhone) {
            return res.status(409).json({ success: false, message: 'Phone number already exists' });
        }

        const member_id = await authService.generateMemberId();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = await authService.createUser({
            member_id,
            full_name: name,
            email,
            phone_number: phone,
            password: hashedPassword,
            role: 'user'
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: userId,
                member_id,
                name,
                email,
                phone,
                role: 'user'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await authService.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken({
            user_id: user.id,
            member_id: user.member_id,
            role: user.role
        });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                member_id: user.member_id,
                name: user.full_name,
                email: user.email,
                phone: user.phone_number,
                role: user.role,
                profile_image: user.profile_image
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const user = await authService.getUserById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const membershipStatus = await authService.getUserMembershipStatus(userId);

        res.json({
            success: true,
            user: {
                member_id: user.member_id,
                name: user.full_name,
                email: user.email,
                phone: user.phone_number,
                role: user.role,
                profile_image: user.profile_image,
                membership_status: membershipStatus || null
            }
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'Please provide email, newPassword, and confirmPassword' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        const user = await authService.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await authService.updateUserPassword(email, hashedPassword);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// @route   POST /api/auth/logout
const logout = async (req, res) => {
    // Token invalidation is not required yet; frontend will simply remove the JWT
    res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
    register,
    login,
    getProfile,
    forgotPassword,
    logout
};
