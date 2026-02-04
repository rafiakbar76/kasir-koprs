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

async function testDailyReportQuery() {
  try {
    const client = await pool.connect();
    
    const today = new Date().toISOString().split('T')[0];
    const userId = 1;
    
    console.log(`Testing daily report query for user ${userId}, date ${today}\n`);
    
    // Test the query directly
    const result = await client.query(
      `SELECT 
        DATE(t.created_at) as date,
        COUNT(DISTINCT t.id) as transaction_count,
        COALESCE(SUM(t.total_amount), 0) as total_sales
       FROM transactions t
       WHERE t.user_id = $1 AND DATE(t.created_at) = $2
       GROUP BY DATE(t.created_at)`,
      [userId, today]
    );
    
    console.log('✅ Query successful!');
    console.log('Results:', result.rows);
    
    client.release();
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

testDailyReportQuery();
