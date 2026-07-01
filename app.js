const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const programRoutes = require('./routes/programRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize Express app
const app = express();

// Register middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register test routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "Elevate Fitness Backend Running"
    });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        database: "Connected",
        server: "Running"
    });
});

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/users', userRoutes);

module.exports = app;
