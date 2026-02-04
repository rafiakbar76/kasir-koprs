import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'kasir_db',
};

const pool = new Pool(poolConfig);

async function test() {
  try {
    const client = await pool.connect();
    
    // Test 1: Check table structure
    console.log('Testing products table structure...');
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);
    console.log('Products columns:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Test 2: Simple query
    console.log('\nTesting simple SELECT...');
    const simple = await client.query('SELECT COUNT(*) FROM products');
    console.log('Total products:', simple.rows[0].count);
    
    // Test 3: Query with WHERE
    console.log('\nTesting SELECT with WHERE is_active...');
    const withWhere = await client.query(
      'SELECT * FROM products WHERE is_active = true LIMIT 5'
    );
    console.log('Active products:', withWhere.rows.length);
    
    // Test 4: Query with user_id
    console.log('\nTesting SELECT with user_id...');
    const withUserId = await client.query(
      'SELECT * FROM products WHERE user_id = $1 AND is_active = true LIMIT 5',
      [1]
    );
    console.log('Products for user 1:', withUserId.rows.length);
    
    client.release();
    console.log('\n✅ All tests passed!');
  } catch (err) {
    console.error('❌ Test error:', err.message);
  } finally {
    await pool.end();
  }
}

test();
