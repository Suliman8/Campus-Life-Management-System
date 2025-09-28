const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3005;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'campus_grades',
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

// Grade point mappings
const GRADE_POINTS = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0,
  'I': null, 'W': null, 'P': null, 'NP': null
};

// Validation schemas
const assignmentSchema = Joi.object({
  course_id: Joi.number().integer().required(),
  assignment_name: Joi.string().min(1).max(100).required(),
  assignment_type: Joi.string().valid('homework', 'quiz', 'exam', 'project', 'participation', 'other').required(),
  max_points: Joi.number().positive().required(),
  due_date: Joi.date().required(),
  weight: Joi.number().min(0).max(100).default(1),
  description: Joi.string().max(500).optional()
});

const gradeSchema = Joi.object({
  assignment_id: Joi.number().integer().required(),
  student_id: Joi.string().required(),
  points_earned: Joi.number().min(0).required(),
  comments: Joi.string().max(1000).optional(),
  graded_date: Joi.date().default(() => new Date())
});

const finalGradeSchema = Joi.object({
  student_id: Joi.string().required(),
  course_id: Joi.number().integer().required(),
  letter_grade: Joi.string().valid('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'I', 'W', 'P', 'NP').required(),
  gpa_points: Joi.number().min(0).max(4.0).optional(),
  semester: Joi.string().required(),
  year: Joi.number().integer().required()
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Assignments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        assignment_name VARCHAR(100) NOT NULL,
        assignment_type VARCHAR(20) NOT NULL,
        max_points DECIMAL(8,2) NOT NULL,
        due_date DATE NOT NULL,
        weight DECIMAL(5,2) DEFAULT 1.0,
        description TEXT,
        created_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Grades table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
        student_id VARCHAR(20) NOT NULL,
        points_earned DECIMAL(8,2) NOT NULL,
        percentage DECIMAL(5,2),
        comments TEXT,
        graded_by VARCHAR(50),
        graded_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(assignment_id, student_id)
      );
    `);

    // Final grades table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS final_grades (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(20) NOT NULL,
        course_id INTEGER NOT NULL,
        letter_grade VARCHAR(2) NOT NULL,
        gpa_points DECIMAL(3,1),
        calculated_percentage DECIMAL(5,2),
        semester VARCHAR(10) NOT NULL,
        year INTEGER NOT NULL,
        issued_by VARCHAR(50),
        issued_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, course_id, semester, year)
      );
    `);

    // Grade categories table for weighted grading
    await pool.query(`
      CREATE TABLE IF NOT EXISTS grade_categories (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        category_name VARCHAR(50) NOT NULL,
        weight_percentage DECIMAL(5,2) NOT NULL,
        drop_lowest INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(course_id, category_name)
      );
    `);

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_grades_assignment ON grades(assignment_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_final_grades_student ON final_grades(student_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_final_grades_course ON final_grades(course_id);');

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

// Utility function to calculate percentage
function calculatePercentage(pointsEarned, maxPoints) {
  return maxPoints > 0 ? (pointsEarned / maxPoints * 100).toFixed(2) : 0;
}

// Utility function to calculate letter grade from percentage
function calculateLetterGrade(percentage) {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 65) return 'D';
  return 'F';
}

// Routes
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'grades-service',
    timestamp: new Date().toISOString()
  });
});

// Create assignment
app.post('/api/grades/assignments', verifyToken, async (req, res) => {
  try {
    // Check if user has faculty or admin role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    // Validate input
    const { error, value } = assignmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      course_id,
      assignment_name,
      assignment_type,
      max_points,
      due_date,
      weight,
      description
    } = value;

    // Create assignment
    const result = await pool.query(`
      INSERT INTO assignments (
        course_id, assignment_name, assignment_type, max_points,
        due_date, weight, description, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      course_id, assignment_name, assignment_type, max_points,
      due_date, weight, description, req.user.userId
    ]);

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: result.rows[0]
    });

  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assignments for a course
app.get('/api/grades/courses/:course_id/assignments', verifyToken, async (req, res) => {
  try {
    const { course_id } = req.params;

    const result = await pool.query(`
      SELECT a.*,
             COUNT(g.id) as submissions,
             AVG(g.percentage) as avg_percentage
      FROM assignments a
      LEFT JOIN grades g ON a.id = g.assignment_id
      WHERE a.course_id = $1
      GROUP BY a.id
      ORDER BY a.due_date DESC
    `, [course_id]);

    res.json({ assignments: result.rows });

  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit grade for an assignment
app.post('/api/grades/assignments/:assignment_id/grades', verifyToken, async (req, res) => {
  try {
    // Check if user has faculty or admin role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    const { assignment_id } = req.params;

    // Validate input
    const { error, value } = gradeSchema.validate({
      ...req.body,
      assignment_id: parseInt(assignment_id)
    });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { student_id, points_earned, comments, graded_date } = value;

    // Get assignment details
    const assignmentResult = await pool.query(
      'SELECT * FROM assignments WHERE id = $1',
      [assignment_id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentResult.rows[0];
    const percentage = calculatePercentage(points_earned, assignment.max_points);

    // Insert or update grade
    const result = await pool.query(`
      INSERT INTO grades (
        assignment_id, student_id, points_earned, percentage, comments, graded_by, graded_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (assignment_id, student_id)
      DO UPDATE SET
        points_earned = EXCLUDED.points_earned,
        percentage = EXCLUDED.percentage,
        comments = EXCLUDED.comments,
        graded_by = EXCLUDED.graded_by,
        graded_date = EXCLUDED.graded_date,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [assignment_id, student_id, points_earned, percentage, comments, req.user.userId, graded_date]);

    res.status(201).json({
      message: 'Grade submitted successfully',
      grade: result.rows[0]
    });

  } catch (error) {
    console.error('Submit grade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student grades for a course
app.get('/api/grades/students/:student_id/courses/:course_id', verifyToken, async (req, res) => {
  try {
    const { student_id, course_id } = req.params;

    // Check if user can access this data
    if (req.user.role === 'student' && req.user.userId !== student_id) {
      return res.status(403).json({ error: 'Access denied. Can only view your own grades.' });
    }

    const result = await pool.query(`
      SELECT
        g.*,
        a.assignment_name,
        a.assignment_type,
        a.max_points,
        a.due_date,
        a.weight
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      WHERE g.student_id = $1 AND a.course_id = $2
      ORDER BY a.due_date DESC
    `, [student_id, course_id]);

    // Calculate overall grade
    let totalWeightedPoints = 0;
    let totalWeights = 0;
    let totalPoints = 0;
    let maxTotalPoints = 0;

    result.rows.forEach(grade => {
      const weightedPoints = parseFloat(grade.points_earned) * parseFloat(grade.weight);
      const weightedMax = parseFloat(grade.max_points) * parseFloat(grade.weight);

      totalWeightedPoints += weightedPoints;
      totalWeights += parseFloat(grade.weight);
      totalPoints += parseFloat(grade.points_earned);
      maxTotalPoints += parseFloat(grade.max_points);
    });

    const overallPercentage = maxTotalPoints > 0 ? (totalPoints / maxTotalPoints * 100) : 0;
    const letterGrade = calculateLetterGrade(overallPercentage);

    res.json({
      student_id,
      course_id: parseInt(course_id),
      grades: result.rows,
      summary: {
        total_assignments: result.rows.length,
        overall_percentage: overallPercentage.toFixed(2),
        letter_grade: letterGrade,
        total_points: totalPoints.toFixed(2),
        max_total_points: maxTotalPoints.toFixed(2)
      }
    });

  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all student grades (transcript)
app.get('/api/grades/students/:student_id/transcript', verifyToken, async (req, res) => {
  try {
    const { student_id } = req.params;

    // Check if user can access this data
    if (req.user.role === 'student' && req.user.userId !== student_id) {
      return res.status(403).json({ error: 'Access denied. Can only view your own transcript.' });
    }

    const result = await pool.query(`
      SELECT *
      FROM final_grades
      WHERE student_id = $1
      ORDER BY year DESC, semester, course_id
    `, [student_id]);

    // Calculate GPA
    const gradesWithGPA = result.rows.filter(grade => grade.gpa_points !== null);
    const totalGradePoints = gradesWithGPA.reduce((sum, grade) => sum + parseFloat(grade.gpa_points), 0);
    const totalCredits = gradesWithGPA.length; // Assuming each course is worth 1 credit
    const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';

    res.json({
      student_id,
      transcript: result.rows,
      gpa_summary: {
        cumulative_gpa: gpa,
        total_courses: result.rows.length,
        total_credit_hours: totalCredits
      }
    });

  } catch (error) {
    console.error('Get transcript error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Issue final grade
app.post('/api/grades/final', verifyToken, async (req, res) => {
  try {
    // Check if user has faculty or admin role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    // Validate input
    const { error, value } = finalGradeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { student_id, course_id, letter_grade, semester, year } = value;
    const gpa_points = GRADE_POINTS[letter_grade];

    // Calculate percentage from current grades
    const gradesResult = await pool.query(`
      SELECT
        g.points_earned,
        a.max_points,
        a.weight
      FROM grades g
      JOIN assignments a ON g.assignment_id = a.id
      WHERE g.student_id = $1 AND a.course_id = $2
    `, [student_id, course_id]);

    let calculatedPercentage = 0;
    if (gradesResult.rows.length > 0) {
      let totalPoints = 0;
      let maxTotalPoints = 0;

      gradesResult.rows.forEach(grade => {
        totalPoints += parseFloat(grade.points_earned);
        maxTotalPoints += parseFloat(grade.max_points);
      });

      calculatedPercentage = maxTotalPoints > 0 ? (totalPoints / maxTotalPoints * 100) : 0;
    }

    // Insert or update final grade
    const result = await pool.query(`
      INSERT INTO final_grades (
        student_id, course_id, letter_grade, gpa_points, calculated_percentage,
        semester, year, issued_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (student_id, course_id, semester, year)
      DO UPDATE SET
        letter_grade = EXCLUDED.letter_grade,
        gpa_points = EXCLUDED.gpa_points,
        calculated_percentage = EXCLUDED.calculated_percentage,
        issued_by = EXCLUDED.issued_by,
        issued_date = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      student_id, course_id, letter_grade, gpa_points,
      calculatedPercentage.toFixed(2), semester, year, req.user.userId
    ]);

    res.status(201).json({
      message: 'Final grade issued successfully',
      final_grade: result.rows[0]
    });

  } catch (error) {
    console.error('Issue final grade error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get course grade summary
app.get('/api/grades/courses/:course_id/summary', verifyToken, async (req, res) => {
  try {
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    const { course_id } = req.params;

    // Get grade distribution
    const distributionResult = await pool.query(`
      SELECT
        letter_grade,
        COUNT(*) as count
      FROM final_grades
      WHERE course_id = $1
      GROUP BY letter_grade
      ORDER BY
        CASE letter_grade
          WHEN 'A+' THEN 1 WHEN 'A' THEN 2 WHEN 'A-' THEN 3
          WHEN 'B+' THEN 4 WHEN 'B' THEN 5 WHEN 'B-' THEN 6
          WHEN 'C+' THEN 7 WHEN 'C' THEN 8 WHEN 'C-' THEN 9
          WHEN 'D+' THEN 10 WHEN 'D' THEN 11 WHEN 'F' THEN 12
          ELSE 13
        END
    `, [course_id]);

    // Get average GPA
    const gpaResult = await pool.query(`
      SELECT AVG(gpa_points) as average_gpa
      FROM final_grades
      WHERE course_id = $1 AND gpa_points IS NOT NULL
    `, [course_id]);

    // Get assignment statistics
    const assignmentStats = await pool.query(`
      SELECT
        assignment_type,
        COUNT(*) as count,
        AVG(max_points) as avg_max_points
      FROM assignments
      WHERE course_id = $1
      GROUP BY assignment_type
    `, [course_id]);

    res.json({
      course_id: parseInt(course_id),
      grade_distribution: distributionResult.rows,
      average_gpa: gpaResult.rows[0].average_gpa ? parseFloat(gpaResult.rows[0].average_gpa).toFixed(2) : null,
      assignment_statistics: assignmentStats.rows
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
  console.log(`Grades service running on port ${port}`);
  await initializeDatabase();
});

module.exports = app;