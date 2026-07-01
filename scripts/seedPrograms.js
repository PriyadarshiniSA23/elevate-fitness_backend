const mysql = require('mysql2/promise');
require('dotenv').config();

const mockPrograms = [
  {
    id: "personal-training",
    title: "Personal Training",
    price: 499,
    duration: "60",
    category: "strength",
    tier: "Standard",
    description: "Elite 1-on-1 coaching tailored specifically to your biological profile and physical goals.",
    image: "/images/personal_training.png"
  },
  {
    id: "strength-conditioning",
    title: "Strength & Conditioning",
    price: 699,
    duration: "75",
    category: "strength",
    tier: "Gold",
    description: "Build absolute power, structural integrity, and athletic resilience through scientific periodization.",
    image: "/images/strength_conditioning.png"
  },
  {
    id: "weight-loss",
    title: "Weight Loss Program",
    price: 599,
    duration: "60",
    category: "weight-loss",
    tier: "Standard",
    description: "Optimize body composition, accelerate metabolic rate, and sustain fat loss via personalized cardio and diet structure.",
    image: "/images/weight_loss.png"
  },
  {
    id: "hiit",
    title: "HIIT Training",
    price: 399,
    duration: "45",
    category: "weight-loss",
    tier: "Standard",
    description: "High-intensity interval protocols focused on cardiovascular conditioning and maximizing calorie afterburn.",
    image: "/images/hiit.png"
  },
  {
    id: "functional-fitness",
    title: "Functional Fitness",
    price: 449,
    duration: "60",
    category: "strength",
    tier: "Standard",
    description: "Enhance multi-planar movement, core strength, stability, and coordination for life and sport.",
    image: "/images/functional_fitness.png"
  },
  {
    id: "group-fitness",
    title: "Group Fitness Classes",
    price: 299,
    duration: "60",
    category: "wellness",
    tier: "Standard",
    description: "Dynamic, community-centric group classes led by expert instructors for high energy and motivation.",
    image: "/images/group_fitness.png"
  },
  {
    id: "yoga-wellness",
    title: "Yoga & Wellness",
    price: 499,
    duration: "60",
    category: "wellness",
    tier: "Silver",
    description: "Find equilibrium, mindfulness, and flexibility with restorative yoga flows and meditation.",
    image: "/images/yoga_wellness.png"
  },
  {
    id: "sports-performance",
    title: "Sports Performance Training",
    price: 899,
    duration: "90",
    category: "strength",
    tier: "Gold",
    description: "Elite agility drills, power development, and custom conditioning geared for competitive athletes.",
    image: "/images/sports_performance.png"
  },
  {
    id: "nutrition-coaching",
    title: "Nutrition Coaching & Lifestyle Management",
    price: 349,
    duration: "45",
    category: "wellness",
    tier: "Silver",
    description: "Work with certified clinical nutritionists to fuel performance, longevity, and overall body vitality.",
    image: "/images/nutrition_coaching.png"
  },
  {
    id: "elite-performance-recovery",
    title: "Elite Performance Assessment & Executive Recovery Program",
    price: 999,
    duration: "90",
    category: "wellness",
    tier: "Platinum",
    description: "Full biometric scanning, Vo2 Max analysis, combined with advanced percussion and cold plunge therapy.",
    image: "/images/elite_performance.png"
  }
];

const seedPrograms = async () => {
    try {
        const pool = await mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Check if programs table is empty
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM programs');
        if (rows[0].count === 0) {
            console.log('Programs table is empty. Seeding original 10 programs...');
            for (const prog of mockPrograms) {
                await pool.query(
                    `INSERT INTO programs (program_name, description, duration, price, program_image, membership_access_level, difficulty_level)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [prog.title, prog.description, parseInt(prog.duration), prog.price, prog.image, prog.tier, prog.category]
                );
            }
            console.log('Successfully seeded original 10 programs.');
        } else {
            console.log('Programs table already has data. Checking if we need to clear and insert...');
            // The user wants these 10 exact programs. Let's make sure they are in.
            // If the user already played around with it, the count might be > 0.
            // Wait, the prompt says "If the table is empty, populate it. If the table already contains those programs, do nothing."
            // But if the table has junk data, I should probably truncate or at least just insert the 10.
            // I'll check if 'Personal Training' exists.
            const [check] = await pool.query('SELECT COUNT(*) as count FROM programs WHERE program_name = ?', ['Personal Training']);
            if (check[0].count === 0) {
                console.log('Seeding missing original programs...');
                for (const prog of mockPrograms) {
                    await pool.query(
                        `INSERT INTO programs (program_name, description, duration, price, program_image, membership_access_level, difficulty_level)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [prog.title, prog.description, parseInt(prog.duration), prog.price, prog.image, prog.tier, prog.category]
                    );
                }
            } else {
                console.log('Original programs already exist.');
            }
        }
        
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedPrograms();
