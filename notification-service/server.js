const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const redis = require('redis');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const handlebars = require('handlebars');
const Queue = require('bull');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3009;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(limiter);

// Auth service URL
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = redis.createClient({ url: REDIS_URL });

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Initialize Redis connection
async function initializeRedis() {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection error:', error);
  }
}

// Create notification queues
const emailQueue = new Queue('email notifications', REDIS_URL);
const smsQueue = new Queue('sms notifications', REDIS_URL);

// Email configuration
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'test@example.com',
    pass: process.env.SMTP_PASS || 'password'
  }
});

// Twilio configuration
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Email templates
const emailTemplates = {
  welcome: {
    subject: 'Welcome to Campus Life Management System',
    template: `
      <h2>Welcome {{name}}!</h2>
      <p>Your account has been successfully created.</p>
      <p>You can now access all campus services through our portal.</p>
      <p>If you have any questions, please contact support.</p>
      <p>Best regards,<br>Campus Life Management Team</p>
    `
  },
  course_enrollment: {
    subject: 'Course Enrollment Confirmation',
    template: `
      <h2>Course Enrollment Confirmation</h2>
      <p>Dear {{name}},</p>
      <p>You have been successfully enrolled in the following course:</p>
      <ul>
        <li><strong>Course:</strong> {{courseName}}</li>
        <li><strong>Code:</strong> {{courseCode}}</li>
        <li><strong>Instructor:</strong> {{instructor}}</li>
        <li><strong>Schedule:</strong> {{schedule}}</li>
      </ul>
      <p>Best regards,<br>Academic Services</p>
    `
  },
  grade_posted: {
    subject: 'New Grade Posted',
    template: `
      <h2>Grade Posted</h2>
      <p>Dear {{name}},</p>
      <p>A new grade has been posted for your assignment:</p>
      <ul>
        <li><strong>Course:</strong> {{courseName}}</li>
        <li><strong>Assignment:</strong> {{assignmentName}}</li>
        <li><strong>Grade:</strong> {{grade}}</li>
        <li><strong>Comments:</strong> {{comments}}</li>
      </ul>
      <p>You can view detailed feedback in the student portal.</p>
      <p>Best regards,<br>Academic Services</p>
    `
  },
  event_reminder: {
    subject: 'Event Reminder',
    template: `
      <h2>Event Reminder</h2>
      <p>Dear {{name}},</p>
      <p>This is a reminder about the upcoming event you registered for:</p>
      <ul>
        <li><strong>Event:</strong> {{eventTitle}}</li>
        <li><strong>Date:</strong> {{eventDate}}</li>
        <li><strong>Time:</strong> {{eventTime}}</li>
        <li><strong>Location:</strong> {{location}}</li>
      </ul>
      <p>We look forward to seeing you there!</p>
      <p>Best regards,<br>Campus Events Team</p>
    `
  },
  library_due: {
    subject: 'Library Book Due Reminder',
    template: `
      <h2>Book Due Reminder</h2>
      <p>Dear {{name}},</p>
      <p>This is a reminder that the following book is due soon:</p>
      <ul>
        <li><strong>Title:</strong> {{bookTitle}}</li>
        <li><strong>Author:</strong> {{bookAuthor}}</li>
        <li><strong>Due Date:</strong> {{dueDate}}</li>
      </ul>
      <p>Please return the book by the due date to avoid late fees.</p>
      <p>Best regards,<br>Library Services</p>
    `
  },
  payment_confirmation: {
    subject: 'Payment Confirmation',
    template: `
      <h2>Payment Confirmation</h2>
      <p>Dear {{name}},</p>
      <p>Your payment has been successfully processed:</p>
      <ul>
        <li><strong>Transaction ID:</strong> {{transactionId}}</li>
        <li><strong>Amount:</strong> ${{amount}}</li>
        <li><strong>Description:</strong> {{description}}</li>
        <li><strong>Date:</strong> {{date}}</li>
      </ul>
      <p>Thank you for your payment.</p>
      <p>Best regards,<br>Financial Services</p>
    `
  }
};

// SMS templates
const smsTemplates = {
  course_reminder: 'Hi {{name}}, your {{courseName}} class starts in 30 minutes at {{location}}.',
  event_reminder: 'Hi {{name}}, reminder: {{eventTitle}} starts in 1 hour at {{location}}.',
  library_overdue: 'Hi {{name}}, your library book "{{bookTitle}}" is overdue. Please return ASAP.',
  payment_due: 'Hi {{name}}, your payment of ${{amount}} for {{description}} is due on {{dueDate}}.',
  emergency_alert: 'CAMPUS ALERT: {{message}} Please follow emergency procedures. Stay safe.'
};

// Validation schemas
const emailNotificationSchema = Joi.object({
  to: Joi.string().email().required(),
  template: Joi.string().valid(...Object.keys(emailTemplates)).required(),
  data: Joi.object().required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'critical').default('normal'),
  scheduledFor: Joi.date().optional()
});

const smsNotificationSchema = Joi.object({
  to: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
  template: Joi.string().valid(...Object.keys(smsTemplates)).required(),
  data: Joi.object().required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'critical').default('normal'),
  scheduledFor: Joi.date().optional()
});

const bulkEmailSchema = Joi.object({
  recipients: Joi.array().items(
    Joi.object({
      email: Joi.string().email().required(),
      data: Joi.object().required()
    })
  ).min(1).required(),
  template: Joi.string().valid(...Object.keys(emailTemplates)).required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'critical').default('normal')
});

const customEmailSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().min(1).max(200).required(),
  html: Joi.string().required(),
  text: Joi.string().optional(),
  priority: Joi.string().valid('low', 'normal', 'high', 'critical').default('normal'),
  scheduledFor: Joi.date().optional()
});

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

// Helper function to compile templates
function compileTemplate(template, data) {
  const compiledTemplate = handlebars.compile(template);
  return compiledTemplate(data);
}

// Email queue processing
emailQueue.process(async (job) => {
  const { to, subject, html, text, priority } = job.data;

  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@campus.edu',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);

    // Store delivery status in Redis
    await redisClient.setEx(
      `email:${job.id}:status`,
      3600, // 1 hour TTL
      JSON.stringify({ status: 'sent', messageId: info.messageId, sentAt: new Date() })
    );

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);

    // Store failure status in Redis
    await redisClient.setEx(
      `email:${job.id}:status`,
      3600,
      JSON.stringify({ status: 'failed', error: error.message, failedAt: new Date() })
    );

    throw error;
  }
});

// SMS queue processing
smsQueue.process(async (job) => {
  const { to, body, priority } = job.data;

  try {
    if (!twilioClient) {
      throw new Error('SMS service not configured');
    }

    const message = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });

    console.log(`SMS sent to ${to}: ${message.sid}`);

    // Store delivery status in Redis
    await redisClient.setEx(
      `sms:${job.id}:status`,
      3600,
      JSON.stringify({ status: 'sent', messageSid: message.sid, sentAt: new Date() })
    );

    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error(`Failed to send SMS to ${to}:`, error);

    // Store failure status in Redis
    await redisClient.setEx(
      `sms:${job.id}:status`,
      3600,
      JSON.stringify({ status: 'failed', error: error.message, failedAt: new Date() })
    );

    throw error;
  }
});

// Routes
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const redisStatus = redisClient.isReady ? 'connected' : 'disconnected';
    const emailQueueStatus = await emailQueue.getWaiting().then(jobs => ({ waiting: jobs.length }));
    const smsQueueStatus = await smsQueue.getWaiting().then(jobs => ({ waiting: jobs.length }));

    res.status(200).json({
      status: 'OK',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      redis: redisStatus,
      queues: {
        email: emailQueueStatus,
        sms: smsQueueStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      service: 'notification-service',
      error: error.message
    });
  }
});

// Send email notification
app.post('/api/notifications/email', verifyToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = emailNotificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { to, template, data, priority, scheduledFor } = value;

    // Get template
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      return res.status(400).json({ error: 'Invalid template' });
    }

    // Compile template
    const subject = compileTemplate(emailTemplate.subject, data);
    const html = compileTemplate(emailTemplate.template, data);

    // Add to queue
    const jobOptions = {
      priority: priority === 'critical' ? 1 : priority === 'high' ? 2 : priority === 'normal' ? 3 : 4,
      delay: scheduledFor ? new Date(scheduledFor).getTime() - Date.now() : 0,
      removeOnComplete: 50,
      removeOnFail: 20
    };

    const job = await emailQueue.add({
      to,
      subject,
      html,
      priority,
      createdBy: req.user.userId
    }, jobOptions);

    // Store notification record in Redis
    const notificationRecord = {
      id: job.id,
      type: 'email',
      to,
      template,
      subject,
      priority,
      status: 'queued',
      createdBy: req.user.userId,
      createdAt: new Date(),
      scheduledFor: scheduledFor || null
    };

    await redisClient.setEx(
      `notification:${job.id}`,
      86400, // 24 hours TTL
      JSON.stringify(notificationRecord)
    );

    res.status(201).json({
      message: 'Email notification queued successfully',
      notificationId: job.id,
      status: 'queued'
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send SMS notification
app.post('/api/notifications/sms', verifyToken, async (req, res) => {
  try {
    // Check if SMS is configured
    if (!twilioClient) {
      return res.status(501).json({ error: 'SMS service not configured' });
    }

    // Validate input
    const { error, value } = smsNotificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { to, template, data, priority, scheduledFor } = value;

    // Get template
    const smsTemplate = smsTemplates[template];
    if (!smsTemplate) {
      return res.status(400).json({ error: 'Invalid SMS template' });
    }

    // Compile template
    const body = compileTemplate(smsTemplate, data);

    // Add to queue
    const jobOptions = {
      priority: priority === 'critical' ? 1 : priority === 'high' ? 2 : priority === 'normal' ? 3 : 4,
      delay: scheduledFor ? new Date(scheduledFor).getTime() - Date.now() : 0,
      removeOnComplete: 50,
      removeOnFail: 20
    };

    const job = await smsQueue.add({
      to,
      body,
      priority,
      createdBy: req.user.userId
    }, jobOptions);

    // Store notification record in Redis
    const notificationRecord = {
      id: job.id,
      type: 'sms',
      to,
      template,
      body,
      priority,
      status: 'queued',
      createdBy: req.user.userId,
      createdAt: new Date(),
      scheduledFor: scheduledFor || null
    };

    await redisClient.setEx(
      `notification:${job.id}`,
      86400,
      JSON.stringify(notificationRecord)
    );

    res.status(201).json({
      message: 'SMS notification queued successfully',
      notificationId: job.id,
      status: 'queued'
    });

  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send bulk email
app.post('/api/notifications/email/bulk', verifyToken, async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    // Validate input
    const { error, value } = bulkEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { recipients, template, priority } = value;

    // Get template
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      return res.status(400).json({ error: 'Invalid template' });
    }

    const jobIds = [];

    // Create jobs for each recipient
    for (const recipient of recipients) {
      const subject = compileTemplate(emailTemplate.subject, recipient.data);
      const html = compileTemplate(emailTemplate.template, recipient.data);

      const jobOptions = {
        priority: priority === 'critical' ? 1 : priority === 'high' ? 2 : priority === 'normal' ? 3 : 4,
        removeOnComplete: 50,
        removeOnFail: 20
      };

      const job = await emailQueue.add({
        to: recipient.email,
        subject,
        html,
        priority,
        createdBy: req.user.userId,
        isBulk: true
      }, jobOptions);

      jobIds.push(job.id);
    }

    res.status(201).json({
      message: 'Bulk email notifications queued successfully',
      notificationIds: jobIds,
      totalRecipients: recipients.length,
      status: 'queued'
    });

  } catch (error) {
    console.error('Send bulk email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send custom email
app.post('/api/notifications/email/custom', verifyToken, async (req, res) => {
  try {
    // Check permissions for custom emails
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    // Validate input
    const { error, value } = customEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { to, subject, html, text, priority, scheduledFor } = value;

    // Add to queue
    const jobOptions = {
      priority: priority === 'critical' ? 1 : priority === 'high' ? 2 : priority === 'normal' ? 3 : 4,
      delay: scheduledFor ? new Date(scheduledFor).getTime() - Date.now() : 0,
      removeOnComplete: 50,
      removeOnFail: 20
    };

    const job = await emailQueue.add({
      to,
      subject,
      html,
      text,
      priority,
      createdBy: req.user.userId,
      isCustom: true
    }, jobOptions);

    res.status(201).json({
      message: 'Custom email notification queued successfully',
      notificationId: job.id,
      status: 'queued'
    });

  } catch (error) {
    console.error('Send custom email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notification status
app.get('/api/notifications/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get notification record
    const notificationData = await redisClient.get(`notification:${id}`);
    if (!notificationData) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = JSON.parse(notificationData);

    // Check if user can view this notification
    if (req.user.role !== 'admin' && notification.createdBy !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get delivery status
    const emailStatus = await redisClient.get(`email:${id}:status`);
    const smsStatus = await redisClient.get(`sms:${id}:status`);

    if (emailStatus) {
      notification.deliveryStatus = JSON.parse(emailStatus);
    } else if (smsStatus) {
      notification.deliveryStatus = JSON.parse(smsStatus);
    }

    res.json({ notification });

  } catch (error) {
    console.error('Get notification status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get queue statistics
app.get('/api/notifications/stats', verifyToken, async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    const [
      emailWaiting,
      emailActive,
      emailCompleted,
      emailFailed,
      smsWaiting,
      smsActive,
      smsCompleted,
      smsFailed
    ] = await Promise.all([
      emailQueue.getWaiting(),
      emailQueue.getActive(),
      emailQueue.getCompleted(),
      emailQueue.getFailed(),
      smsQueue.getWaiting(),
      smsQueue.getActive(),
      smsQueue.getCompleted(),
      smsQueue.getFailed()
    ]);

    const stats = {
      email: {
        waiting: emailWaiting.length,
        active: emailActive.length,
        completed: emailCompleted.length,
        failed: emailFailed.length
      },
      sms: {
        waiting: smsWaiting.length,
        active: smsActive.length,
        completed: smsCompleted.length,
        failed: smsFailed.length
      }
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available templates
app.get('/api/notifications/templates', verifyToken, async (req, res) => {
  try {
    const templates = {
      email: Object.keys(emailTemplates),
      sms: Object.keys(smsTemplates)
    };

    res.json({ templates });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Emergency broadcast (Admin only)
app.post('/api/notifications/emergency', verifyToken, async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { message, channels } = req.body;

    if (!message || !channels || !Array.isArray(channels)) {
      return res.status(400).json({ error: 'Message and channels array are required' });
    }

    const jobIds = [];

    // This is a simplified example - in real implementation, you would get user contact info from user service
    if (channels.includes('sms') && twilioClient) {
      const smsTemplate = smsTemplates.emergency_alert;
      const body = compileTemplate(smsTemplate, { message });

      // In real implementation, get all user phone numbers
      const phoneNumbers = []; // Would be populated from user database

      for (const phone of phoneNumbers) {
        const job = await smsQueue.add({
          to: phone,
          body,
          priority: 'critical',
          createdBy: req.user.userId,
          isEmergency: true
        }, { priority: 1 });

        jobIds.push(job.id);
      }
    }

    if (channels.includes('email')) {
      // In real implementation, get all user emails
      const emails = []; // Would be populated from user database

      for (const email of emails) {
        const job = await emailQueue.add({
          to: email,
          subject: 'CAMPUS EMERGENCY ALERT',
          html: `<h1 style="color: red;">EMERGENCY ALERT</h1><p>${message}</p>`,
          priority: 'critical',
          createdBy: req.user.userId,
          isEmergency: true
        }, { priority: 1 });

        jobIds.push(job.id);
      }
    }

    res.status(201).json({
      message: 'Emergency broadcast initiated',
      notificationIds: jobIds,
      channels,
      status: 'broadcasting'
    });

  } catch (error) {
    console.error('Emergency broadcast error:', error);
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

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await emailQueue.close();
  await smsQueue.close();
  await redisClient.quit();
  process.exit(0);
});

// Start server
app.listen(port, async () => {
  console.log(`Notification service running on port ${port}`);
  await initializeRedis();
});

module.exports = app;