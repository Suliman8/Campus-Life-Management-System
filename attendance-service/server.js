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
const port = process.env.PORT || 3004;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'campus_attendance',
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
const attendanceSchema = Joi.object({
  student_id: Joi.string().required(),
  course_id: Joi.number().integer().required(),
  session_date: Joi.date().required(),
  session_type: Joi.string().valid('lecture', 'lab', 'tutorial', 'exam').default('lecture'),
  status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
  check_in_time: Joi.date().optional(),
  check_out_time: Joi.date().optional(),
  notes: Joi.string().max(500).optional()
});

const bulkAttendanceSchema = Joi.object({
  course_id: Joi.number().integer().required(),
  session_date: Joi.date().required(),
  session_type: Joi.string().valid('lecture', 'lab', 'tutorial', 'exam').default('lecture'),
  attendances: Joi.array().items(
    Joi.object({
      student_id: Joi.string().required(),
      status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
      check_in_time: Joi.date().optional(),
      check_out_time: Joi.date().optional(),
      notes: Joi.string().max(500).optional()
    })
  ).required()
});

const attendanceSessionSchema = Joi.object({
  course_id: Joi.number().integer().required(),
  session_date: Joi.date().required(),
  session_type: Joi.string().valid('lecture', 'lab', 'tutorial', 'exam').default('lecture'),
  start_time: Joi.date().required(),
  end_time: Joi.date().required(),
  location: Joi.string().required(),
  instructor_id: Joi.string().required()
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Attendance sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        session_date DATE NOT NULL,
        session_type VARCHAR(20) DEFAULT 'lecture',
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        location VARCHAR(100) NOT NULL,
        instructor_id VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(course_id, session_date, session_type)
      );
    `);

    // Attendance records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        student_id VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        check_in_time TIMESTAMP,
        check_out_time TIMESTAMP,
        notes TEXT,
        recorded_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, student_id)
      );
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_sessions_course_date ON attendance_sessions(course_id, session_date);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);');

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
    service: 'attendance-service',
    timestamp: new Date().toISOString()
  });
});

// Create attendance session
app.post('/api/attendance/sessions', verifyToken, async (req, res) => {
  try {
    // Check if user has faculty or admin role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    // Validate input
    const { error, value } = attendanceSessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      course_id,
      session_date,
      session_type,
      start_time,
      end_time,
      location,
      instructor_id
    } = value;

    // Check for existing session
    const existingSession = await pool.query(
      'SELECT * FROM attendance_sessions WHERE course_id = $1 AND session_date = $2 AND session_type = $3',
      [course_id, session_date, session_type]
    );

    if (existingSession.rows.length > 0) {
      return res.status(400).json({ error: 'Session already exists for this course, date, and type' });
    }

    // Create session
    const result = await pool.query(`
      INSERT INTO attendance_sessions (
        course_id, session_date, session_type, start_time, end_time, location, instructor_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [course_id, session_date, session_type, start_time, end_time, location, instructor_id]);

    res.status(201).json({
      message: 'Attendance session created successfully',
      session: result.rows[0]
    });

  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance sessions
app.get('/api/attendance/sessions', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const course_id = req.query.course_id;
    const date_from = req.query.date_from;
    const date_to = req.query.date_to;

    let query = `
      SELECT s.*,
             COUNT(ar.id) as total_records,
             COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
             COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
             COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
             COUNT(CASE WHEN ar.status = 'excused' THEN 1 END) as excused_count
      FROM attendance_sessions s
      LEFT JOIN attendance_records ar ON s.id = ar.session_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (course_id) {
      query += ` AND s.course_id = $${paramIndex}`;
      params.push(course_id);
      paramIndex++;
    }

    if (date_from) {
      query += ` AND s.session_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      query += ` AND s.session_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    query += ` GROUP BY s.id ORDER BY s.session_date DESC, s.start_time DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ sessions: result.rows });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record single attendance
app.post('/api/attendance/record', verifyToken, async (req, res) => {
  try {
    // Check if user has faculty or admin role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    // Validate input
    const { error, value } = attendanceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      student_id,
      course_id,
      session_date,
      session_type,
      status,
      check_in_time,
      check_out_time,
      notes
    } = value;

    // Find or create session
    let session = await pool.query(
      'SELECT * FROM attendance_sessions WHERE course_id = $1 AND session_date = $2 AND session_type = $3',
      [course_id, session_date, session_type]
    );

    let session_id;
    if (session.rows.length === 0) {
      // Create session if it doesn't exist
      const newSession = await pool.query(`
        INSERT INTO attendance_sessions (
          course_id, session_date, session_type, start_time, end_time, location, instructor_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        course_id,
        session_date,
        session_type,
        moment(session_date).format('YYYY-MM-DD HH:mm:ss'),
        moment(session_date).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        'TBD',
        req.user.userId
      ]);
      session_id = newSession.rows[0].id;
    } else {
      session_id = session.rows[0].id;
    }

    // Insert or update attendance record
    const result = await pool.query(`
      INSERT INTO attendance_records (
        session_id, student_id, status, check_in_time, check_out_time, notes, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (session_id, student_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        check_in_time = EXCLUDED.check_in_time,
        check_out_time = EXCLUDED.check_out_time,
        notes = EXCLUDED.notes,
        recorded_by = EXCLUDED.recorded_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [session_id, student_id, status, check_in_time, check_out_time, notes, req.user.userId]);

    res.status(201).json({
      message: 'Attendance recorded successfully',
      attendance: result.rows[0]
    });

  } catch (error) {
    console.error('Record attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record bulk attendance
app.post('/api/attendance/bulk', verifyToken, async (req, res) => {
  try {
    // Check if user has faculty or admin role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    // Validate input
    const { error, value } = bulkAttendanceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { course_id, session_date, session_type, attendances } = value;

    // Find or create session
    let session = await pool.query(
      'SELECT * FROM attendance_sessions WHERE course_id = $1 AND session_date = $2 AND session_type = $3',
      [course_id, session_date, session_type]
    );

    let session_id;
    if (session.rows.length === 0) {
      // Create session if it doesn't exist
      const newSession = await pool.query(`
        INSERT INTO attendance_sessions (
          course_id, session_date, session_type, start_time, end_time, location, instructor_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        course_id,
        session_date,
        session_type,
        moment(session_date).format('YYYY-MM-DD HH:mm:ss'),
        moment(session_date).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        'TBD',
        req.user.userId
      ]);
      session_id = newSession.rows[0].id;
    } else {
      session_id = session.rows[0].id;
    }

    // Begin transaction for bulk insert
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const results = [];
      for (const attendance of attendances) {
        const result = await client.query(`
          INSERT INTO attendance_records (
            session_id, student_id, status, check_in_time, check_out_time, notes, recorded_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (session_id, student_id)
          DO UPDATE SET
            status = EXCLUDED.status,
            check_in_time = EXCLUDED.check_in_time,
            check_out_time = EXCLUDED.check_out_time,
            notes = EXCLUDED.notes,
            recorded_by = EXCLUDED.recorded_by,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [
          session_id,
          attendance.student_id,
          attendance.status,
          attendance.check_in_time,
          attendance.check_out_time,
          attendance.notes,
          req.user.userId
        ]);
        results.push(result.rows[0]);
      }

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Bulk attendance recorded successfully',
        session_id,
        records_processed: results.length,
        attendances: results
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Bulk attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance records for a session
app.get('/api/attendance/sessions/:session_id/records', verifyToken, async (req, res) => {
  try {
    const { session_id } = req.params;

    const result = await pool.query(`
      SELECT ar.*, s.course_id, s.session_date, s.session_type
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.id
      WHERE ar.session_id = $1
      ORDER BY ar.student_id
    `, [session_id]);

    res.json({ records: result.rows });

  } catch (error) {
    console.error('Get session records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student attendance history
app.get('/api/attendance/student/:student_id', verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;
    const course_id = req.query.course_id;
    const date_from = req.query.date_from;
    const date_to = req.query.date_to;

    let query = `
      SELECT ar.*, s.course_id, s.session_date, s.session_type, s.location
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.id
      WHERE ar.student_id = $1
    `;
    const params = [student_id];
    let paramIndex = 2;

    if (course_id) {
      query += ` AND s.course_id = $${paramIndex}`;
      params.push(course_id);
      paramIndex++;
    }

    if (date_from) {
      query += ` AND s.session_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      query += ` AND s.session_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    query += ` ORDER BY s.session_date DESC`;

    const result = await pool.query(query, params);

    // Calculate attendance statistics
    const stats = {
      total_sessions: result.rows.length,
      present: result.rows.filter(r => r.status === 'present').length,
      absent: result.rows.filter(r => r.status === 'absent').length,
      late: result.rows.filter(r => r.status === 'late').length,
      excused: result.rows.filter(r => r.status === 'excused').length
    };

    stats.attendance_percentage = stats.total_sessions > 0 ?
      ((stats.present + stats.late) / stats.total_sessions * 100).toFixed(2) : 0;

    res.json({
      student_id,
      statistics: stats,
      records: result.rows
    });

  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get course attendance summary
app.get('/api/attendance/course/:course_id/summary', verifyToken, async (req, res) => {
  try {
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    const { course_id } = req.params;
    const date_from = req.query.date_from;
    const date_to = req.query.date_to;

    let query = `
      SELECT
        ar.student_id,
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late,
        COUNT(CASE WHEN ar.status = 'excused' THEN 1 END) as excused,
        ROUND(
          (COUNT(CASE WHEN ar.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2
        ) as attendance_percentage
      FROM attendance_records ar
      JOIN attendance_sessions s ON ar.session_id = s.id
      WHERE s.course_id = $1
    `;
    const params = [course_id];
    let paramIndex = 2;

    if (date_from) {
      query += ` AND s.session_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      query += ` AND s.session_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    query += ` GROUP BY ar.student_id ORDER BY attendance_percentage DESC`;

    const result = await pool.query(query, params);

    res.json({
      course_id: parseInt(course_id),
      summary: result.rows
    });

  } catch (error) {
    console.error('Get course summary error:', error);
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
  console.log(`Attendance service running on port ${port}`);
  await initializeDatabase();
});

module.exports = app;