const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'campus_students',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // limit each IP to 200 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);

// Auth service URL
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Validation schemas
const studentSchema = Joi.object({
  student_id: Joi.string().required(),
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
  date_of_birth: Joi.date().required(),
  enrollment_date: Joi.date().default(() => new Date()),
  program: Joi.string().required(),
  year_level: Joi.number().integer().min(1).max(8).required(),
  status: Joi.string().valid('active', 'inactive', 'graduated', 'suspended').default('active'),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zip_code: Joi.string().required(),
    country: Joi.string().default('USA')
  }).required()
});

const updateStudentSchema = Joi.object({
  first_name: Joi.string().min(2).max(50),
  last_name: Joi.string().min(2).max(50),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/),
  program: Joi.string(),
  year_level: Joi.number().integer().min(1).max(8),
  status: Joi.string().valid('active', 'inactive', 'graduated', 'suspended'),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zip_code: Joi.string(),
    country: Joi.string()
  })
});

// Initialize database tables
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(20) UNIQUE NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        date_of_birth DATE NOT NULL,
        enrollment_date DATE DEFAULT CURRENT_DATE,
        program VARCHAR(100) NOT NULL,
        year_level INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        address JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);');

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

// Routes
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'student-service',
    timestamp: new Date().toISOString()
  });
});

// Get all students with pagination and filtering
app.get('/api/students', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const program = req.query.program;
    const search = req.query.search;

    let query = 'SELECT * FROM students WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM students WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Add filters
    if (status) {
      query += ` AND status = $${paramIndex}`;
      countQuery += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (program) {
      query += ` AND program ILIKE $${paramIndex}`;
      countQuery += ` AND program ILIKE $${paramIndex}`;
      params.push(`%${program}%`);
      paramIndex++;
    }

    if (search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex + 1} OR email ILIKE $${paramIndex + 2} OR student_id ILIKE $${paramIndex + 3})`;
      countQuery += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex + 1} OR email ILIKE $${paramIndex + 2} OR student_id ILIKE $${paramIndex + 3})`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      paramIndex += 4;
    }

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [studentsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)) // Remove limit and offset for count query
    ]);

    const totalStudents = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalStudents / limit);

    res.json({
      students: studentsResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalStudents,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student by ID
app.get('/api/students/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM students WHERE id = $1 OR student_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student: result.rows[0] });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new student
app.post('/api/students', verifyToken, async (req, res) => {
  try {
    // Check if user has admin or faculty role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    // Validate input
    const { error, value } = studentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      student_id,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      enrollment_date,
      program,
      year_level,
      status,
      address
    } = value;

    // Check if student_id or email already exists
    const existingStudent = await pool.query(
      'SELECT * FROM students WHERE student_id = $1 OR email = $2',
      [student_id, email]
    );

    if (existingStudent.rows.length > 0) {
      return res.status(400).json({ error: 'Student ID or email already exists' });
    }

    // Insert new student
    const result = await pool.query(`
      INSERT INTO students (
        student_id, first_name, last_name, email, phone,
        date_of_birth, enrollment_date, program, year_level, status, address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      student_id, first_name, last_name, email, phone,
      date_of_birth, enrollment_date, program, year_level, status, JSON.stringify(address)
    ]);

    res.status(201).json({
      message: 'Student created successfully',
      student: result.rows[0]
    });

  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student
app.put('/api/students/:id', verifyToken, async (req, res) => {
  try {
    // Check if user has admin or faculty role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;

    // Validate input
    const { error, value } = updateStudentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if student exists
    const existingStudent = await pool.query(
      'SELECT * FROM students WHERE id = $1 OR student_id = $1',
      [id]
    );

    if (existingStudent.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(key === 'address' ? JSON.stringify(value[key]) : value[key]);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(existingStudent.rows[0].id);

    const updateQuery = `
      UPDATE students
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    res.json({
      message: 'Student updated successfully',
      student: result.rows[0]
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student
app.delete('/api/students/:id', verifyToken, async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM students WHERE id = $1 OR student_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      message: 'Student deleted successfully',
      student: result.rows[0]
    });

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student statistics
app.get('/api/students/stats/overview', verifyToken, async (req, res) => {
  try {
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    const stats = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM students'),
      pool.query('SELECT COUNT(*) as active FROM students WHERE status = $1', ['active']),
      pool.query('SELECT program, COUNT(*) as count FROM students GROUP BY program ORDER BY count DESC'),
      pool.query('SELECT year_level, COUNT(*) as count FROM students GROUP BY year_level ORDER BY year_level'),
      pool.query('SELECT status, COUNT(*) as count FROM students GROUP BY status')
    ]);

    res.json({
      total_students: parseInt(stats[0].rows[0].total),
      active_students: parseInt(stats[1].rows[0].active),
      by_program: stats[2].rows,
      by_year_level: stats[3].rows,
      by_status: stats[4].rows
    });

  } catch (error) {
    console.error('Get stats error:', error);
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
  console.log(`Student service running on port ${port}`);
  await initializeDatabase();
});

module.exports = app;