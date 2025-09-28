const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const moment = require('moment');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3008;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'campus_library',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300 // limit each IP to 300 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);

// Auth service URL
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Validation schemas
const bookSchema = Joi.object({
  isbn: Joi.string().pattern(/^(?:\d{10}|\d{13})$/).required(),
  title: Joi.string().min(1).max(500).required(),
  author: Joi.string().min(1).max(200).required(),
  publisher: Joi.string().max(200).optional(),
  publication_year: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional(),
  category: Joi.string().max(100).required(),
  subcategory: Joi.string().max(100).optional(),
  description: Joi.string().max(2000).optional(),
  language: Joi.string().max(50).default('English'),
  edition: Joi.string().max(50).optional(),
  pages: Joi.number().integer().min(1).optional(),
  location: Joi.string().max(100).required(),
  dewey_decimal: Joi.string().pattern(/^\d{3}\.\d{1,3}$/).optional(),
  cover_image_url: Joi.string().uri().optional(),
  digital_copy_url: Joi.string().uri().optional(),
  acquisition_date: Joi.date().default(() => new Date()),
  condition: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'damaged').default('good'),
  status: Joi.string().valid('available', 'borrowed', 'reserved', 'maintenance', 'lost').default('available')
});

const updateBookSchema = Joi.object({
  title: Joi.string().min(1).max(500),
  author: Joi.string().min(1).max(200),
  publisher: Joi.string().max(200),
  publication_year: Joi.number().integer().min(1800).max(new Date().getFullYear()),
  category: Joi.string().max(100),
  subcategory: Joi.string().max(100),
  description: Joi.string().max(2000),
  language: Joi.string().max(50),
  edition: Joi.string().max(50),
  pages: Joi.number().integer().min(1),
  location: Joi.string().max(100),
  dewey_decimal: Joi.string().pattern(/^\d{3}\.\d{1,3}$/),
  cover_image_url: Joi.string().uri(),
  digital_copy_url: Joi.string().uri(),
  condition: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'damaged'),
  status: Joi.string().valid('available', 'borrowed', 'reserved', 'maintenance', 'lost')
});

const borrowSchema = Joi.object({
  user_id: Joi.string().required(),
  book_id: Joi.number().integer().required(),
  due_date: Joi.date().min('now').optional()
});

const reservationSchema = Joi.object({
  user_id: Joi.string().required(),
  book_id: Joi.number().integer().required()
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Books table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        isbn VARCHAR(13) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        author VARCHAR(200) NOT NULL,
        publisher VARCHAR(200),
        publication_year INTEGER,
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100),
        description TEXT,
        language VARCHAR(50) DEFAULT 'English',
        edition VARCHAR(50),
        pages INTEGER,
        location VARCHAR(100) NOT NULL,
        dewey_decimal VARCHAR(10),
        cover_image_url TEXT,
        digital_copy_url TEXT,
        acquisition_date DATE DEFAULT CURRENT_DATE,
        condition VARCHAR(20) DEFAULT 'good',
        status VARCHAR(20) DEFAULT 'available',
        total_copies INTEGER DEFAULT 1,
        available_copies INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Borrowing records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS borrowing_records (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(100),
        user_email VARCHAR(255),
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        borrow_date DATE DEFAULT CURRENT_DATE,
        due_date DATE NOT NULL,
        return_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        fine_amount DECIMAL(8,2) DEFAULT 0.00,
        renewal_count INTEGER DEFAULT 0,
        max_renewals INTEGER DEFAULT 2,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Reservations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(100),
        user_email VARCHAR(255),
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        reservation_date DATE DEFAULT CURRENT_DATE,
        expiry_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        priority INTEGER DEFAULT 1,
        notified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, book_id, status)
      );
    `);

    // Fines table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fines (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        borrowing_record_id INTEGER REFERENCES borrowing_records(id) ON DELETE CASCADE,
        fine_amount DECIMAL(8,2) NOT NULL,
        fine_reason VARCHAR(100) NOT NULL,
        fine_date DATE DEFAULT CURRENT_DATE,
        paid_date DATE,
        status VARCHAR(20) DEFAULT 'unpaid',
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_borrowing_user ON borrowing_records(user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_borrowing_status ON borrowing_records(status);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_borrowing_due_date ON borrowing_records(due_date);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reservations_book ON reservations(book_id);');

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

// Calculate fine amount
function calculateFine(dueDays) {
  const FINE_PER_DAY = 0.50;
  const MAX_FINE = 25.00;
  return Math.min(dueDays * FINE_PER_DAY, MAX_FINE);
}

// Routes
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'library-service',
    timestamp: new Date().toISOString()
  });
});

// Search books with pagination and filtering
app.get('/api/library/books', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM books WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM books WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Add filters
    if (req.query.search) {
      query += ` AND (title ILIKE $${paramIndex} OR author ILIKE $${paramIndex + 1} OR isbn ILIKE $${paramIndex + 2})`;
      countQuery += ` AND (title ILIKE $${paramIndex} OR author ILIKE $${paramIndex + 1} OR isbn ILIKE $${paramIndex + 2})`;
      const searchPattern = `%${req.query.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      paramIndex += 3;
    }

    if (req.query.category) {
      query += ` AND category = $${paramIndex}`;
      countQuery += ` AND category = $${paramIndex}`;
      params.push(req.query.category);
      paramIndex++;
    }

    if (req.query.author) {
      query += ` AND author ILIKE $${paramIndex}`;
      countQuery += ` AND author ILIKE $${paramIndex}`;
      params.push(`%${req.query.author}%`);
      paramIndex++;
    }

    if (req.query.status) {
      query += ` AND status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
      params.push(req.query.status);
      paramIndex++;
    }

    if (req.query.language) {
      query += ` AND language = $${paramIndex}`;
      countQuery += ` AND language = $${paramIndex}`;
      params.push(req.query.language);
      paramIndex++;
    }

    // Add sorting
    const sortBy = req.query.sortBy || 'title';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [booksResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    const totalBooks = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      books: booksResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalBooks,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get book by ID
app.get('/api/library/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const bookResult = await pool.query(
      'SELECT * FROM books WHERE id = $1 OR isbn = $1',
      [id]
    );

    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = bookResult.rows[0];

    // Get current borrowing and reservation info
    const [borrowingResult, reservationResult] = await Promise.all([
      pool.query(
        'SELECT COUNT(*) as active_borrows FROM borrowing_records WHERE book_id = $1 AND status = $2',
        [book.id, 'active']
      ),
      pool.query(
        'SELECT COUNT(*) as active_reservations FROM reservations WHERE book_id = $1 AND status = $2',
        [book.id, 'active']
      )
    ]);

    book.current_borrows = parseInt(borrowingResult.rows[0].active_borrows);
    book.current_reservations = parseInt(reservationResult.rows[0].active_reservations);

    res.json({ book });

  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new book (Admin/Librarian only)
app.post('/api/library/books', verifyToken, async (req, res) => {
  try {
    // Check if user has admin or faculty role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    // Validate input
    const { error, value } = bookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      isbn, title, author, publisher, publication_year, category, subcategory,
      description, language, edition, pages, location, dewey_decimal,
      cover_image_url, digital_copy_url, acquisition_date, condition, status
    } = value;

    // Check if book with same ISBN already exists
    const existingBook = await pool.query(
      'SELECT * FROM books WHERE isbn = $1',
      [isbn]
    );

    if (existingBook.rows.length > 0) {
      return res.status(400).json({ error: 'Book with this ISBN already exists' });
    }

    // Insert new book
    const result = await pool.query(`
      INSERT INTO books (
        isbn, title, author, publisher, publication_year, category, subcategory,
        description, language, edition, pages, location, dewey_decimal,
        cover_image_url, digital_copy_url, acquisition_date, condition, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      isbn, title, author, publisher, publication_year, category, subcategory,
      description, language, edition, pages, location, dewey_decimal,
      cover_image_url, digital_copy_url, acquisition_date, condition, status
    ]);

    res.status(201).json({
      message: 'Book added successfully',
      book: result.rows[0]
    });

  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update book
app.put('/api/library/books/:id', verifyToken, async (req, res) => {
  try {
    // Check if user has admin or faculty role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    const { id } = req.params;

    // Validate input
    const { error, value } = updateBookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if book exists
    const existingBook = await pool.query(
      'SELECT * FROM books WHERE id = $1',
      [id]
    );

    if (existingBook.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value[key]);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE books
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    res.json({
      message: 'Book updated successfully',
      book: result.rows[0]
    });

  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Borrow book
app.post('/api/library/borrow', verifyToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = borrowSchema.validate({
      ...req.body,
      user_id: req.user.userId
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { user_id, book_id, due_date } = value;

    // Default due date is 14 days from now
    const defaultDueDate = due_date || moment().add(14, 'days').toDate();

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if book exists and is available
      const bookResult = await client.query(
        'SELECT * FROM books WHERE id = $1',
        [book_id]
      );

      if (bookResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Book not found' });
      }

      const book = bookResult.rows[0];

      if (book.available_copies <= 0 || book.status !== 'available') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Book is not available for borrowing' });
      }

      // Check if user already has this book borrowed
      const existingBorrow = await client.query(
        'SELECT * FROM borrowing_records WHERE user_id = $1 AND book_id = $2 AND status = $3',
        [user_id, book_id, 'active']
      );

      if (existingBorrow.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'You already have this book borrowed' });
      }

      // Check user's borrowing limit (max 5 active borrows)
      const userBorrowCount = await client.query(
        'SELECT COUNT(*) as count FROM borrowing_records WHERE user_id = $1 AND status = $2',
        [user_id, 'active']
      );

      if (parseInt(userBorrowCount.rows[0].count) >= 5) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'You have reached the maximum borrowing limit (5 books)' });
      }

      // Create borrowing record
      const borrowResult = await client.query(`
        INSERT INTO borrowing_records (
          user_id, user_name, user_email, book_id, due_date
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [user_id, req.user.name || 'Unknown', req.user.email, book_id, defaultDueDate]);

      // Update book availability
      await client.query(
        'UPDATE books SET available_copies = available_copies - 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [book_id]
      );

      // Remove any active reservations for this user and book
      await client.query(
        'UPDATE reservations SET status = $1 WHERE user_id = $2 AND book_id = $3 AND status = $4',
        ['fulfilled', user_id, book_id, 'active']
      );

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Book borrowed successfully',
        borrowing_record: borrowResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Borrow book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Return book
app.post('/api/library/return/:borrowing_id', verifyToken, async (req, res) => {
  try {
    const { borrowing_id } = req.params;

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get borrowing record
      const borrowResult = await client.query(
        'SELECT * FROM borrowing_records WHERE id = $1 AND status = $2',
        [borrowing_id, 'active']
      );

      if (borrowResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Active borrowing record not found' });
      }

      const borrowRecord = borrowResult.rows[0];

      // Check if user owns this borrowing record or is admin/faculty
      if (req.user.role !== 'admin' && req.user.role !== 'faculty' && borrowRecord.user_id !== req.user.userId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Access denied' });
      }

      const returnDate = new Date();
      const dueDate = new Date(borrowRecord.due_date);
      let fineAmount = 0;

      // Calculate fine if overdue
      if (returnDate > dueDate) {
        const overdueDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        fineAmount = calculateFine(overdueDays);

        // Create fine record if there's a fine
        if (fineAmount > 0) {
          await client.query(`
            INSERT INTO fines (user_id, borrowing_record_id, fine_amount, fine_reason)
            VALUES ($1, $2, $3, $4)
          `, [borrowRecord.user_id, borrowing_id, fineAmount, `Overdue return (${overdueDays} days)`]);
        }
      }

      // Update borrowing record
      await client.query(`
        UPDATE borrowing_records
        SET return_date = $1, status = $2, fine_amount = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [returnDate, 'returned', fineAmount, borrowing_id]);

      // Update book availability
      await client.query(
        'UPDATE books SET available_copies = available_copies + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [borrowRecord.book_id]
      );

      // Check if there are any active reservations for this book
      const reservationResult = await client.query(`
        SELECT * FROM reservations
        WHERE book_id = $1 AND status = $2
        ORDER BY priority ASC, reservation_date ASC
        LIMIT 1
      `, [borrowRecord.book_id, 'active']);

      let reservationNotice = null;
      if (reservationResult.rows.length > 0) {
        const reservation = reservationResult.rows[0];
        // Mark reservation as ready for pickup
        await client.query(
          'UPDATE reservations SET status = $1, expiry_date = $2, notified = $3 WHERE id = $4',
          ['ready', moment().add(3, 'days').toDate(), false, reservation.id]
        );

        reservationNotice = {
          user_id: reservation.user_id,
          message: 'Your reserved book is now available for pickup'
        };
      }

      await client.query('COMMIT');

      res.json({
        message: 'Book returned successfully',
        fine_amount: fineAmount,
        reservation_notice: reservationNotice
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reserve book
app.post('/api/library/reserve', verifyToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = reservationSchema.validate({
      ...req.body,
      user_id: req.user.userId
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { user_id, book_id } = value;

    // Check if book exists
    const bookResult = await pool.query(
      'SELECT * FROM books WHERE id = $1',
      [book_id]
    );

    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = bookResult.rows[0];

    // Check if book is available (no need to reserve if available)
    if (book.available_copies > 0) {
      return res.status(400).json({ error: 'Book is currently available. You can borrow it directly.' });
    }

    // Check if user already has this book reserved
    const existingReservation = await pool.query(
      'SELECT * FROM reservations WHERE user_id = $1 AND book_id = $2 AND status IN ($3, $4)',
      [user_id, book_id, 'active', 'ready']
    );

    if (existingReservation.rows.length > 0) {
      return res.status(400).json({ error: 'You already have this book reserved' });
    }

    // Check if user already has this book borrowed
    const existingBorrow = await pool.query(
      'SELECT * FROM borrowing_records WHERE user_id = $1 AND book_id = $2 AND status = $3',
      [user_id, book_id, 'active']
    );

    if (existingBorrow.rows.length > 0) {
      return res.status(400).json({ error: 'You already have this book borrowed' });
    }

    // Get next priority number
    const priorityResult = await pool.query(
      'SELECT COALESCE(MAX(priority), 0) + 1 as next_priority FROM reservations WHERE book_id = $1 AND status = $2',
      [book_id, 'active']
    );

    const priority = priorityResult.rows[0].next_priority;

    // Create reservation
    const result = await pool.query(`
      INSERT INTO reservations (user_id, user_name, user_email, book_id, priority, expiry_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      user_id,
      req.user.name || 'Unknown',
      req.user.email,
      book_id,
      priority,
      moment().add(7, 'days').toDate() // Reservation expires in 7 days if not fulfilled
    ]);

    res.status(201).json({
      message: 'Book reserved successfully',
      reservation: result.rows[0],
      queue_position: priority
    });

  } catch (error) {
    console.error('Reserve book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's borrowing history
app.get('/api/library/my/borrowings', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        br.*,
        b.title,
        b.author,
        b.isbn,
        CASE
          WHEN br.status = 'active' AND br.due_date < CURRENT_DATE
          THEN CURRENT_DATE - br.due_date
          ELSE 0
        END as overdue_days
      FROM borrowing_records br
      JOIN books b ON br.book_id = b.id
      WHERE br.user_id = $1
      ORDER BY br.created_at DESC
    `, [req.user.userId]);

    res.json({ borrowings: result.rows });

  } catch (error) {
    console.error('Get user borrowings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's reservations
app.get('/api/library/my/reservations', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.*,
        b.title,
        b.author,
        b.isbn,
        b.available_copies
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      WHERE r.user_id = $1 AND r.status IN ('active', 'ready')
      ORDER BY r.reservation_date DESC
    `, [req.user.userId]);

    res.json({ reservations: result.rows });

  } catch (error) {
    console.error('Get user reservations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overdue books (Admin/Librarian only)
app.get('/api/library/overdue', verifyToken, async (req, res) => {
  try {
    // Check if user has admin or faculty role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    const result = await pool.query(`
      SELECT
        br.*,
        b.title,
        b.author,
        b.isbn,
        CURRENT_DATE - br.due_date as overdue_days
      FROM borrowing_records br
      JOIN books b ON br.book_id = b.id
      WHERE br.status = 'active' AND br.due_date < CURRENT_DATE
      ORDER BY br.due_date ASC
    `);

    res.json({ overdue_books: result.rows });

  } catch (error) {
    console.error('Get overdue books error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get categories
app.get('/api/library/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT category, COUNT(*) as book_count
      FROM books
      GROUP BY category
      ORDER BY category
    `);

    res.json({ categories: result.rows });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
  console.log(`Library service running on port ${port}`);
  await initializeDatabase();
});

module.exports = app;