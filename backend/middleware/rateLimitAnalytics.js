// backend/middleware/rateLimitAnalytics.js
const rateLimit = require('express-rate-limit');

// In-memory analytics store (in production, use Redis or database)
class RateLimitAnalytics {
  constructor() {
    this.requests = new Map(); // IP -> request count
    this.violations = new Map(); // IP -> violation count
    this.endpoints = new Map(); // endpoint -> stats
    this.hourlyStats = []; // Last 24 hours of data
    this.realTimeStats = {
      currentRequests: 0,
      blockedRequests: 0,
      topIPs: new Map(),
      topEndpoints: new Map()
    };
    
    // Clean up old data every hour
    setInterval(() => this.cleanupOldData(), 60 * 60 * 1000);
    // Update hourly stats every minute for demo purposes (change to hour in production)
    setInterval(() => this.updateHourlyStats(), 60 * 1000);
  }

  logRequest(ip, endpoint, blocked = false, userAgent = '', method = 'GET') {
    const timestamp = new Date();
    const key = `${ip}-${Date.now()}`;
    
    // Log individual request
    this.requests.set(key, {
      ip,
      endpoint,
      blocked,
      userAgent,
      method,
      timestamp
    });

    // Update real-time stats
    this.realTimeStats.currentRequests++;
    if (blocked) {
      this.realTimeStats.blockedRequests++;
      
      // Track violations per IP
      const violationCount = this.violations.get(ip) || 0;
      this.violations.set(ip, violationCount + 1);
    }

    // Update top IPs
    const ipCount = this.realTimeStats.topIPs.get(ip) || 0;
    this.realTimeStats.topIPs.set(ip, ipCount + 1);

    // Update top endpoints
    const endpointCount = this.realTimeStats.topEndpoints.get(endpoint) || 0;
    this.realTimeStats.topEndpoints.set(endpoint, endpointCount + 1);

    // Update endpoint stats
    if (!this.endpoints.has(endpoint)) {
      this.endpoints.set(endpoint, {
        total: 0,
        blocked: 0,
        lastAccess: timestamp
      });
    }
    
    const endpointStats = this.endpoints.get(endpoint);
    endpointStats.total++;
    if (blocked) endpointStats.blocked++;
    endpointStats.lastAccess = timestamp;
  }

  updateHourlyStats() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Count requests in the last hour
    let hourlyRequests = 0;
    let hourlyBlocked = 0;
    
    for (const [key, request] of this.requests) {
      if (request.timestamp >= hourAgo) {
        hourlyRequests++;
        if (request.blocked) hourlyBlocked++;
      }
    }

    // Add to hourly stats
    this.hourlyStats.push({
      timestamp: now,
      requests: hourlyRequests,
      blocked: hourlyBlocked,
      activeIPs: new Set(Array.from(this.requests.values())
        .filter(r => r.timestamp >= hourAgo)
        .map(r => r.ip)).size
    });

    // Keep only last 24 hours
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.hourlyStats = this.hourlyStats.filter(stat => stat.timestamp >= dayAgo);
  }

  cleanupOldData() {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Clean old requests
    for (const [key, request] of this.requests) {
      if (request.timestamp < hourAgo) {
        this.requests.delete(key);
      }
    }

    // Reset real-time counters
    this.realTimeStats.currentRequests = 0;
    this.realTimeStats.blockedRequests = 0;
    this.realTimeStats.topIPs.clear();
    this.realTimeStats.topEndpoints.clear();
  }

  getAnalytics() {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get recent requests
    const recentRequests = Array.from(this.requests.values())
      .filter(r => r.timestamp >= hourAgo)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);

    // Calculate metrics
    const totalRequests = recentRequests.length;
    const blockedRequests = recentRequests.filter(r => r.blocked).length;
    const blockRate = totalRequests > 0 ? (blockedRequests / totalRequests * 100).toFixed(2) : 0;

    // Top violating IPs
    const topViolators = Array.from(this.violations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, violations: count }));

    // Top endpoints by traffic
    const endpointStats = Array.from(this.endpoints.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        ...stats,
        blockRate: stats.total > 0 ? (stats.blocked / stats.total * 100).toFixed(2) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Active IPs in last hour
    const activeIPs = new Set(recentRequests.map(r => r.ip)).size;

    return {
      summary: {
        totalRequests,
        blockedRequests,
        blockRate: parseFloat(blockRate),
        activeIPs,
        totalViolations: Array.from(this.violations.values()).reduce((sum, count) => sum + count, 0)
      },
      recentRequests: recentRequests.slice(0, 20), // Last 20 requests
      topViolators,
      endpointStats,
      hourlyStats: this.hourlyStats,
      realTimeStats: {
        ...this.realTimeStats,
        topIPs: Array.from(this.realTimeStats.topIPs.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
        topEndpoints: Array.from(this.realTimeStats.topEndpoints.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      }
    };
  }

  // Get specific IP analytics
  getIPAnalytics(ip) {
    const requests = Array.from(this.requests.values())
      .filter(r => r.ip === ip)
      .sort((a, b) => b.timestamp - a.timestamp);

    return {
      ip,
      totalRequests: requests.length,
      blockedRequests: requests.filter(r => r.blocked).length,
      violations: this.violations.get(ip) || 0,
      endpoints: [...new Set(requests.map(r => r.endpoint))],
      recentActivity: requests.slice(0, 50)
    };
  }
}

// Global analytics instance
const analytics = new RateLimitAnalytics();

// Enhanced rate limiter with analytics
const createAnalyticsLimiter = (options, name = 'default') => {
  return rateLimit({
    ...options,
    handler: (req, res) => {
      // Log the blocked request
      analytics.logRequest(
        req.ip,
        req.originalUrl,
        true, // blocked = true
        req.get('User-Agent') || '',
        req.method
      );

      console.log(`🚫 Rate limit exceeded: ${req.ip} tried to access ${req.originalUrl}`);
      
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.round(options.windowMs / 1000),
        type: 'rate_limit_exceeded',
        limit: options.max,
        windowMs: options.windowMs
      });
    },
    skip: (req) => {
      // Log all requests (not blocked)
      analytics.logRequest(
        req.ip,
        req.originalUrl,
        false, // blocked = false
        req.get('User-Agent') || '',
        req.method
      );
      return false; // Don't skip any requests
    }
  });
};

// Different rate limiters for different endpoints
const limiters = {
  // Very strict for authentication
  auth: createAnalyticsLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }, 'auth'),

  // Strict for registration  
  register: createAnalyticsLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour
    message: 'Too many registration attempts. Please try again later.',
  }, 'register'),

  // Moderate for API endpoints
  api: createAnalyticsLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many API requests. Please try again later.',
  }, 'api'),

  // Relaxed for public endpoints
  public: createAnalyticsLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: 'Too many requests. Please try again later.',
  }, 'public'),

  // Very strict for admin endpoints
  admin: createAnalyticsLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per window
    message: 'Too many admin requests. Please try again later.',
  }, 'admin')
};

module.exports = {
  analytics,
  limiters,
  createAnalyticsLimiter
};