const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const multer = require('multer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3006;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // limit each IP to 200 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// Auth service URL
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_events';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Event Schema
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: ['academic', 'social', 'sports', 'cultural', 'career', 'workshop', 'seminar', 'other']
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true,
    maxlength: 200
  },
  organizer: {
    userId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  maxAttendees: {
    type: Number,
    min: 1,
    max: 10000
  },
  currentAttendees: {
    type: Number,
    default: 0
  },
  attendees: [{
    userId: String,
    name: String,
    email: String,
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  imageUrl: String,
  isPublic: {
    type: Boolean,
    default: true
  },
  requiresRegistration: {
    type: Boolean,
    default: true
  },
  registrationDeadline: Date,
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  cost: {
    type: Number,
    min: 0,
    default: 0
  },
  contactInfo: {
    email: String,
    phone: String
  },
  externalUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better performance
eventSchema.index({ startDateTime: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ 'organizer.userId': 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ title: 'text', description: 'text' });

const Event = mongoose.model('Event', eventSchema);

// Validation schemas
const eventValidationSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().max(2000).required(),
  category: Joi.string().valid('academic', 'social', 'sports', 'cultural', 'career', 'workshop', 'seminar', 'other').required(),
  startDateTime: Joi.date().required(),
  endDateTime: Joi.date().greater(Joi.ref('startDateTime')).required(),
  location: Joi.string().max(200).required(),
  maxAttendees: Joi.number().integer().min(1).max(10000).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  imageUrl: Joi.string().uri().optional(),
  isPublic: Joi.boolean().default(true),
  requiresRegistration: Joi.boolean().default(true),
  registrationDeadline: Joi.date().optional(),
  cost: Joi.number().min(0).default(0),
  contactInfo: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional()
  }).optional(),
  externalUrl: Joi.string().uri().optional()
});

const updateEventSchema = Joi.object({
  title: Joi.string().trim().max(200),
  description: Joi.string().max(2000),
  category: Joi.string().valid('academic', 'social', 'sports', 'cultural', 'career', 'workshop', 'seminar', 'other'),
  startDateTime: Joi.date(),
  endDateTime: Joi.date(),
  location: Joi.string().max(200),
  maxAttendees: Joi.number().integer().min(1).max(10000),
  tags: Joi.array().items(Joi.string().trim()),
  imageUrl: Joi.string().uri(),
  isPublic: Joi.boolean(),
  requiresRegistration: Joi.boolean(),
  registrationDeadline: Joi.date(),
  cost: Joi.number().min(0),
  contactInfo: Joi.object({
    email: Joi.string().email(),
    phone: Joi.string()
  }),
  externalUrl: Joi.string().uri(),
  status: Joi.string().valid('draft', 'published', 'cancelled', 'completed')
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

// Routes
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'events-service',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Get all events with filtering and pagination
app.get('/api/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    let filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    } else {
      // By default, only show published events for non-authenticated users
      filter.status = 'published';
    }

    if (req.query.startDate || req.query.endDate) {
      filter.startDateTime = {};
      if (req.query.startDate) {
        filter.startDateTime.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.startDateTime.$lte = new Date(req.query.endDate);
      }
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      filter.tags = { $in: tags };
    }

    // Only show public events unless user is authenticated
    if (!req.header('Authorization')) {
      filter.isPublic = true;
    }

    const events = await Event.find(filter)
      .sort({ startDateTime: 1 })
      .skip(skip)
      .limit(limit)
      .select('-attendees'); // Don't include attendee details in list view

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single event by ID
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user can view private events
    if (!event.isPublic && !req.header('Authorization')) {
      return res.status(403).json({ error: 'This event is private' });
    }

    // Don't include sensitive attendee information unless user is organizer or admin
    let eventData = event.toObject();
    const token = req.header('Authorization');

    if (token) {
      try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, {}, {
          headers: { Authorization: token }
        });
        const user = response.data.user;

        // Only show attendee details to organizer or admin
        if (user.role !== 'admin' && event.organizer.userId !== user.userId) {
          eventData.attendees = eventData.attendees.map(attendee => ({
            registeredAt: attendee.registeredAt,
            status: attendee.status
          }));
        }
      } catch (authError) {
        // Remove attendee details for unauthenticated users
        eventData.attendees = [];
      }
    } else {
      eventData.attendees = [];
    }

    res.json({ event: eventData });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new event
app.post('/api/events', verifyToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = eventValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Create event with organizer information
    const eventData = {
      ...value,
      organizer: {
        userId: req.user.userId,
        name: req.user.name || 'Unknown',
        email: req.user.email
      }
    };

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update event
app.put('/api/events/:id', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user can update this event
    if (req.user.role !== 'admin' && event.organizer.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied. You can only update your own events.' });
    }

    // Validate input
    const { error, value } = updateEventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if endDateTime is after startDateTime
    if (value.endDateTime && value.startDateTime && value.endDateTime <= value.startDateTime) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    Object.assign(event, value);
    await event.save();

    res.json({
      message: 'Event updated successfully',
      event
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete event
app.delete('/api/events/:id', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user can delete this event
    if (req.user.role !== 'admin' && event.organizer.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own events.' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register for event
app.post('/api/events/:id/register', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event is published
    if (event.status !== 'published') {
      return res.status(400).json({ error: 'Cannot register for unpublished events' });
    }

    // Check if registration is required
    if (!event.requiresRegistration) {
      return res.status(400).json({ error: 'This event does not require registration' });
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    // Check if already registered
    const existingRegistration = event.attendees.find(
      attendee => attendee.userId === req.user.userId
    );

    if (existingRegistration) {
      if (existingRegistration.status === 'cancelled') {
        // Reactivate registration
        existingRegistration.status = 'registered';
        existingRegistration.registeredAt = new Date();
        event.currentAttendees += 1;
      } else {
        return res.status(400).json({ error: 'Already registered for this event' });
      }
    } else {
      // Check capacity
      if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
        return res.status(400).json({ error: 'Event is at maximum capacity' });
      }

      // Add new registration
      event.attendees.push({
        userId: req.user.userId,
        name: req.user.name || 'Unknown',
        email: req.user.email,
        status: 'registered'
      });
      event.currentAttendees += 1;
    }

    await event.save();

    res.status(201).json({
      message: 'Successfully registered for event',
      registration: {
        eventId: event._id,
        eventTitle: event.title,
        userId: req.user.userId,
        status: 'registered'
      }
    });

  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel registration
app.delete('/api/events/:id/register', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const registration = event.attendees.find(
      attendee => attendee.userId === req.user.userId
    );

    if (!registration || registration.status === 'cancelled') {
      return res.status(404).json({ error: 'Registration not found' });
    }

    registration.status = 'cancelled';
    event.currentAttendees = Math.max(0, event.currentAttendees - 1);

    await event.save();

    res.json({
      message: 'Registration cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's registered events
app.get('/api/events/my/registrations', verifyToken, async (req, res) => {
  try {
    const events = await Event.find({
      'attendees.userId': req.user.userId,
      'attendees.status': { $ne: 'cancelled' }
    }).select('title description startDateTime endDateTime location status currentAttendees maxAttendees');

    const registrations = events.map(event => {
      const registration = event.attendees.find(
        attendee => attendee.userId === req.user.userId
      );
      return {
        event: {
          id: event._id,
          title: event.title,
          description: event.description,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
          location: event.location,
          status: event.status,
          currentAttendees: event.currentAttendees,
          maxAttendees: event.maxAttendees
        },
        registrationStatus: registration.status,
        registeredAt: registration.registeredAt
      };
    });

    res.json({ registrations });

  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get events organized by user
app.get('/api/events/my/organized', verifyToken, async (req, res) => {
  try {
    const events = await Event.find({
      'organizer.userId': req.user.userId
    }).sort({ createdAt: -1 });

    res.json({ events });

  } catch (error) {
    console.error('Get organized events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event categories
app.get('/api/events/categories', (req, res) => {
  const categories = ['academic', 'social', 'sports', 'cultural', 'career', 'workshop', 'seminar', 'other'];
  res.json({ categories });
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
app.listen(port, () => {
  console.log(`Events service running on port ${port}`);
});

module.exports = app;