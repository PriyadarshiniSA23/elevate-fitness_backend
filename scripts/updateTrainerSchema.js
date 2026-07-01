const mysql = require('mysql2/promise');
require('dotenv').config();

const updateSchema = async () => {
    let pool;
    try {
        pool = await mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log('Updating trainers table schema...');
        
        // Update availability enum
        await pool.query(`
            ALTER TABLE trainers 
            MODIFY availability ENUM('Active', 'On Leave', 'Unavailable') DEFAULT 'Active'
        `);
        console.log('Updated availability ENUM');

        // Add missing columns if they don't exist
        const columnsToAdd = [
            'email VARCHAR(100)',
            'phone VARCHAR(20)',
            'certifications VARCHAR(255)',
            'title VARCHAR(100)',
            'category VARCHAR(100)'
        ];

        for (const colDef of columnsToAdd) {
            const colName = colDef.split(' ')[0];
            try {
                await pool.query(`ALTER TABLE trainers ADD COLUMN ${colDef}`);
                console.log(`Added column ${colName}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column ${colName} already exists.`);
                } else {
                    throw err;
                }
            }
        }
        
        // Change years_of_experience to VARCHAR to hold strings like "12 Years"
        // Wait, the original schema had INT. If it's already INT, changing it to VARCHAR is safer to match mock data without parsing.
        await pool.query(`ALTER TABLE trainers MODIFY years_of_experience VARCHAR(50)`);
        console.log('Modified years_of_experience to VARCHAR(50)');

        console.log('Creating trainer_programs linking table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trainer_programs (
                trainer_id INT NOT NULL,
                program_id INT NOT NULL,
                PRIMARY KEY (trainer_id, program_id),
                FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log('Created trainer_programs table successfully.');

        process.exit();
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
};

updateSchema();
