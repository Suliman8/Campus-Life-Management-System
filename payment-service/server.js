const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const stripe = require('stripe');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3010;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'campus_payments',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Stripe configuration
const stripeClient = process.env.STRIPE_SECRET_KEY
  ? stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(cors());
app.use('/webhook', express.raw({ type: 'application/json' })); // Raw body for webhooks
app.use(express.json());
app.use(limiter);

// Auth service URL
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Payment types and categories
const PAYMENT_TYPES = [
  'tuition', 'housing', 'meal_plan', 'parking', 'library_fine',
  'event_ticket', 'lab_fee', 'graduation_fee', 'transcript_fee',
  'late_fee', 'application_fee', 'other'
];

const PAYMENT_METHODS = ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'check'];

// Validation schemas
const paymentIntentSchema = Joi.object({
  amount: Joi.number().positive().max(50000).required(), // Max $500
  currency: Joi.string().length(3).default('usd'),
  payment_type: Joi.string().valid(...PAYMENT_TYPES).required(),
  description: Joi.string().min(1).max(500).required(),
  metadata: Joi.object().optional()
});

const confirmPaymentSchema = Joi.object({
  payment_intent_id: Joi.string().required(),
  payment_method: Joi.string().required()
});

const refundSchema = Joi.object({
  payment_id: Joi.number().integer().required(),
  amount: Joi.number().positive().optional(),
  reason: Joi.string().max(500).required()
});

const manualPaymentSchema = Joi.object({
  user_id: Joi.string().required(),
  amount: Joi.number().positive().required(),
  payment_type: Joi.string().valid(...PAYMENT_TYPES).required(),
  payment_method: Joi.string().valid(...PAYMENT_METHODS).required(),
  description: Joi.string().min(1).max(500).required(),
  reference_number: Joi.string().optional(),
  notes: Joi.string().max(1000).optional()
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Payment accounts table (for tracking balances)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_accounts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) UNIQUE NOT NULL,
        user_name VARCHAR(100),
        user_email VARCHAR(255),
        balance DECIMAL(10,2) DEFAULT 0.00,
        total_paid DECIMAL(10,2) DEFAULT 0.00,
        total_outstanding DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Payment transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(100) UNIQUE NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        stripe_payment_intent_id VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'usd',
        payment_type VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50),
        description TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        failure_reason TEXT,
        processed_at TIMESTAMP,
        metadata JSONB,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Payment refunds table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_refunds (
        id SERIAL PRIMARY KEY,
        refund_id VARCHAR(100) UNIQUE NOT NULL,
        payment_id INTEGER REFERENCES payment_transactions(id) ON DELETE CASCADE,
        stripe_refund_id VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        processed_at TIMESTAMP,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Payment plans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_plans (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        plan_name VARCHAR(100) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        paid_amount DECIMAL(10,2) DEFAULT 0.00,
        remaining_amount DECIMAL(10,2) NOT NULL,
        installments INTEGER NOT NULL,
        installment_amount DECIMAL(10,2) NOT NULL,
        frequency VARCHAR(20) NOT NULL, -- monthly, weekly, etc.
        next_due_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Outstanding balances/bills table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS outstanding_balances (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        bill_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        due_date DATE,
        status VARCHAR(20) DEFAULT 'unpaid',
        late_fee DECIMAL(10,2) DEFAULT 0.00,
        payment_transaction_id INTEGER REFERENCES payment_transactions(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_user ON payment_transactions(user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_type ON payment_transactions(payment_type);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_transactions_created ON payment_transactions(created_at);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_balances_user ON outstanding_balances(user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_balances_status ON outstanding_balances(status);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_balances_due_date ON outstanding_balances(due_date);');

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify token with auth service
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, {}, {
      headers: { Authorization: token }
    });

    req.user = response.data.user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper function to ensure user account exists
async function ensureUserAccount(userId, userName, userEmail) {
  const existingAccount = await pool.query(
    'SELECT * FROM payment_accounts WHERE user_id = $1',
    [userId]
  );

  if (existingAccount.rows.length === 0) {
    await pool.query(
      'INSERT INTO payment_accounts (user_id, user_name, user_email) VALUES ($1, $2, $3)',
      [userId, userName, userEmail]
    );
  }
}

// Generate transaction ID
function generateTransactionId() {
  return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// Routes
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    stripe_configured: !!stripeClient
  });
});

// Create payment intent
app.post('/api/payments/intent', verifyToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = paymentIntentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { amount, currency, payment_type, description, metadata } = value;

    // Ensure user account exists
    await ensureUserAccount(req.user.userId, req.user.name, req.user.email);

    let paymentIntent = null;
    let stripePaymentIntentId = null;

    // Create Stripe payment intent if configured
    if (stripeClient) {
      try {
        paymentIntent = await stripeClient.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata: {
            user_id: req.user.userId,
            payment_type,
            description,
            ...metadata
          }
        });
        stripePaymentIntentId = paymentIntent.id;
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        return res.status(500).json({ error: 'Payment processor error' });
      }
    }

    // Create transaction record
    const transactionId = generateTransactionId();
    const result = await pool.query(`
      INSERT INTO payment_transactions (
        transaction_id, user_id, stripe_payment_intent_id, amount, currency,
        payment_type, description, status, metadata, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      transactionId,
      req.user.userId,
      stripePaymentIntentId,
      amount,
      currency,
      payment_type,
      description,
      'pending',
      JSON.stringify(metadata || {}),
      req.user.userId
    ]);

    const response = {
      transaction_id: transactionId,
      amount,
      currency,
      payment_type,
      description,
      status: 'pending'
    };

    if (paymentIntent) {
      response.client_secret = paymentIntent.client_secret;
      response.stripe_payment_intent_id = stripePaymentIntentId;
    }

    res.status(201).json({
      message: 'Payment intent created successfully',
      payment_intent: response
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Confirm payment (for manual confirmation)
app.post('/api/payments/confirm', verifyToken, async (req, res) => {
  try {
    const { payment_intent_id, payment_method } = req.body;

    if (!payment_intent_id || !payment_method) {
      return res.status(400).json({ error: 'Payment intent ID and payment method are required' });
    }

    // Find transaction
    const transactionResult = await pool.query(
      'SELECT * FROM payment_transactions WHERE stripe_payment_intent_id = $1 OR transaction_id = $1',
      [payment_intent_id]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment intent not found' });
    }

    const transaction = transactionResult.rows[0];

    // Check if user owns this transaction
    if (transaction.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update transaction
    const result = await pool.query(`
      UPDATE payment_transactions
      SET status = $1, payment_method = $2, processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, ['succeeded', payment_method, transaction.id]);

    // Update user account balance
    await pool.query(
      'UPDATE payment_accounts SET total_paid = total_paid + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [transaction.amount, req.user.userId]
    );

    res.json({
      message: 'Payment confirmed successfully',
      transaction: result.rows[0]
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user payment history
app.get('/api/payments/history', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT pt.*, pr.amount as refunded_amount
      FROM payment_transactions pt
      LEFT JOIN payment_refunds pr ON pt.id = pr.payment_id AND pr.status = 'succeeded'
      WHERE pt.user_id = $1
    `;
    const params = [req.user.userId];
    let paramIndex = 2;

    // Add filters
    if (req.query.payment_type) {
      query += ` AND pt.payment_type = $${paramIndex}`;
      params.push(req.query.payment_type);
      paramIndex++;
    }

    if (req.query.status) {
      query += ` AND pt.status = $${paramIndex}`;
      params.push(req.query.status);
      paramIndex++;
    }

    if (req.query.date_from) {
      query += ` AND pt.created_at >= $${paramIndex}`;
      params.push(req.query.date_from);
      paramIndex++;
    }

    if (req.query.date_to) {
      query += ` AND pt.created_at <= $${paramIndex}`;
      params.push(req.query.date_to);
      paramIndex++;
    }

    query += ` ORDER BY pt.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM payment_transactions
      WHERE user_id = $1
      ${req.query.payment_type ? 'AND payment_type = $2' : ''}
      ${req.query.status ? 'AND status = $3' : ''}
    `;
    const countResult = await pool.query(countQuery, [req.user.userId]);
    const totalTransactions = parseInt(countResult.rows[0].count);

    res.json({
      transactions: result.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTransactions / limit),
        totalTransactions,
        hasNext: offset + limit < totalTransactions,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user account balance and summary
app.get('/api/payments/account', verifyToken, async (req, res) => {
  try {
    // Get account info
    const accountResult = await pool.query(
      'SELECT * FROM payment_accounts WHERE user_id = $1',
      [req.user.userId]
    );

    if (accountResult.rows.length === 0) {
      await ensureUserAccount(req.user.userId, req.user.name, req.user.email);
      return res.json({
        balance: 0,
        total_paid: 0,
        total_outstanding: 0,
        outstanding_balances: []
      });
    }

    const account = accountResult.rows[0];

    // Get outstanding balances
    const balancesResult = await pool.query(`
      SELECT * FROM outstanding_balances
      WHERE user_id = $1 AND status = 'unpaid'
      ORDER BY due_date ASC
    `, [req.user.userId]);

    // Calculate totals
    const totalOutstanding = balancesResult.rows.reduce((sum, balance) =>
      sum + parseFloat(balance.amount) + parseFloat(balance.late_fee || 0), 0
    );

    res.json({
      balance: parseFloat(account.balance),
      total_paid: parseFloat(account.total_paid),
      total_outstanding: totalOutstanding,
      outstanding_balances: balancesResult.rows,
      account_status: totalOutstanding > 0 ? 'outstanding' : 'current'
    });

  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create manual payment record (Admin/Staff only)
app.post('/api/payments/manual', verifyToken, async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    // Validate input
    const { error, value } = manualPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      user_id, amount, payment_type, payment_method,
      description, reference_number, notes
    } = value;

    // Ensure target user account exists
    await ensureUserAccount(user_id, 'Unknown', 'unknown@example.com');

    // Create transaction record
    const transactionId = generateTransactionId();
    const result = await pool.query(`
      INSERT INTO payment_transactions (
        transaction_id, user_id, amount, payment_type, payment_method,
        description, status, processed_at, metadata, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, $9)
      RETURNING *
    `, [
      transactionId,
      user_id,
      amount,
      payment_type,
      payment_method,
      description,
      'succeeded',
      JSON.stringify({ reference_number, notes, manual_entry: true }),
      req.user.userId
    ]);

    // Update user account balance
    await pool.query(
      'UPDATE payment_accounts SET total_paid = total_paid + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [amount, user_id]
    );

    res.status(201).json({
      message: 'Manual payment recorded successfully',
      transaction: result.rows[0]
    });

  } catch (error) {
    console.error('Create manual payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create refund
app.post('/api/payments/refund', verifyToken, async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    // Validate input
    const { error, value } = refundSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { payment_id, amount, reason } = value;

    // Get original payment
    const paymentResult = await pool.query(
      'SELECT * FROM payment_transactions WHERE id = $1',
      [payment_id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    if (payment.status !== 'succeeded') {
      return res.status(400).json({ error: 'Can only refund successful payments' });
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      return res.status(400).json({ error: 'Refund amount cannot exceed original payment' });
    }

    // Create refund record
    const refundId = `REF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    let stripeRefundId = null;

    // Process Stripe refund if applicable
    if (stripeClient && payment.stripe_payment_intent_id) {
      try {
        const stripeRefund = await stripeClient.refunds.create({
          payment_intent: payment.stripe_payment_intent_id,
          amount: Math.round(refundAmount * 100) // Convert to cents
        });
        stripeRefundId = stripeRefund.id;
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        return res.status(500).json({ error: 'Payment processor refund error' });
      }
    }

    const refundResult = await pool.query(`
      INSERT INTO payment_refunds (
        refund_id, payment_id, stripe_refund_id, amount, reason, status, processed_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
      RETURNING *
    `, [
      refundId, payment_id, stripeRefundId, refundAmount, reason, 'succeeded', req.user.userId
    ]);

    // Update user account balance
    await pool.query(
      'UPDATE payment_accounts SET total_paid = total_paid - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [refundAmount, payment.user_id]
    );

    res.status(201).json({
      message: 'Refund processed successfully',
      refund: refundResult.rows[0]
    });

  } catch (error) {
    console.error('Create refund error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment statistics (Admin only)
app.get('/api/payments/stats', verifyToken, async (req, res) => {
  try {
    // Check permissions
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const stats = await Promise.all([
      // Total payments by status
      pool.query(`
        SELECT status, COUNT(*) as count, SUM(amount) as total
        FROM payment_transactions
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY status
      `),
      // Payments by type
      pool.query(`
        SELECT payment_type, COUNT(*) as count, SUM(amount) as total
        FROM payment_transactions
        WHERE status = 'succeeded' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY payment_type
        ORDER BY total DESC
      `),
      // Daily revenue (last 7 days)
      pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as transactions, SUM(amount) as revenue
        FROM payment_transactions
        WHERE status = 'succeeded' AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `),
      // Outstanding balances summary
      pool.query(`
        SELECT COUNT(*) as total_outstanding, SUM(amount + COALESCE(late_fee, 0)) as total_amount
        FROM outstanding_balances
        WHERE status = 'unpaid'
      `)
    ]);

    res.json({
      payment_status_summary: stats[0].rows,
      payment_type_breakdown: stats[1].rows,
      daily_revenue: stats[2].rows,
      outstanding_summary: stats[3].rows[0]
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for Stripe (if configured)
app.post('/webhook', async (req, res) => {
  if (!stripeClient) {
    return res.status(501).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handlePaymentFailure(failedPayment);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper function to handle successful payments
async function handlePaymentSuccess(paymentIntent) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update transaction status
    await client.query(`
      UPDATE payment_transactions
      SET status = 'succeeded', processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE stripe_payment_intent_id = $1
    `, [paymentIntent.id]);

    // Update user account
    const transactionResult = await client.query(
      'SELECT * FROM payment_transactions WHERE stripe_payment_intent_id = $1',
      [paymentIntent.id]
    );

    if (transactionResult.rows.length > 0) {
      const transaction = transactionResult.rows[0];
      await client.query(
        'UPDATE payment_accounts SET total_paid = total_paid + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [transaction.amount, transaction.user_id]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Helper function to handle failed payments
async function handlePaymentFailure(paymentIntent) {
  await pool.query(`
    UPDATE payment_transactions
    SET status = 'failed',
        failure_reason = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE stripe_payment_intent_id = $2
  `, [paymentIntent.last_payment_error?.message || 'Payment failed', paymentIntent.id]);
}

// Get payment types
app.get('/api/payments/types', (req, res) => {
  res.json({ payment_types: PAYMENT_TYPES });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(port, async () => {
  console.log(`Payment service running on port ${port}`);
  await initializeDatabase();
});

module.exports = app;