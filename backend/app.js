// backend/app.js - COMPLETE UPDATED VERSION WITH STABILITY FEATURES
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Import stability middleware

const {
  rateLimiters,
  requestQueueMiddleware,
  enhancedErrorHandler,
  healthCheck
} = require('./middleware/stabilityMiddleware');

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
const soloProjectRoutes = require('./routes/soloProjectRoutes');
const analyticsRoutes = require('./routes/analytics');

// Import original error handler as fallback
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', true);

// Process crash prevention
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.log('🔄 Attempting graceful recovery...');
  // Don't exit immediately, try to recover
  setTimeout(() => {
    console.log('🚨 Forcing exit after recovery attempt');
    process.exit(1);
  }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Log but don't crash in production
  if (process.env.NODE_ENV !== 'production') {
    setTimeout(() => process.exit(1), 1000);
  }
});

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

// Enhanced health check endpoint (before any middleware)
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Request queue middleware for high load protection
app.use(requestQueueMiddleware);

// STABILITY IMPROVEMENT: Replace single rate limiter with targeted rate limiting

// Authentication routes - strict rate limiting (prevent brute force)
app.use('/api/auth/login', rateLimiters.auth);
app.use('/api/auth/register', rateLimiters.auth);

// Admin routes - very generous rate limiting (prevent admin lockout)
app.use('/api/admin', rateLimiters.admin);
app.use('/api/analytics', rateLimiters.admin);

// API routes - moderate rate limiting (good for demos)
app.use('/api/projects', rateLimiters.api);
app.use('/api/tasks', rateLimiters.api);
app.use('/api/chat', rateLimiters.api);
app.use('/api/comments', rateLimiters.api);
app.use('/api/notifications', rateLimiters.api);

// Public routes - generous rate limiting
app.use('/api/suggestions', rateLimiters.public);
app.use('/api/skill-matching', rateLimiters.public);
app.use('/api/onboarding', rateLimiters.public);

// Catch-all for any remaining routes
app.use('/api/', rateLimiters.api);

// Body parsing middleware with reasonable limits
app.use(express.json({ 
  limit: '5mb', // Reduced from 10mb for stability
  verify: (req, res, buf) => {
    // Basic size validation
    if (buf.length > 5 * 1024 * 1024) {
      throw new Error('Request payload too large');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Enhanced logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url} - ${req.ip}`);
    next();
  });
}

// Test database connection on startup
const supabase = require('./config/supabase');

// API Routes - Keep your exact order and structure

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

// Solo project routes and analytics
app.use('/api/solo-projects', soloProjectRoutes);
app.use('/api/analytics', analyticsRoutes);

// 2. Project-nested routes
app.use('/api/projects', taskRoutes);         
app.use('/api/projects', projectMemberRoutes); 

// 3. General project routes last
app.use('/api/projects', projectRoutes);

// Root endpoint with correct documentation
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Collaboration Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      projects: '/api/projects',
      'solo-projects': '/api/solo-projects',
      tasks: '/api/projects/:projectId/tasks',
      members: '/api/projects/:projectId/members',
      'aichat': '/api/ai-chat',
      challenges: '/api/challenges',
      github: '/api/github',
      analytics: '/api/analytics'
    },
    stability: {
      rateLimiting: 'adaptive',
      errorHandling: 'enhanced',
      memoryMonitoring: 'active'
    }
  });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/health',
      '/api/auth',
      '/api/projects', 
      '/api/admin',
      '/api/analytics'
    ]
  });
});

// Enhanced error handling middleware (must be last)
app.use(enhancedErrorHandler);

// Fallback to original error handler if needed
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO with enhanced configuration
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
  transports: ['websocket', 'polling'],
  
  // Connection limits for stability
  maxHttpBufferSize: 1e6, // 1MB max message size
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket connection monitoring
let activeSocketConnections = 0;
const MAX_SOCKET_CONNECTIONS = 100;

io.use((socket, next) => {
  if (activeSocketConnections >= MAX_SOCKET_CONNECTIONS) {
    return next(new Error('Server at capacity - too many connections'));
  }
  
  activeSocketConnections++;
  console.log(`📡 Socket connected. Active connections: ${activeSocketConnections}`);
  
  socket.on('disconnect', () => {
    activeSocketConnections--;
    console.log(`📡 Socket disconnected. Active connections: ${activeSocketConnections}`);
  });
  
  next();
});

// Setup socket handlers with error handling
try {
  const setupSocketHandlers = require('./utils/socketHandler');
  if (typeof setupSocketHandlers === 'function') {
    setupSocketHandlers(io);
    console.log('✅ Socket handlers initialized');
  } else {
    console.log('⚠️  Socket handler not found or not a function, skipping socket setup');
  }
} catch (error) {
  console.log('⚠️  Socket handler file not found, skipping socket setup:', error.message);
}

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} received. Shutting down gracefully...`);
  
  // Close server
  server.close(() => {
    console.log('✅ HTTP server closed.');
    
    // Close socket connections
    io.close(() => {
      console.log('✅ Socket.IO server closed.');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.log('⏰ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Log startup information
console.log('🚀 Server starting with stability features:');
console.log('   ✅ Adaptive rate limiting');
console.log('   ✅ Memory monitoring');
console.log('   ✅ Request queuing');
console.log('   ✅ Enhanced error handling');
console.log('   ✅ Graceful shutdown');

// Export both app and server for use in server.js or testing
module.exports = { app, server };