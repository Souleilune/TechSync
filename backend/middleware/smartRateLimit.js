// backend/middleware/smartRateLimit.js - EMERGENCY FIX

const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Smart rate limiter that exempts admins and adjusts limits
const createSmartLimiter = (options) => {
  return rateLimit({
    ...options,
    skip: (req) => {
      try {
        // Extract token from request
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return false; // Apply rate limit to non-authenticated requests
        }

        const token = authHeader.substring(7);
        if (!token) return false;

        // Verify and decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // SKIP rate limiting for admins and moderators
        if (decoded.role === 'admin' || decoded.role === 'moderator') {
          return true; // Skip rate limiting
        }

        return false; // Apply rate limiting to regular users
      } catch (error) {
        // If token verification fails, apply rate limiting
        return false;
      }
    },
    message: {
      success: false,
      message: 'Too many requests. Please wait before trying again.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    }
  });
};

// Different rate limiters for different needs
const rateLimiters = {
  // Very loose for admin endpoints - admins need unrestricted access
  admin: createSmartLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests (very high for admins)
    message: {
      success: false,
      message: 'Admin rate limit exceeded. Please contact system administrator.'
    }
  }),

  // Moderate for authenticated API calls
  api: createSmartLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests (increased from 100)
  }),

  // Strict only for auth endpoints (prevent brute force)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts
    message: {
      success: false,
      message: 'Too many login attempts. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Public endpoints (very loose)
  public: createSmartLimiter({
    windowMs: 15 * 60 * 1000,
    max: 500, // High limit for public access
  })
};

module.exports = { rateLimiters, createSmartLimiter };