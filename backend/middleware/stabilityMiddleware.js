// backend/middleware/stabilityMiddleware.js - Complete working solution

const rateLimit = require('express-rate-limit');

// Memory monitoring class
class MemoryMonitor {
  constructor() {
    this.maxMemoryPercent = 85; // 85% of heap
    this.isUnderPressure = false;
    this.lastCheck = Date.now();
    
    // Start monitoring
    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      this.isUnderPressure = heapUsedPercent > this.maxMemoryPercent;
      
      if (this.isUnderPressure) {
        console.warn(`⚠️  High memory usage: ${heapUsedPercent.toFixed(1)}%`);
        
        // Force garbage collection if available
        if (global.gc) {
          try {
            global.gc();
          } catch (error) {
            // Ignore GC errors
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  getStatus() {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      underPressure: this.isUnderPressure
    };
  }
}

const memoryMonitor = new MemoryMonitor();

// Enhanced rate limiter factory
const createStabilityRateLimit = (options) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    }
  };

  return rateLimit({
    ...defaultOptions,
    ...options,
    
    // Dynamic rate limiting based on system health
    max: (req) => {
      let maxRequests = options.max || 100;
      
      // Reduce limits during memory pressure
      if (memoryMonitor.isUnderPressure) {
        maxRequests = Math.floor(maxRequests * 0.5); // 50% reduction
      }
      
      // Higher limits for admin routes
      if (req.path.includes('/admin') || req.path.includes('/analytics')) {
        maxRequests = Math.max(maxRequests * 4, 200); // At least 200 for admin
      }
      
      return maxRequests;
    },
    
    // Enhanced error message
    message: (req) => ({
      success: false,
      message: options.message?.message || 'Too many requests, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000),
      systemStatus: memoryMonitor.isUnderPressure ? 'under_pressure' : 'healthy'
    }),
    
    // Skip rate limiting for health checks
    skip: (req) => {
      return req.path === '/health' || req.path === '/api/health';
    }
  });
};

// Different rate limiters for different routes
const rateLimiters = {
  // Strict for authentication (prevent brute force)
  auth: createStabilityRateLimit({
    max: 15, // 15 attempts per 15 minutes
    windowMs: 15 * 60 * 1000,
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again later.'
    }
  }),

  // Very generous for admin routes
  admin: createStabilityRateLimit({
    max: 200, // 200 requests per 15 minutes (generous for admin)
    windowMs: 15 * 60 * 1000,
    message: {
      success: false,
      message: 'Admin rate limit exceeded. Please wait a moment.'
    }
  }),

  // Moderate for regular API routes
  api: createStabilityRateLimit({
    max: 150, // Increased from your current 100
    windowMs: 15 * 60 * 1000,
    message: {
      success: false,
      message: 'Too many requests. Please try again later.'
    }
  }),

  // Generous for public routes
  public: createStabilityRateLimit({
    max: 250, // High limit for public endpoints
    windowMs: 15 * 60 * 1000,
    message: {
      success: false,
      message: 'Rate limit exceeded. Please try again shortly.'
    }
  })
};

// Request queue for high load management
class RequestQueue {
  constructor(maxConcurrent = 40) {
    this.maxConcurrent = maxConcurrent;
    this.activeRequests = 0;
    this.queue = [];
    this.isProcessing = false;
  }

  middleware() {
    return async (req, res, next) => {
      // Skip queueing for health checks and critical endpoints
      if (req.path === '/health' || 
          req.path === '/api/health' || 
          req.path.includes('/auth/logout')) {
        return next();
      }

      // If system is healthy and not overloaded, process immediately
      if (this.activeRequests < this.maxConcurrent && !memoryMonitor.isUnderPressure) {
        this.activeRequests++;
        
        const cleanup = () => {
          this.activeRequests--;
          this.processQueue();
        };

        res.on('finish', cleanup);
        res.on('close', cleanup);
        res.on('error', cleanup);
        
        return next();
      }

      // Queue the request
      const isAdminRequest = req.path.includes('/admin') || req.path.includes('/analytics');
      const requestItem = { req, res, next, isAdmin: isAdminRequest };

      if (isAdminRequest) {
        this.queue.unshift(requestItem); // Priority for admin
      } else {
        this.queue.push(requestItem);
      }

      // Set timeout for queued requests
      const timeout = setTimeout(() => {
        const index = this.queue.indexOf(requestItem);
        if (index > -1) {
          this.queue.splice(index, 1);
          res.status(503).json({
            success: false,
            message: 'Server is busy. Please try again later.',
            code: 'SERVER_BUSY'
          });
        }
      }, 10000); // 10 second timeout

      requestItem.timeout = timeout;
      this.processQueue();
    };
  }

  processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    if (this.activeRequests >= this.maxConcurrent || memoryMonitor.isUnderPressure) return;

    this.isProcessing = true;
    
    const requestItem = this.queue.shift();
    if (!requestItem) {
      this.isProcessing = false;
      return;
    }

    const { req, res, next, timeout } = requestItem;
    
    // Clear timeout
    if (timeout) clearTimeout(timeout);
    
    this.activeRequests++;
    
    const cleanup = () => {
      this.activeRequests--;
      this.isProcessing = false;
      setImmediate(() => this.processQueue());
    };

    res.on('finish', cleanup);
    res.on('close', cleanup);
    res.on('error', cleanup);
    
    next();
  }

  getStatus() {
    return {
      activeRequests: this.activeRequests,
      queueLength: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
}

const requestQueue = new RequestQueue(30); // Max 30 concurrent requests

// Enhanced error handler
const enhancedErrorHandler = (err, req, res, next) => {
  // Log error with context
  console.error('Request Error:', {
    path: req.path,
    method: req.method,
    error: err.message,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Handle specific error types
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'SERVER_ERROR';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError' || err.status === 401) {
    statusCode = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (err.status === 403) {
    statusCode = 403;
    message = 'Forbidden';
    code = 'FORBIDDEN';
  } else if (err.status === 404) {
    statusCode = 404;
    message = 'Not found';
    code = 'NOT_FOUND';
  } else if (err.status === 429) {
    statusCode = 429;
    message = 'Too many requests';
    code = 'RATE_LIMITED';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message || message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

// Health check with detailed system info
const healthCheck = (req, res) => {
  const memoryStatus = memoryMonitor.getStatus();
  const queueStatus = requestQueue.getStatus();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: memoryStatus,
    requests: queueStatus,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  };

  // Determine overall health
  if (memoryStatus.underPressure || queueStatus.queueLength > 10) {
    health.status = 'degraded';
  }

  if (queueStatus.queueLength > 20 || memoryStatus.percentage > 90) {
    health.status = 'critical';
  }

  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
};

module.exports = {
  rateLimiters,
  requestQueueMiddleware: requestQueue.middleware(),
  enhancedErrorHandler,
  healthCheck,
  memoryMonitor
};