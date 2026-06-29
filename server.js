require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Verify database connectivity
        await pool.getConnection();
        console.log('Database Connected Successfully');

        // Start the Express server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database:', error.message);
        process.exit(1);
    }
};

startServer();
