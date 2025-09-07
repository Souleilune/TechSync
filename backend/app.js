// backend/app.js - FINAL FIXED VERSION WITH SOLO PROJECT ROUTES
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const onboardingRoutes = require('./routes/onboarding');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const suggestionsRoutes = require('./routes/suggestions');
const skillMatchingRoutes = require('./routes/skillMatching'); 
const challengeRoutes = require('./routes/challenges');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const aiChatRoutes = require('./routes/aiChat');
const projectMemberRoutes = require('./routes/projectMembers');
const commentsRoutes = require('./routes/comments');
const notificationsRoutes = require('./routes/notifications');
const githubRoutes = require('./routes/github');
const friendsRoutes = require('./routes/friends');

// ✅ NEW: Import solo project routes
const soloProjectRoutes = require('./routes/soloProjectRoutes');

const analyticsRoutes = require('./routes/analytics');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cache-Control', 
    'Pragma', 
    'Expires',
    'Access-Control-Allow-Origin',
    'X-Requested-With',
    'Accept'
  ],
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Additional CORS headers for stubborn browsers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Add no-cache headers for API routes
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
  });
}

// Test database connection on startup
const supabase = require('./config/supabase');

// API Routes - FIXED: Correct mounting order and paths

// 1. Independent routes first
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/skill-matching', skillMatchingRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/friends', friendsRoutes);

// ✅ NEW: Solo project routes (add this line)
app.use('/api/solo-projects', soloProjectRoutes);
app.use('/api/analytics', analyticsRoutes);

// 2. Project-nested routes - FIXED: Mount under /api/projects
// These routes handle: /api/projects/:projectId/tasks/* and /api/projects/:projectId/members/*
app.use('/api/projects', taskRoutes);         // ✅ Now handles /api/projects/:projectId/tasks
app.use('/api/projects', projectMemberRoutes); // ✅ Now handles /api/projects/:projectId/members

// 3. General project routes last - handles remaining /api/projects/*
app.use('/api/projects', projectRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint with correct documentation
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Collaboration Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      projects: '/api/projects',
      'solo-projects': '/api/solo-projects',        // ✅ NEW: Added to documentation
      tasks: '/api/projects/:projectId/tasks',     // ✅ Correct path
      members: '/api/projects/:projectId/members', // ✅ Correct path
      'aichat': '/api/ai-chat',
      challenges: '/api/challenges',
      github: '/api/github'
    }
  });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Setup socket handlers - FIXED: Check if socketHandler exists and has setupSocketHandlers
try {
  const setupSocketHandlers = require('./utils/socketHandler');
  if (typeof setupSocketHandlers === 'function') {
    setupSocketHandlers(io);
  } else {
    console.log('⚠️  Socket handler not found or not a function, skipping socket setup');
  }
} catch (error) {
  console.log('⚠️  Socket handler file not found, skipping socket setup:', error.message);
}

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Export both app and server for use in server.js or testing
module.exports = { app, server };