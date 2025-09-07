// backend/routes/analytics.js
const express = require('express');
const router = express.Router();
const { param, query, body, validationResult } = require('express-validator');

// Import controllers and middleware
const {
  getRateLimitAnalytics,
  getIPAnalytics,
  getSystemHealth,
  getTrafficSummary,
  getBlockedIPs,
  toggleIPBlock
} = require('../controllers/analyticsController');

const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// All analytics routes require admin authentication
router.use(authMiddleware);
router.use(requireAdmin);

// GET /api/analytics/rate-limits - Get rate limiting analytics
router.get('/rate-limits', getRateLimitAnalytics);

// GET /api/analytics/system-health - Get system health metrics
router.get('/system-health', getSystemHealth);

// GET /api/analytics/traffic-summary?timeframe=24h - Get traffic summary
router.get('/traffic-summary', [
  query('timeframe')
    .optional()
    .isIn(['1h', '6h', '24h', '7d'])
    .withMessage('Timeframe must be one of: 1h, 6h, 24h, 7d')
], handleValidationErrors, getTrafficSummary);

// GET /api/analytics/blocked-ips?page=1&limit=50 - Get blocked IPs
router.get('/blocked-ips', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], handleValidationErrors, getBlockedIPs);

// GET /api/analytics/ip/:ip - Get analytics for specific IP
router.get('/ip/:ip', [
  param('ip')
    .isIP()
    .withMessage('Invalid IP address format')
], handleValidationErrors, getIPAnalytics);

// PUT /api/analytics/ip/:ip/toggle-block - Block/unblock IP (future feature)
router.put('/ip/:ip/toggle-block', [
  param('ip')
    .isIP()
    .withMessage('Invalid IP address format'),
  body('action')
    .isIn(['block', 'unblock'])
    .withMessage('Action must be either "block" or "unblock"'),
  body('reason')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason must be between 1 and 500 characters')
], handleValidationErrors, toggleIPBlock);

module.exports = router;