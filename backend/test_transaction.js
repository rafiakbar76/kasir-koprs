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

// Test helper function
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function testTransaction() {
  try {
    console.log('Testing transaction with items...\n');
    
    const result = await transaction(async (client) => {
      let totalAmount = 0;
      const userId = 1; // Use existing user
      
      // Create transaction
      console.log('1. Creating transaction...');
      const txResult = await client.query(
        'INSERT INTO transactions (user_id, total_amount, payment_method, notes) VALUES ($1, $2, $3, $4) RETURNING id',
        [userId, 0, 'cash', 'Test transaction']
      );
      const transactionId = txResult.rows[0].id;
      console.log(`   ✅ Created transaction ID: ${transactionId}`);
      
      // Add sample items
      const items = [
        { product_id: 1, quantity: 2, price: 25000 },
        { product_id: 2, quantity: 1, price: 30000 }
      ];
      
      for (const item of items) {
        const subtotal = item.quantity * item.price;
        totalAmount += subtotal;
        
        console.log(`2. Adding item ${item.product_id}...`);
        await client.query(
          'INSERT INTO transaction_items (transaction_id, product_id, quantity, price, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [transactionId, item.product_id, item.quantity, item.price, subtotal]
        );
        console.log(`   ✅ Added ${item.quantity} x Rp${item.price}`);
      }
      
      // Update transaction total
      console.log(`3. Updating transaction total to Rp${totalAmount}...`);
      await client.query(
        'UPDATE transactions SET total_amount = $1 WHERE id = $2',
        [totalAmount, transactionId]
      );
      console.log('   ✅ Updated total');
      
      return { id: transactionId, total_amount: totalAmount };
    });
    
    console.log('\n✅ Transaction test passed!');
    console.log('Result:', result);
    
  } catch (err) {
    console.error('❌ Transaction test failed:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
  }
}

testTransaction();
