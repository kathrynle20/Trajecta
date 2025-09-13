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

async function readUsers() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
    console.log('---');
    
    // First, let's see what tables exist
    console.log('Available tables:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    console.log('---');
    
    // Try to read from users table
    console.log('Users table data:');
    const usersResult = await client.query('SELECT * FROM users ORDER BY id;');
    
    if (usersResult.rows.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log(`Found ${usersResult.rows.length} user(s):`);
      console.log('---');
      
      usersResult.rows.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        Object.keys(user).forEach(key => {
          console.log(`  ${key}: ${user[key]}`);
        });
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error reading from database:', error.message);
    
    // If users table doesn't exist, let's check what tables do exist
    try {
      console.log('\nTrying to list all tables...');
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      
      if (tablesResult.rows.length > 0) {
        console.log('Available tables:');
        tablesResult.rows.forEach(row => {
          console.log(`- ${row.table_name}`);
        });
      } else {
        console.log('No tables found in the public schema.');
      }
    } catch (listError) {
      console.error('Error listing tables:', listError.message);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the database reader
readUsers().catch(console.error);
