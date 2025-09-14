const { Pool } = require('pg');
require('dotenv').config({ path: '../frontend/.env' });

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

// User database operations
const userDb = {
  // Find user by Google ID
  async findByGoogleId(googleId) {
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
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO users (email, name, avatar_url, google_id, bio, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) 
         RETURNING *`,
        [
          profile.emails[0].value,
          profile.displayName,
          profile.photos[0].value,
          profile.id,
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
    let user = await this.findByGoogleId(profile.id);
    
    if (user) {
      // Update user info in case it changed
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
            profile.id
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

module.exports = { pool, userDb };
