const express = require('express');
const { Pool } = require('pg');
const { userExperiencesDb } = require('../db');
const router = express.Router();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware to ensure user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Save user interests to users table
router.post('/interests', requireAuth, async (req, res) => {
  const { userId, interests } = req.body;
  
  // Verify the user is updating their own profile
  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'Unauthorized to update this profile' });
  }

  const client = await pool.connect();
  try {
    // Convert interests array to JSON string for storage
    const interestsJson = JSON.stringify(interests);
    
    // Update or insert interests in users table
    const result = await client.query(`
      UPDATE users 
      SET interests = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, interests;
    `, [interestsJson, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      success: true, 
      message: 'Interests saved successfully',
      interests: JSON.parse(result.rows[0].interests || '[]')
    });

  } catch (error) {
    console.error('Error saving interests:', error);
    res.status(500).json({ error: 'Failed to save interests' });
  } finally {
    client.release();
  }
});

// Save user experiences to user_experiences table
router.post('/experiences', requireAuth, async (req, res) => {
  const { experiences } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // First, delete existing experiences for this user
    await client.query('DELETE FROM user_experiences WHERE id = $1', [experiences.id]);

    // Insert new experiences
    if (experiences && experiences.length > 0) {
      for (const experience of experiences) {
        await client.query(`
          INSERT INTO user_experiences (id, skill, years_of_experience)
          VALUES ($1, $2, $3)
        `, [experience.id, experience.skill, experience.years]);
      }
    }

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Experiences saved successfully',
      count: experiences.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving experiences:', error);
    res.status(500).json({ error: 'Failed to save experiences' });
  } finally {
    client.release();
  }
});

// Get user interests
router.get('/interests/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;
  
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT interests FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const interests = JSON.parse(result.rows[0].interests || '[]');
    res.json({ interests });

  } catch (error) {
    console.error('Error fetching interests:', error);
    res.status(500).json({ error: 'Failed to fetch interests' });
  } finally {
    client.release();
  }
});

// Get user experiences
router.get('/experiences/:userId', async (req, res) => {
  const { userId } = req.params;
  
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM user_experiences WHERE id = $1 ORDER BY skill',
      [userId]
    );

    const skills = result.rows[0].skill;
    const years_of_experience = result.rows[0].years_of_experience;
    const experiences = skills.map((skill, i) => ({
      id: userId,
      skill: skill,
      years_of_experience: years_of_experience[i]
    }));

    console.log("backend experiences:", experiences);
    res.json({ experiences });

  } catch (error) {
    console.error('Error fetching experiences:', error);
    res.status(500).json({ error: 'Failed to fetch experiences' });
  } finally {
    client.release();
  }
});

router.post('/set-user-experiences', async (req, res) => {
  try {
    const { experiences } = req.body;
    console.log("user backend:", experiences);
    
    // Save user to database (find existing or create new)
    await userExperiencesDb.addExperiences(experiences);
    
    // Send success response
    res.json({ 
      success: true, 
      message: 'User experience data saved to database successfully',
    });
  } catch (error) {
    console.error('Error saving user experience to database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save user experience data to database',
      error: error.message
    });
  }
})

module.exports = router;
