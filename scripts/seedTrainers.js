const mysql = require('mysql2/promise');
require('dotenv').config();

const mockTrainers = [
  {
    id: "marcus-sterling",
    name: "Marcus Sterling",
    title: "Head Performance Coach",
    category: "strength",
    tier: "Platinum",
    specialization: "Hypertrophy & Strength",
    rating: 4.9,
    experience: "12 Years",
    email: "marcus.s@elevate.fit",
    bio: "10+ years experience. Specializes in powerlifting and athletic performance.",
    image: "/images/marcus_sterling.png"
  },
  {
    id: "dr-julian-reed",
    name: "Dr. Julian Reed",
    title: "Nutrition & Recovery Director",
    category: "wellness",
    tier: "Gold",
    specialization: "Nutrition / Wellness",
    rating: 5.0,
    experience: "9 Years",
    email: "julian.t@elevate.fit",
    bio: "PhD in Sports Nutrition. Expert in recovery protocols and metabolic health.",
    image: "/images/julian_reed.png"
  },
  {
    id: "sienna-blake",
    name: "Sienna Blake",
    title: "Weight Loss Specialist",
    category: "weight-loss wellness",
    tier: "Standard",
    specialization: "Weight Loss & Vinyasa",
    rating: 4.8,
    experience: "10 Years",
    email: "sienna.b@elevate.fit",
    bio: "Certified specialist in sustainable fat loss and functional movement.",
    image: "/images/sienna_blake.png"
  },
  {
    id: "xavier-reed",
    name: "Xavier Reed",
    title: "Functional & Kettlebell Lead",
    category: "strength",
    tier: "Standard",
    specialization: "Kettlebell & Flow",
    rating: 4.7,
    experience: "7 Years",
    email: "xavier.r@elevate.fit",
    bio: "Focused on functional movement capacity and joint mobilization dynamics.",
    image: "/images/xavier_reed.png"
  },
  {
    id: "sofia-chen",
    name: "Sofia Chen",
    title: "HIIT Performance Coach",
    category: "weight-loss",
    tier: "Standard",
    specialization: "HIIT Specialist",
    rating: 4.9,
    experience: "6 Years",
    email: "sofia.c@elevate.fit",
    bio: "Ex-Olympic sprinter specializing in explosive plyometric and high intensity programming.",
    image: "/images/sofia_chen.png"
  },
  {
    id: "liam-bennett",
    name: "Liam Bennett",
    title: "Physiotherapist & Mobility Lead",
    category: "wellness",
    tier: "Standard",
    specialization: "Physiotherapy & Mobility",
    rating: 4.9,
    experience: "11 Years",
    email: "liam.b@elevate.fit",
    bio: "Certified physical therapist specializing in muscular imbalance correction and injury rehab.",
    image: "/images/liam_bennett.png"
  },
  {
    id: "chloe-vance",
    name: "Chloe Vance",
    title: "Fat Loss Coach",
    category: "weight-loss",
    tier: "Silver",
    specialization: "Fat Loss & Transformation",
    rating: 4.8,
    experience: "5 Years",
    email: "chloe.v@elevate.fit",
    bio: "Enjoys coaching clients on structural metabolic changes and body recompositioning.",
    image: "/images/chloe_vance.png"
  },
  {
    id: "maya-patel",
    name: "Maya Patel",
    title: "Holistic Nutrition Specialist",
    category: "wellness",
    tier: "Silver",
    specialization: "Holistic Nutrition",
    rating: 4.9,
    experience: "8 Years",
    email: "maya.p@elevate.fit",
    bio: "Specialist in gut microbiome optimizations and plant-based athletic diet plans.",
    image: "/images/maya_patel.jpg"
  },
  {
    id: "david-vance",
    name: "David Vance",
    title: "Elite Performance Coach",
    category: "strength",
    tier: "Gold",
    specialization: "Elite Performance",
    rating: 5.0,
    experience: "15 Years",
    email: "david.v@elevate.fit",
    bio: "Passionate about high performance metrics, load adjustments, and Olympic lifts.",
    image: "/images/david_vance_coach.jpg"
  },
  {
    id: "elena-rodriguez",
    name: "Elena Rodriguez",
    title: "Group Classes Coordinator",
    category: "wellness",
    tier: "Standard",
    specialization: "Zumba & Pilates",
    rating: 4.8,
    experience: "6 Years",
    email: "elena.r@elevate.fit",
    bio: "Focuses on muscular conditioning through rhythmic group cardiovascular dynamics.",
    image: "/images/elena_rodriguez.jpg"
  }
];

const seedTrainers = async () => {
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

        // 1. Check if trainers table has the mock data
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM trainers WHERE trainer_name = ?', [mockTrainers[0].name]);
        
        if (rows[0].count === 0) {
            console.log('Seeding trainers...');
            
            for (const t of mockTrainers) {
                const [result] = await pool.query(
                    `INSERT INTO trainers (
                        trainer_name, email, specialization, years_of_experience, biography, 
                        membership_access_level, rating, profile_image, title, category
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        t.name, t.email, t.specialization, t.experience, t.bio,
                        t.tier, t.rating, t.image, t.title, t.category
                    ]
                );

                const newTrainerId = result.insertId;

                // 2. We need to assign trainers to programs based on matching category strings.
                // For instance, if t.category includes "wellness", assign to wellness programs.
                // First get all programs
                const [programs] = await pool.query('SELECT id, difficulty_level FROM programs');
                
                for (const p of programs) {
                    if (t.category.includes(p.difficulty_level)) {
                        await pool.query('INSERT IGNORE INTO trainer_programs (trainer_id, program_id) VALUES (?, ?)', [newTrainerId, p.id]);
                    }
                }
            }
            console.log('Successfully seeded 10 mock trainers and mapped them to programs.');
        } else {
            console.log('Mock trainers are already seeded.');
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding trainers:', error);
        process.exit(1);
    }
};

seedTrainers();
