-- ==============================================================================
-- ELEVATE FITNESS MANAGEMENT SYSTEM - DATABASE SCHEMA
-- MySQL 8+ | InnoDB | utf8mb4
-- ==============================================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS elevate_fitness_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE elevate_fitness_db;

-- ==============================================================================
-- 1. USERS
-- ==============================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id VARCHAR(50) UNIQUE, -- e.g., MEM000001
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hash
    phone_number VARCHAR(20) UNIQUE,
    profile_image VARCHAR(255),
    role ENUM('admin', 'user') DEFAULT 'user' NOT NULL,
    complimentary_sessions_used INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==============================================================================
-- 2. MEMBERSHIP PLANS
-- ==============================================================================
CREATE TABLE membership_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(50) NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    annual_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    description TEXT,
    membership_access_level VARCHAR(50),
    features JSON,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==============================================================================
-- 3. USER MEMBERSHIPS
-- ==============================================================================
CREATE TABLE user_memberships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    membership_plan_id INT NOT NULL,
    billing_cycle ENUM('Monthly', 'Annual') NOT NULL,
    purchase_date DATETIME NOT NULL,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_status ENUM('Success', 'Failed', 'Pending') DEFAULT 'Pending',
    membership_status ENUM('Active', 'Expired', 'Cancelled') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_memberships_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_user_memberships_plan FOREIGN KEY (membership_plan_id) REFERENCES membership_plans(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ==============================================================================
-- 4. TRAINERS
-- ==============================================================================
CREATE TABLE trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    years_of_experience INT DEFAULT 0,
    biography TEXT,
    profile_image VARCHAR(255),
    availability ENUM('Active', 'On Leave') DEFAULT 'Active',
    membership_access_level VARCHAR(50),
    rating DECIMAL(2,1) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==============================================================================
-- 5. PROGRAMS
-- ==============================================================================
CREATE TABLE programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_name VARCHAR(100) NOT NULL,
    description TEXT,
    duration INT NOT NULL, -- Duration in minutes
    price DECIMAL(10,2) DEFAULT 0.00,
    program_image VARCHAR(255),
    availability ENUM('Available', 'Unavailable') DEFAULT 'Available',
    membership_access_level VARCHAR(50),
    difficulty_level VARCHAR(50),
    calories_estimate INT,
    capacity INT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==============================================================================
-- 6. BOOKINGS
-- ==============================================================================
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., BK202600001
    user_id INT NOT NULL,
    trainer_id INT,
    program_id INT,
    booking_type ENUM('Discovery', 'Regular') NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    booking_status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
    payment_reference VARCHAR(100),
    completed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_program FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ==============================================================================
-- 7. PAYMENTS (Source of Truth for Revenue)
-- ==============================================================================
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., TXN202600001
    user_id INT NOT NULL,
    booking_id INT,
    membership_id INT,
    payment_type ENUM('Booking', 'Membership') NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    currency CHAR(3) DEFAULT 'INR',
    payment_method ENUM('Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash'),
    payment_status ENUM('Success', 'Failed', 'Pending') DEFAULT 'Pending',
    payment_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payments_membership FOREIGN KEY (membership_id) REFERENCES user_memberships(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ==============================================================================
-- 8. NOTIFICATIONS
-- ==============================================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    notification_title VARCHAR(255) NOT NULL,
    notification_message TEXT NOT NULL,
    read_status ENUM('Read', 'Unread') DEFAULT 'Unread',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ==============================================================================
-- 9. ACTIVITY LOGS
-- ==============================================================================
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    activity_type ENUM(
        'REGISTER', 'LOGIN', 'BOOKING_CREATED', 'BOOKING_CONFIRMED', 
        'BOOKING_COMPLETED', 'BOOKING_CANCELLED', 'MEMBERSHIP_PURCHASED', 
        'MEMBERSHIP_RENEWED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 
        'TRAINER_ADDED', 'TRAINER_UPDATED', 'PROGRAM_ADDED', 'PROGRAM_UPDATED'
    ) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ==============================================================================
-- 10. ACHIEVEMENTS
-- ==============================================================================
CREATE TABLE achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    badge_icon VARCHAR(255),
    unlock_criteria TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==============================================================================
-- 11. USER ACHIEVEMENTS
-- ==============================================================================
CREATE TABLE user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    achievement_status ENUM('Locked', 'Earned') DEFAULT 'Locked',
    progress_percentage INT DEFAULT 0,
    earned_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(user_id, achievement_id)
) ENGINE=InnoDB;

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_member_id ON users(member_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Bookings
CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_date ON bookings(session_date);

-- Payments
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- Soft Deletes Optimizations
CREATE INDEX idx_trainers_is_active ON trainers(is_active);
CREATE INDEX idx_programs_is_active ON programs(is_active);

-- ==============================================================================
-- DEFAULT SEED DATA
-- ==============================================================================

-- 1. Insert Default Administrator
-- Note: Password is a placeholder bcrypt hash. Ensure it's replaced or handled during your backend setup.
INSERT INTO users (member_id, full_name, email, password, role, is_active)
VALUES 
('MEM000001', 'System Administrator', 'admin@elevatefitness.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGGaT1lW', 'admin', TRUE);

-- 2. Insert Default Membership Plans
INSERT INTO membership_plans (plan_name, monthly_price, annual_price, discount_percentage, description, membership_access_level, features)
VALUES
(
    'Silver', 
    1999.00, 
    1599.00, 
    5.00, 
    'Basic membership for individuals starting their fitness journey.', 
    'Level 1', 
    '["Gym Floor Access", "Locker Room Access", "1 Group Class per Month"]'
),
(
    'Gold', 
    3999.00, 
    3599.00, 
    10.00, 
    'Premium membership with comprehensive perks and full facility access.', 
    'Level 2', 
    '["Gym Floor Access", "Locker Room Access", "Unlimited Group Classes", "Pool Access"]'
),
(
    'Platinum', 
    6999.00, 
    6299.00, 
    15.00, 
    'All-inclusive VIP membership for the ultimate fitness experience.', 
    'Level 3', 
    '["Gym Floor Access", "Locker Room & Sauna", "Unlimited Group Classes", "Pool Access", "2 Personal Training Sessions/Month", "Guest Passes"]'
);
