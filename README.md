# Elevate Fitness Backend

This is the backend infrastructure for the Elevate Fitness Management System.

## Technology Stack
- Node.js
- Express.js
- MySQL2 (Promise API)
- dotenv
- cors
- bcrypt
- jsonwebtoken
- multer
- nodemon

## Setup
1. Run `npm install` to install all dependencies.
2. Copy `.env.example` to `.env` and fill in your database credentials.
3. Import the `database/schema.sql` into MySQL Workbench.
4. Run `npm run dev` to start the development server on port 5000.

## Folder Structure
- `/config` - Configuration files (e.g., db.js)
- `/controllers` - Request handlers
- `/database` - Contains the `schema.sql` file
- `/middleware` - Express middleware
- `/models` - Database models and queries
- `/routes` - API routes
- `/services` - Business logic and reusable services
- `/utils` - Utility functions
- `/uploads` - File uploads directory
