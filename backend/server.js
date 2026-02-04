import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { initDatabase, getDb, closeDatabase } from './database.js';
import { errorHandler, notFoundHandler, asyncHandler, AppError } from './middleware/errorHandler.js';
import { limiter, authLimiter, apiLimiter } from './middleware/rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ===== MIDDLEWARE =====
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3004',
    'https://koprs-kopi.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/api/transactions') {
    console.log('\n📨 [MIDDLEWARE] Incoming /api/transactions POST');
    console.log('  Content-Type:', req.get('content-type'));
    console.log('  Body exists:', !!req.body);
    if (req.body) {
      console.log('  Body.items:', Array.isArray(req.body.items) ? `Array(${req.body.items.length})` : 'NOT_ARRAY');
      console.log('  Body.payment_method:', req.body.payment_method);
    }
  }
  next();
});

// Rate limiting
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
app.use('/api/products', apiLimiter);

// Initialize database
await initDatabase();
const db = getDb();

// Ensure receipt columns exist and run maintenance tasks
async function ensureReceiptColumnsV2() {
  try {
    await db.exec("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt TEXT;");
    await db.exec("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS printed_at TIMESTAMP;");
    console.log('✅ Ensured receipt columns on transactions (v2)');
  } catch (err) {
    console.error('Failed to ensure receipt columns (v2):', err.message || err);
  }
}

// Cleanup transactions older than 2 months
async function cleanupOldTransactionsV2() {
  try {
    const sql = `DELETE FROM transactions WHERE created_at < NOW() - INTERVAL '2 months'`;
    await db.exec(sql);
    console.log('🧹 Cleaned up transactions older than 2 months (v2)');
  } catch (err) {
    console.error('Cleanup error (v2):', err.message || err);
  }
}

// Run maintenance on startup and schedule daily cleanup
await ensureReceiptColumnsV2();
await cleanupOldTransactionsV2();
setInterval(() => { cleanupOldTransactionsV2().catch(()=>{}); }, 24 * 60 * 60 * 1000); // daily

// ===== UTILITIES =====

// Standard response format
const sendResponse = (res, statusCode, success, data = null, message = null) => {
  res.status(statusCode).json({
    success,
    data,
    message,
    timestamp: new Date().toISOString(),
  });
};

// Authenticate token
const authenticateToken = asyncHandler((req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('Token required', 401, 'NO_TOKEN');
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      throw new AppError('Invalid or expired token', 403, 'INVALID_TOKEN');
    }
    req.user = user;
    next();
  });
});

// ===== AUTH ROUTES =====

// Register
app.post('/api/auth/register', authLimiter, asyncHandler(async (req, res) => {
  const { name, email, password, password_confirmation } = req.body;

  if (!name || !email || !password || !password_confirmation) {
    throw new AppError('All fields are required', 400, 'MISSING_FIELDS');
  }

  if (password !== password_confirmation) {
    throw new AppError('Passwords do not match', 400, 'PASSWORD_MISMATCH');
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400, 'WEAK_PASSWORD');
  }

  if (!email.includes('@') || !email.includes('.')) {
    throw new AppError('Invalid email format', 400, 'INVALID_EMAIL');
  }

  const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existingUser) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
    [name, email, hashedPassword]);

  const user = await db.get('SELECT id, name, email FROM users WHERE email = ?', [email]);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  console.log(`✅ User registered: ${email}`);
  sendResponse(res, 201, true, { token, user }, 'Registration successful');
}));

// Login
app.post('/api/auth/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400, 'MISSING_FIELDS');
  }

  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  console.log(`✅ User logged in: ${email}`);
  sendResponse(res, 200, true, { 
    token, 
    user: { id: user.id, name: user.name, email: user.email } 
  }, 'Login successful');
}));

// Get current user
app.get('/api/auth/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await db.get('SELECT id, name, email FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  sendResponse(res, 200, true, user);
}));

// ===== PRODUCT ROUTES =====

// Get all products
app.get('/api/products', authenticateToken, asyncHandler(async (req, res) => {
  const products = await db.all(
    'SELECT * FROM products WHERE user_id = ? AND is_active = true ORDER BY created_at DESC',
    [req.user.id]
  );
  sendResponse(res, 200, true, products);
}));

// Get single product
app.get('/api/products/:id', authenticateToken, asyncHandler(async (req, res) => {
  const product = await db.get(
    'SELECT * FROM products WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }
  sendResponse(res, 200, true, product);
}));

// Create product
app.post('/api/products', authenticateToken, asyncHandler(async (req, res) => {
  const { name, price, quantity = 0, description } = req.body;

  if (!name || price === undefined) {
    throw new AppError('Name and price are required', 400, 'MISSING_FIELDS');
  }

  if (price <= 0) {
    throw new AppError('Price must be greater than 0', 400, 'INVALID_PRICE');
  }

  const result = await db.run(
    'INSERT INTO products (user_id, name, price, quantity, description) VALUES (?, ?, ?, ?, ?) RETURNING id',
    [req.user.id, name, price, quantity, description || null]
  );

  const product = await db.get('SELECT * FROM products WHERE id = ?', [result.id]);
  console.log(`✅ Product created: ${name} (ID: ${result.id})`);
  sendResponse(res, 201, true, product, 'Product created successfully');
}));

// Update product
app.put('/api/products/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { name, price, quantity, description } = req.body;

  const product = await db.get(
    'SELECT * FROM products WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (price !== undefined) {
    if (price <= 0) {
      throw new AppError('Price must be greater than 0', 400, 'INVALID_PRICE');
    }
    updates.push('price = ?');
    values.push(price);
  }
  if (quantity !== undefined) {
    updates.push('quantity = ?');
    values.push(quantity);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400, 'NO_UPDATE_FIELDS');
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.params.id, req.user.id);

  await db.run(
    `UPDATE products SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );

  const updated = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  console.log(`✅ Product updated: ${updated.name} (ID: ${req.params.id})`);
  sendResponse(res, 200, true, updated, 'Product updated successfully');
}));

// Delete product
app.delete('/api/products/:id', authenticateToken, asyncHandler(async (req, res) => {
  const product = await db.get(
    'SELECT * FROM products WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!product) {
    throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
  }

  // Soft delete
  await db.run(
    'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [req.params.id]
  );

  console.log(`✅ Product deleted: ${product.name} (ID: ${req.params.id})`);
  sendResponse(res, 200, true, null, 'Product deleted successfully');
}));

// ===== TRANSACTION ROUTES =====

// Get transactions
app.get('/api/transactions', authenticateToken, asyncHandler(async (req, res) => {
  const transactions = await db.all(
    `SELECT t.*, 
            json_agg(json_build_object('product_id', ti.product_id, 'quantity', ti.quantity, 'price', ti.price)) as items
     FROM transactions t
     LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
     WHERE t.user_id = ?
     GROUP BY t.id
     ORDER BY t.created_at DESC
     LIMIT 100`,
    [req.user.id]
  );
  sendResponse(res, 200, true, transactions);
}));

// Get transactions for a specific date (default = today)
app.get('/api/reports/sales', authenticateToken, asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];

  const transactions = await db.all(
    `SELECT t.*, 
            json_agg(json_build_object('id', ti.id, 'product_id', ti.product_id, 'quantity', ti.quantity, 'price', ti.price)) as items
     FROM transactions t
     LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
     WHERE t.user_id = $1 AND DATE(t.created_at) = $2
     GROUP BY t.id
     ORDER BY t.created_at DESC`,
    [req.user.id, date]
  );

  sendResponse(res, 200, true, { date, transactions: transactions || [] });
}));

// Create transaction
app.post('/api/transactions', authenticateToken, asyncHandler(async (req, res) => {
  console.log('\n' + '='.repeat(60));
  console.log('📨 NEW TRANSACTION REQUEST');
  console.log('='.repeat(60));
  console.log('User ID:', req.user.id);
  console.log('Body keys:', Object.keys(req.body));
  console.log('Full body:', JSON.stringify(req.body, null, 2));
  
  const { items, payment_method, notes } = req.body;

  console.log('\n🔍 Extracted values:');
  console.log('  items:', Array.isArray(items) ? `Array(${items.length})` : typeof items, items);
  console.log('  payment_method:', payment_method, `(${typeof payment_method})`);
  console.log('  notes:', notes);

  if (!items || items.length === 0) {
    console.log('❌ VALIDATION FAILED: Missing or empty items');
    throw new AppError('Transaction items are required', 400, 'MISSING_ITEMS');
  }

  if (!payment_method) {
    console.log('❌ VALIDATION FAILED: Missing payment_method');
    throw new AppError('Payment method is required', 400, 'MISSING_PAYMENT_METHOD');
  }

  console.log('✅ VALIDATION PASSED - Processing transaction...');

  const result = await db.transaction(async (client) => {
    let totalAmount = 0;

    // Create transaction
    const txResult = await client.query(
      'INSERT INTO transactions (user_id, total_amount, payment_method, notes) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.user.id, 0, payment_method, notes || null]
    );
    const transactionId = txResult.rows[0].id;

    // Add items
    for (const item of items) {
      const subtotal = item.quantity * item.price;
      totalAmount += subtotal;

      await client.query(
        'INSERT INTO transaction_items (transaction_id, product_id, quantity, price, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [transactionId, item.product_id, item.quantity, item.price, subtotal]
      );

      // Update product quantity for tracking
      // Note: Stock validation is disabled for unlimited inventory
      await client.query(
        'UPDATE products SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Update transaction total
    await client.query(
      'UPDATE transactions SET total_amount = $1 WHERE id = $2',
      [totalAmount, transactionId]
    );

    return { id: transactionId, total_amount: totalAmount };
  });

  console.log(`✅ Transaction created: ID ${result.id}, Total: Rp${result.total_amount}`);
  sendResponse(res, 201, true, result, 'Transaction created successfully');
}));

// Print/save receipt for a transaction
app.post('/api/transaction/:id/print', authenticateToken, asyncHandler(async (req, res) => {
  const { receipt } = req.body;

  const tx = await db.get('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!tx) return sendResponse(res, 404, false, null, 'Transaction not found');

  await db.run('UPDATE transactions SET receipt = $1, printed_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3', [receipt || null, req.params.id, req.user.id]);

  const updated = await db.get('SELECT * FROM transactions WHERE id = $1', [req.params.id]);
  sendResponse(res, 200, true, updated, 'Receipt saved');
}));

// ===== REPORT ROUTES =====

// Get daily report with items
app.get('/api/reports/daily', authenticateToken, asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  
  // Get summary
  const summary = await db.get(
    `SELECT 
      DATE(t.created_at) as date,
      COUNT(DISTINCT t.id) as transaction_count,
      COALESCE(SUM(t.total_amount), 0) as total_sales
     FROM transactions t
     WHERE t.user_id = ? AND DATE(t.created_at) = ?
     GROUP BY DATE(t.created_at)`,
    [req.user.id, date]
  );

  // Get detailed items sold
  const items = await db.all(
    `SELECT 
      ti.id,
      p.name as product_name,
      ti.quantity,
      ti.price as unit_price,
      ti.subtotal,
      t.id as transaction_id,
      t.payment_method as payment_method,
      to_char(t.created_at, 'HH24:MI:SS') as transaction_time
     FROM transaction_items ti
     JOIN products p ON ti.product_id = p.id
     JOIN transactions t ON ti.transaction_id = t.id
     WHERE t.user_id = ? AND DATE(t.created_at) = ?
     ORDER BY t.created_at DESC, ti.id`,
    [req.user.id, date]
  );

  const reportData = {
    ...(summary || { date, transaction_count: 0, total_sales: 0 }),
    items: items || []
  };

  sendResponse(res, 200, true, reportData);
}));

// Get monthly report
app.get('/api/reports/monthly', authenticateToken, asyncHandler(async (req, res) => {
  const reports = await db.all(
    `SELECT 
      DATE_TRUNC('month', t.created_at)::DATE as date,
      COUNT(DISTINCT t.id) as total_transactions,
      COALESCE(SUM(t.total_amount), 0) as total_revenue
     FROM transactions t
     WHERE t.user_id = ?
     GROUP BY DATE_TRUNC('month', t.created_at)
     ORDER BY date DESC
     LIMIT 12`,
    [req.user.id]
  );

  sendResponse(res, 200, true, reports);
}));

// Health check
app.get('/health', (req, res) => {
  sendResponse(res, 200, true, { status: 'OK', timestamp: new Date() });
});

// ===== ERROR HANDLING =====
app.use(notFoundHandler);
app.use(errorHandler);

// ===== SERVER =====
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n📌 SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n📌 SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
});

export default app;
