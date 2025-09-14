const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '../frontend/.env' });

// Database configuration - only if environment variables are set
let pool = null;
if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  console.log('Database credentials not found. Database operations will be disabled.');
}

// User database operations
const userDb = {
  // Find user by Google ID
  async findByGoogleId(googleId) {
    if (!pool) return null;
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE google_id = $1',
        [googleId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  // Find user by ID
  async findById(id) {
    if (!pool) return null;
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },

  // Create new user from Google profile
  async createFromGoogleProfile(profile) {
    if (!pool) return null;
    const client = await pool.connect();
    const id = uuidv4();
    try {
      const result = await client.query(
        `INSERT INTO users (id, email, name, avatar_url, google_id, bio, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
         RETURNING *`,
        [
          id,
          profile.emails[0].value,
          profile.displayName,
          profile.photos[0].value,
          profile.google_id,
          `New user joined via Google OAuth`
        ]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  },

  // Find or create user from Google profile
  async findOrCreateFromGoogleProfile(profile) {
    // First try to find existing user by Google ID
    let user = await this.findByGoogleId(profile.google_id);
    
    if (user) {
      // Update user info in case it changed
      if (!pool) return null;
      const client = await pool.connect();
      try {
        const result = await client.query(
          `UPDATE users 
           SET name = $1, avatar_url = $2, email = $3
           WHERE google_id = $4 
           RETURNING *`,
          [
            profile.displayName,
            profile.photos[0].value,
            profile.emails[0].value,
            profile.google_id
          ]
        );
        return result.rows[0];
      } finally {
        client.release();
      }
    } else {
      // Create new user
      return await this.createFromGoogleProfile(profile);
    }
  }
};

const userExperiencesDb = {
  // Find user by Google ID
  async addExperiences(experiences) {
    if (!pool) return null;
    const client = await pool.connect();
    try {
      const id = experiences[0].id;
      const skills = experiences.map(experience => experience.skill);
      const years = experiences.map(experience => experience.years_of_experience);
      
      // Convert string to UUID using PostgreSQL cast
      await client.query('DELETE FROM user_experiences WHERE id = $1::uuid',
        [id]);
      await client.query(
        `INSERT INTO user_experiences (id, skill, years_of_experience)
          VALUES ($1::uuid, $2, $3)
          RETURNING *`,
        [id, skills, years]
      );
      
    } finally {
      client.release();
    }
  },

  async findExperiencesById(id) {
    if (!pool) return null;
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM user_experiences WHERE id = $1',
        [id]
      );
      console.log("result:", result);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  },
}

module.exports = { pool, userDb, userExperiencesDb };
