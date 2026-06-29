const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

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

module.exports = app;
