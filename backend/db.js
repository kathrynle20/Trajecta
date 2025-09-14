const { Pool } = require('pg');
require('dotenv').config({ path: '../frontend/.env' });
const { v4: uuidv4 } = require('uuid');

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
  },

  // Create community
  async createCommunity(profile, forum) {
    // First try to find existing user by Google ID
    let user = await this.findByGoogleId(profile.id);
    
    if (user) {
      const client = await pool.connect();
      try {
        const forumResult = await client.query(
          `INSERT INTO forums (name, description, created_by, created_at, num_members)
          VALUES ($1, $2, $3, $4, $5)
          `, 
          [
            forum.name,
            forum.description,
            user.id,
            new Date(),
            1
          ]
        );

        const forum_members = await client.query(
          `INSERT INTO forum_members (forum_id, user_id, role, joined_at)
          VALUES ($1, $2, $3, $4)
          `, 
          [
            forum.id,
            user.id,
            'owner',
            new Date()
          ]
        )
      } finally {
        client.release();
      }
    }
  },

  // Load communities for user
  async findCommunitiesForUser(profile) {
    // First try to find existing user by Google ID
    let user = await this.findByGoogleId(profile.id);
    
    if (user) {
      const client = await pool.connect();
      try {
        const result = await client.query(
          `SELECT * FROM forums
          WHERE created_by = $1
          `, 
          [
            user.id
          ]
        );
        return result.rows;
      } finally {
        client.release();
      }
    }
  },

  // Create post for user
  async createPost(profile, forum, post) {
    // First try to find existing user by Google ID
    let user = await this.findByGoogleId(profile.id);
    
    if (user) {
      const client = await pool.connect();
      try {
        console.log("POST: ", post);
        const postResult = await client.query(
          `INSERT INTO posts (id, forum_id, user_id, title, content, is_public, upvotes, created_at)
          VALUES ($1, $2, $3, $4, $5, true, 0, NOW())
          `, 
          [
            uuidv4(),
            forum,
            user.id,
            post.title,
            post.content
          ]
        );
        console.log(postResult);
      } finally {
        client.release();
      }
    }
  },

  // Load posts for community
  async findPostsForCommunity(forum) {
    const client = await pool.connect();
    try {
      const postResult = await client.query(
        `SELECT id, forum_id, user_id, title, content, is_public, upvotes, created_at
        FROM posts
        WHERE forum_id = $1
        ORDER BY created_at DESC
        `, 
        [
          forum
        ]
      );
      return postResult.rows;
    } finally {
      client.release();
    }
  },
};

const userExperiencesDb = {
  // Find user by Google ID
  async addExperiences(experiences) {
    const client = await pool.connect();
    try {
      for (const experience of experiences) {
        // Convert string to UUID using PostgreSQL cast
        await client.query(
          `INSERT INTO user_experiences (id, skill, years_of_experience)
           VALUES ($1::uuid, $2, $3::integer)
           RETURNING *`,
          [experience.id, experience.skill, experience.years_of_experience]
        );
      }
    } finally {
      client.release();
    }
  },
}

module.exports = { pool, userDb, userExperiencesDb };
