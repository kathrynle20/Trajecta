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

async function exploreDatabase() {
  const client = await pool.connect();
  try {
    console.log('=== TRAJECTA DATABASE EXPLORER ===');
    console.log('Host:', process.env.DB_HOST);
    console.log('Database:', process.env.DB_NAME);
    console.log('User:', process.env.DB_USER);
    console.log('=====================================\n');
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Found ${tablesResult.rows.length} tables:\n`);
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`📋 TABLE: ${tableName.toUpperCase()}`);
      console.log('─'.repeat(50));
      
      try {
        // Get table structure
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `, [tableName]);
        
        console.log('Columns:');
        columnsResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`  • ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
        });
        
        // Get row count
        const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName};`);
        const rowCount = countResult.rows[0].count;
        console.log(`\nRow count: ${rowCount}`);
        
        // Show sample data (first 5 rows)
        if (rowCount > 0) {
          console.log('\nSample data (first 5 rows):');
          const sampleResult = await client.query(`SELECT * FROM ${tableName} LIMIT 5;`);
          
          sampleResult.rows.forEach((row, index) => {
            console.log(`\n  Row ${index + 1}:`);
            Object.keys(row).forEach(key => {
              const value = row[key];
              const displayValue = value === null ? 'NULL' : 
                                 typeof value === 'object' ? JSON.stringify(value) : 
                                 String(value);
              console.log(`    ${key}: ${displayValue}`);
            });
          });
        }
        
      } catch (error) {
        console.log(`❌ Error reading table ${tableName}: ${error.message}`);
      }
      
      console.log('\n' + '='.repeat(60) + '\n');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the database explorer
exploreDatabase().catch(console.error);
