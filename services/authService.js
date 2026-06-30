const pool = require('../config/db');

const getUserByEmail = async (email) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

const getUserByPhone = async (phone_number) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE phone_number = ?', [phone_number]);
    return rows[0];
};

const getUserById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
};

const generateMemberId = async () => {
    // Generate MEM000001 format
    const [rows] = await pool.query('SELECT member_id FROM users ORDER BY id DESC LIMIT 1');
    let nextNumber = 1;
    if (rows.length > 0 && rows[0].member_id && rows[0].member_id.startsWith('MEM')) {
        const lastId = rows[0].member_id;
        const numberPart = parseInt(lastId.replace('MEM', ''), 10);
        if (!isNaN(numberPart)) {
            nextNumber = numberPart + 1;
        }
    }
    return `MEM${nextNumber.toString().padStart(6, '0')}`;
};

const createUser = async (userData) => {
    const { member_id, full_name, email, phone_number, password, role } = userData;
    const [result] = await pool.query(
        'INSERT INTO users (member_id, full_name, email, phone_number, password, role) VALUES (?, ?, ?, ?, ?, ?)',
        [member_id, full_name, email, phone_number, password, role || 'user']
    );
    return result.insertId;
};

const updateUserPassword = async (email, hashedPassword) => {
    const [result] = await pool.query(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, email]
    );
    return result.affectedRows;
};

const getUserMembershipStatus = async (userId) => {
    const [rows] = await pool.query(
        'SELECT membership_status FROM user_memberships WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [userId]
    );
    return rows.length > 0 ? rows[0].membership_status : null;
};

module.exports = {
    getUserByEmail,
    getUserByPhone,
    getUserById,
    generateMemberId,
    createUser,
    updateUserPassword,
    getUserMembershipStatus
};
