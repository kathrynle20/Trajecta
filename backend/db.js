const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
// const { v4: uuidv4 } = require('uuid');

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
         ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         avatar_url = EXCLUDED.avatar_url,
         google_id = EXCLUDED.google_id
         RETURNING *`,
        [
          id,
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
      console.log('User found by Google ID:', user.id);
      return user;
    }
    
    // If not found by Google ID, try to find by email
    const client = await pool.connect();
    try {
      const emailResult = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [profile.emails[0].value]
      );
      
      if (emailResult.rows.length > 0) {
        // User exists with this email, update their Google ID
        const updateResult = await client.query(
          `UPDATE users SET google_id = $1 WHERE email = $2 RETURNING *`,
          [profile.id, profile.emails[0].value]
        );
        console.log('Updated existing user with Google ID:', updateResult.rows[0].id);
        return updateResult.rows[0];
      }
    } finally {
      client.release();
    }
    
    // User doesn't exist, create new one
    console.log('Creating new user for:', profile.emails[0].value);
    return await this.createFromGoogleProfile(profile);
  },

  // Create community
  async createCommunity(profile, forum) {
    // Find or create user from Google profile
    console.log("made it to backend");
    let user = await this.findById(profile.id);
    
    if (user) {
      const client = await pool.connect();
      console.log("adding community:", forum);
      try {
        const forumResult = await client.query(
          `INSERT INTO forums (name, description, created_by, created_at, num_members)
          VALUES ($1, $2, $3, $4, $5) RETURNING *
          `, 
          [
            forum.name,
            forum.description,
            user.id,
            new Date(),
            1
          ]
        );

        const createdForum = forumResult.rows[0];
        // console.log("Forum created with ID:", createdForum.id);

        // const forum_members = await client.query(
        //   `INSERT INTO forum_members (forum_id, user_id, role, joined_at)
        //   VALUES ($1, $2, $3, $4)
        //   `, 
        //   [
        //     createdForum.id,
        //     user.id,
        //     'owner',
        //     new Date()
        //   ]
        // );
        
        // console.log("Forum member added successfully");
        return createdForum;
      } finally {
        client.release();
      }
    } else {
      throw new Error('User not found');
    }
  },

  // Load communities for user
  async findCommunitiesForUser(profile) {
    // First try to find existing user by Google ID
    console.log("findCommunitiesForUser - user:", profile.id);
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
    let user = await this.findOrCreateFromGoogleProfile(profile);
    
    if (user) {
      const client = await pool.connect();
      try {
        console.log("Creating post:", post, "for forum:", forum);
        const postResult = await client.query(
          `INSERT INTO posts (id, forum_id, user_id, title, content, is_public, upvotes, created_at)
          VALUES ($1, $2, $3, $4, $5, true, 0, NOW()) RETURNING *
          `, 
          [
            uuidv4(),
            forum,
            user.id,
            post.title,
            post.content
          ]
        );
        console.log("Post created successfully:", postResult.rows[0]);
        return postResult.rows[0];
      } finally {
        client.release();
      }
    } else {
      throw new Error('User not found');
    }
  },

  // Load posts for community
  async findPostsForCommunity(forum) {
    const client = await pool.connect();
    try {
      console.log("Finding posts for forum:", forum);
      const postResult = await client.query(
        `SELECT p.id, p.forum_id, p.user_id, p.title, p.content, p.is_public, p.upvotes, p.created_at,
                u.name as author_name, u.avatar_url as author_avatar
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.forum_id = $1
        ORDER BY p.created_at DESC
        `, 
        [
          forum
        ]
      );
      console.log("Found posts:", postResult.rows.length);
      return postResult.rows;
    } finally {
      client.release();
    }
  },

  // Update post upvotes
  async updatePostUpvotes(postId, increment = true) {
    const client = await pool.connect();
    try {
      console.log("Updating upvotes for post:", postId, "increment:", increment);
      const updateResult = await client.query(
        `UPDATE posts 
         SET upvotes = upvotes + $2 
         WHERE id = $1 
         RETURNING *`,
        [postId, increment ? 1 : -1]
      );
      
      if (updateResult.rows.length === 0) {
        throw new Error('Post not found');
      }
      
      console.log("Updated post upvotes:", updateResult.rows[0]);
      return updateResult.rows[0];
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
