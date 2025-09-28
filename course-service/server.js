const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'campus_courses',
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
const courseSchema = Joi.object({
  course_code: Joi.string().pattern(/^[A-Z]{2,4}[0-9]{3,4}$/).required(),
  course_name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).required(),
  credits: Joi.number().integer().min(1).max(6).required(),
  department: Joi.string().required(),
  instructor_id: Joi.string().required(),
  max_capacity: Joi.number().integer().min(1).max(500).required(),
  schedule: Joi.object({
    days: Joi.array().items(Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')).required(),
    start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    room: Joi.string().required()
  }).required(),
  prerequisites: Joi.array().items(Joi.string()),
  semester: Joi.string().valid('Fall', 'Spring', 'Summer').required(),
  year: Joi.number().integer().min(2020).max(2030).required(),
  status: Joi.string().valid('active', 'inactive', 'cancelled').default('active')
});

const updateCourseSchema = Joi.object({
  course_name: Joi.string().min(3).max(100),
  description: Joi.string().max(500),
  credits: Joi.number().integer().min(1).max(6),
  department: Joi.string(),
  instructor_id: Joi.string(),
  max_capacity: Joi.number().integer().min(1).max(500),
  schedule: Joi.object({
    days: Joi.array().items(Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    room: Joi.string()
  }),
  prerequisites: Joi.array().items(Joi.string()),
  status: Joi.string().valid('active', 'inactive', 'cancelled')
});

const enrollmentSchema = Joi.object({
  student_id: Joi.string().required(),
  course_id: Joi.number().integer().required()
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        course_code VARCHAR(10) UNIQUE NOT NULL,
        course_name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        credits INTEGER NOT NULL,
        department VARCHAR(50) NOT NULL,
        instructor_id VARCHAR(50) NOT NULL,
        max_capacity INTEGER NOT NULL,
        current_enrollment INTEGER DEFAULT 0,
        schedule JSONB NOT NULL,
        prerequisites JSONB DEFAULT '[]',
        semester VARCHAR(10) NOT NULL,
        year INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Enrollments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(20) NOT NULL,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'enrolled',
        grade VARCHAR(2),
        UNIQUE(student_id, course_id)
      );
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_courses_semester_year ON courses(semester, year);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);');

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
    service: 'course-service',
    timestamp: new Date().toISOString()
  });
});

// Get all courses with filtering and pagination
app.get('/api/courses', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const department = req.query.department;
    const semester = req.query.semester;
    const year = req.query.year;
    const search = req.query.search;

    let query = `
      SELECT c.*,
             (c.max_capacity - c.current_enrollment) as available_spots
      FROM courses c
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) FROM courses WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Add filters
    if (department) {
      query += ` AND department = $${paramIndex}`;
      countQuery += ` AND department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    if (semester) {
      query += ` AND semester = $${paramIndex}`;
      countQuery += ` AND semester = $${paramIndex}`;
      params.push(semester);
      paramIndex++;
    }

    if (year) {
      query += ` AND year = $${paramIndex}`;
      countQuery += ` AND year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    if (search) {
      query += ` AND (course_name ILIKE $${paramIndex} OR course_code ILIKE $${paramIndex + 1} OR description ILIKE $${paramIndex + 2})`;
      countQuery += ` AND (course_name ILIKE $${paramIndex} OR course_code ILIKE $${paramIndex + 1} OR description ILIKE $${paramIndex + 2})`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      paramIndex += 3;
    }

    // Add pagination
    query += ` ORDER BY semester, department, course_code LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [coursesResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    const totalCourses = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCourses / limit);

    res.json({
      courses: coursesResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCourses,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get course by ID
app.get('/api/courses/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT c.*,
             (c.max_capacity - c.current_enrollment) as available_spots,
             COALESCE(
               json_agg(
                 json_build_object('student_id', e.student_id, 'enrollment_date', e.enrollment_date, 'status', e.status)
               ) FILTER (WHERE e.id IS NOT NULL),
               '[]'
             ) as enrolled_students
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE c.id = $1 OR c.course_code = $1
      GROUP BY c.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ course: result.rows[0] });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new course
app.post('/api/courses', verifyToken, async (req, res) => {
  try {
    // Check if user has admin or faculty role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    // Validate input
    const { error, value } = courseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      course_code,
      course_name,
      description,
      credits,
      department,
      instructor_id,
      max_capacity,
      schedule,
      prerequisites,
      semester,
      year,
      status
    } = value;

    // Check if course code already exists
    const existingCourse = await pool.query(
      'SELECT * FROM courses WHERE course_code = $1',
      [course_code]
    );

    if (existingCourse.rows.length > 0) {
      return res.status(400).json({ error: 'Course code already exists' });
    }

    // Insert new course
    const result = await pool.query(`
      INSERT INTO courses (
        course_code, course_name, description, credits, department,
        instructor_id, max_capacity, schedule, prerequisites, semester, year, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      course_code, course_name, description, credits, department,
      instructor_id, max_capacity, JSON.stringify(schedule),
      JSON.stringify(prerequisites || []), semester, year, status
    ]);

    res.status(201).json({
      message: 'Course created successfully',
      course: result.rows[0]
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update course
app.put('/api/courses/:id', verifyToken, async (req, res) => {
  try {
    // Check if user has admin or faculty role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    const { id } = req.params;

    // Validate input
    const { error, value } = updateCourseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if course exists
    const existingCourse = await pool.query(
      'SELECT * FROM courses WHERE id = $1',
      [id]
    );

    if (existingCourse.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        if (key === 'schedule' || key === 'prerequisites') {
          values.push(JSON.stringify(value[key]));
        } else {
          values.push(value[key]);
        }
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const updateQuery = `
      UPDATE courses
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    res.json({
      message: 'Course updated successfully',
      course: result.rows[0]
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete course
app.delete('/api/courses/:id', verifyToken, async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM courses WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      message: 'Course deleted successfully',
      course: result.rows[0]
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enroll student in course
app.post('/api/courses/enroll', verifyToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = enrollmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { student_id, course_id } = value;

    // Check if course exists and has capacity
    const courseResult = await pool.query(
      'SELECT * FROM courses WHERE id = $1 AND status = $2',
      [course_id, 'active']
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found or not active' });
    }

    const course = courseResult.rows[0];

    if (course.current_enrollment >= course.max_capacity) {
      return res.status(400).json({ error: 'Course is at maximum capacity' });
    }

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [student_id, course_id]
    );

    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({ error: 'Student is already enrolled in this course' });
    }

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert enrollment
      const enrollmentResult = await client.query(
        'INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) RETURNING *',
        [student_id, course_id]
      );

      // Update course enrollment count
      await client.query(
        'UPDATE courses SET current_enrollment = current_enrollment + 1 WHERE id = $1',
        [course_id]
      );

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Student enrolled successfully',
        enrollment: enrollmentResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Drop enrollment
app.delete('/api/courses/enroll', verifyToken, async (req, res) => {
  try {
    const { student_id, course_id } = req.body;

    if (!student_id || !course_id) {
      return res.status(400).json({ error: 'Student ID and Course ID are required' });
    }

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete enrollment
      const enrollmentResult = await client.query(
        'DELETE FROM enrollments WHERE student_id = $1 AND course_id = $2 RETURNING *',
        [student_id, course_id]
      );

      if (enrollmentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Enrollment not found' });
      }

      // Update course enrollment count
      await client.query(
        'UPDATE courses SET current_enrollment = current_enrollment - 1 WHERE id = $1',
        [course_id]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Enrollment dropped successfully',
        enrollment: enrollmentResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Drop enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student enrollments
app.get('/api/courses/student/:student_id', verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;

    const result = await pool.query(`
      SELECT c.*, e.enrollment_date, e.status as enrollment_status, e.grade
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = $1
      ORDER BY e.enrollment_date DESC
    `, [student_id]);

    res.json({ enrollments: result.rows });

  } catch (error) {
    console.error('Get student enrollments error:', error);
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
  console.log(`Course service running on port ${port}`);
  await initializeDatabase();
});

module.exports = app;