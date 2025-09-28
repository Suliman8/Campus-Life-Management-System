const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const moment = require('moment');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3007;

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

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_cafeteria';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Menu Item Schema
const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts', 'salads', 'sandwiches', 'pizza', 'other']
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  allergens: [{
    type: String,
    enum: ['nuts', 'dairy', 'eggs', 'fish', 'shellfish', 'soy', 'wheat', 'sesame']
  }],
  nutritionInfo: {
    calories: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 },
    fiber: { type: Number, min: 0 },
    sugar: { type: Number, min: 0 },
    sodium: { type: Number, min: 0 }
  },
  dietary: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'low-carb', 'halal', 'kosher']
  }],
  imageUrl: String,
  isAvailable: {
    type: Boolean,
    default: true
  },
  prepTime: {
    type: Number,
    min: 0,
    max: 120 // minutes
  },
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'hot', 'very-hot'],
    default: 'mild'
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Daily Menu Schema
const dailyMenuSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  breakfast: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    isSpecial: {
      type: Boolean,
      default: false
    },
    specialPrice: Number
  }],
  lunch: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    isSpecial: {
      type: Boolean,
      default: false
    },
    specialPrice: Number
  }],
  dinner: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    isSpecial: {
      type: Boolean,
      default: false
    },
    specialPrice: Number
  }],
  snacks: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    isSpecial: {
      type: Boolean,
      default: false
    },
    specialPrice: Number
  }],
  specialOffers: [{
    title: String,
    description: String,
    discount: Number,
    applicableItems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    }]
  }],
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Order Schema
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 20
    },
    price: {
      type: Number,
      required: true
    },
    specialInstructions: String
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  orderType: {
    type: String,
    enum: ['pickup', 'dine-in'],
    default: 'pickup'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  estimatedReadyTime: Date,
  actualReadyTime: Date,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
menuItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

dailyMenuSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isAvailable: 1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });
menuItemSchema.index({ dietary: 1 });
menuItemSchema.index({ allergens: 1 });

dailyMenuSchema.index({ date: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const DailyMenu = mongoose.model('DailyMenu', dailyMenuSchema);
const Order = mongoose.model('Order', orderSchema);

// Validation schemas
const menuItemValidationSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  description: Joi.string().max(500).optional(),
  category: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts', 'salads', 'sandwiches', 'pizza', 'other').required(),
  price: Joi.number().min(0).max(100).required(),
  ingredients: Joi.array().items(Joi.string().trim()).optional(),
  allergens: Joi.array().items(Joi.string().valid('nuts', 'dairy', 'eggs', 'fish', 'shellfish', 'soy', 'wheat', 'sesame')).optional(),
  nutritionInfo: Joi.object({
    calories: Joi.number().min(0).optional(),
    protein: Joi.number().min(0).optional(),
    carbs: Joi.number().min(0).optional(),
    fat: Joi.number().min(0).optional(),
    fiber: Joi.number().min(0).optional(),
    sugar: Joi.number().min(0).optional(),
    sodium: Joi.number().min(0).optional()
  }).optional(),
  dietary: Joi.array().items(Joi.string().valid('vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'low-carb', 'halal', 'kosher')).optional(),
  imageUrl: Joi.string().uri().optional(),
  isAvailable: Joi.boolean().default(true),
  prepTime: Joi.number().min(0).max(120).optional(),
  spiceLevel: Joi.string().valid('mild', 'medium', 'hot', 'very-hot').default('mild')
});

const orderValidationSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      menuItem: Joi.string().required(),
      quantity: Joi.number().integer().min(1).max(20).required(),
      specialInstructions: Joi.string().optional()
    })
  ).min(1).required(),
  orderType: Joi.string().valid('pickup', 'dine-in').default('pickup'),
  notes: Joi.string().optional()
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

// Generate order number
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp}${random}`;
}

// Routes
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'cafeteria-service',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Get all menu items with filtering
app.get('/api/cafeteria/menu-items', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.available !== undefined) {
      filter.isAvailable = req.query.available === 'true';
    }

    if (req.query.dietary) {
      const dietaryOptions = req.query.dietary.split(',');
      filter.dietary = { $in: dietaryOptions };
    }

    if (req.query.allergens) {
      const allergens = req.query.allergens.split(',');
      filter.allergens = { $nin: allergens }; // Exclude items with specified allergens
    }

    if (req.query.maxPrice) {
      filter.price = { $lte: parseFloat(req.query.maxPrice) };
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const items = await MenuItem.find(filter)
      .sort({ category: 1, name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await MenuItem.countDocuments(filter);

    res.json({
      menuItems: items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single menu item
app.get('/api/cafeteria/menu-items/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ menuItem: item });

  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create menu item (Admin/Staff only)
app.post('/api/cafeteria/menu-items', verifyToken, async (req, res) => {
  try {
    // Check if user has admin role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    // Validate input
    const { error, value } = menuItemValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const menuItem = new MenuItem({
      ...value,
      createdBy: req.user.userId
    });

    await menuItem.save();

    res.status(201).json({
      message: 'Menu item created successfully',
      menuItem
    });

  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update menu item
app.put('/api/cafeteria/menu-items/:id', verifyToken, async (req, res) => {
  try {
    // Check if user has admin role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Validate input
    const { error, value } = menuItemValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    Object.assign(item, value);
    await item.save();

    res.json({
      message: 'Menu item updated successfully',
      menuItem: item
    });

  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete menu item
app.delete('/api/cafeteria/menu-items/:id', verifyToken, async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const item = await MenuItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({
      message: 'Menu item deleted successfully'
    });

  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get daily menu
app.get('/api/cafeteria/daily-menu/:date?', async (req, res) => {
  try {
    const date = req.params.date ? moment(req.params.date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');

    const dailyMenu = await DailyMenu.findOne({
      date: new Date(date)
    }).populate('breakfast.item lunch.item dinner.item snacks.item specialOffers.applicableItems');

    if (!dailyMenu) {
      // Return empty menu structure if no menu found
      return res.json({
        date,
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
        specialOffers: []
      });
    }

    res.json({ dailyMenu });

  } catch (error) {
    console.error('Get daily menu error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create/Update daily menu
app.post('/api/cafeteria/daily-menu', verifyToken, async (req, res) => {
  try {
    // Check if user has admin role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    const { date, breakfast, lunch, dinner, snacks, specialOffers } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const menuDate = new Date(date);

    // Update or create daily menu
    const dailyMenu = await DailyMenu.findOneAndUpdate(
      { date: menuDate },
      {
        date: menuDate,
        breakfast: breakfast || [],
        lunch: lunch || [],
        dinner: dinner || [],
        snacks: snacks || [],
        specialOffers: specialOffers || [],
        createdBy: req.user.userId
      },
      { upsert: true, new: true }
    );

    await dailyMenu.populate('breakfast.item lunch.item dinner.item snacks.item specialOffers.applicableItems');

    res.status(201).json({
      message: 'Daily menu updated successfully',
      dailyMenu
    });

  } catch (error) {
    console.error('Create/Update daily menu error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Place order
app.post('/api/cafeteria/orders', verifyToken, async (req, res) => {
  try {
    // Validate input
    const { error, value } = orderValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { items, orderType, notes } = value;

    // Validate and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);

      if (!menuItem) {
        return res.status(404).json({ error: `Menu item ${item.menuItem} not found` });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({ error: `Menu item ${menuItem.name} is not available` });
      }

      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions || ''
      });
    }

    // Create order
    const order = new Order({
      orderNumber: generateOrderNumber(),
      customerId: req.user.userId,
      customerName: req.user.name || 'Unknown',
      customerEmail: req.user.email,
      items: orderItems,
      totalAmount: totalAmount.toFixed(2),
      orderType,
      notes,
      estimatedReadyTime: new Date(Date.now() + 20 * 60000) // 20 minutes from now
    });

    await order.save();

    await order.populate('items.menuItem');

    res.status(201).json({
      message: 'Order placed successfully',
      order
    });

  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's orders
app.get('/api/cafeteria/orders/my', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customerId: req.user.userId })
      .populate('items.menuItem')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ customerId: req.user.userId });

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all orders (Admin/Staff only)
app.get('/api/cafeteria/orders', verifyToken, async (req, res) => {
  try {
    // Check if user has admin or faculty role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.date) {
      const startDate = moment(req.query.date).startOf('day').toDate();
      const endDate = moment(req.query.date).endOf('day').toDate();
      filter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const orders = await Order.find(filter)
      .populate('items.menuItem')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
app.put('/api/cafeteria/orders/:id/status', verifyToken, async (req, res) => {
  try {
    // Check if user has admin or faculty role
    if (!['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or faculty role required.' });
    }

    const { status } = req.body;

    if (!['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;

    if (status === 'ready' && !order.actualReadyTime) {
      order.actualReadyTime = new Date();
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get categories
app.get('/api/cafeteria/categories', (req, res) => {
  const categories = ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts', 'salads', 'sandwiches', 'pizza', 'other'];
  res.json({ categories });
});

// Get dietary options
app.get('/api/cafeteria/dietary-options', (req, res) => {
  const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'low-carb', 'halal', 'kosher'];
  res.json({ dietaryOptions });
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
  console.log(`Cafeteria service running on port ${port}`);
});

module.exports = app;