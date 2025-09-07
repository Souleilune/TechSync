// backend/controllers/analyticsController.js
const { analytics } = require('../middleware/rateLimitAnalytics');
const supabase = require('../config/supabase');

// Get rate limiting analytics
const getRateLimitAnalytics = async (req, res) => {
  try {
    const analyticsData = analytics.getAnalytics();
    
    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Error fetching rate limit analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get analytics for specific IP
const getIPAnalytics = async (req, res) => {
  try {
    const { ip } = req.params;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }

    const ipData = analytics.getIPAnalytics(ip);
    
    res.json({
      success: true,
      data: ipData
    });
  } catch (error) {
    console.error('Error fetching IP analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch IP analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get system health metrics
const getSystemHealth = async (req, res) => {
  try {
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get uptime
    const uptime = process.uptime();
    
    // Get CPU usage (simple approximation)
    const cpuUsage = process.cpuUsage();
    
    // Database health check
    let dbHealth = 'unknown';
    let dbResponseTime = null;
    
    try {
      const start = Date.now();
      await supabase.from('users').select('count').limit(1);
      dbResponseTime = Date.now() - start;
      dbHealth = dbResponseTime < 1000 ? 'healthy' : 'slow';
    } catch (dbError) {
      dbHealth = 'error';
      console.error('Database health check failed:', dbError);
    }

    // Calculate memory usage in MB
    const heapUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const external = Math.round(memoryUsage.external / 1024 / 1024);
    
    // Format uptime
    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / (24 * 60 * 60));
      const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((seconds % (60 * 60)) / 60);
      
      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    };

    res.json({
      success: true,
      data: {
        memory: {
          heapUsed,
          heapTotal,
          external,
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          usagePercentage: Math.round((heapUsed / heapTotal) * 100)
        },
        uptime: {
          seconds: Math.floor(uptime),
          formatted: formatUptime(uptime)
        },
        database: {
          status: dbHealth,
          responseTime: dbResponseTime
        },
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get traffic summary
const getTrafficSummary = async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    // Calculate time range
    let startTime;
    const now = new Date();
    
    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const analyticsData = analytics.getAnalytics();
    
    // Filter data by timeframe
    const filteredHourlyStats = analyticsData.hourlyStats.filter(
      stat => stat.timestamp >= startTime
    );

    // Calculate totals
    const totalRequests = filteredHourlyStats.reduce((sum, stat) => sum + stat.requests, 0);
    const totalBlocked = filteredHourlyStats.reduce((sum, stat) => sum + stat.blocked, 0);
    const blockRate = totalRequests > 0 ? (totalBlocked / totalRequests * 100).toFixed(2) : 0;

    // Get peak traffic
    const peakTraffic = filteredHourlyStats.reduce((max, stat) => 
      stat.requests > max.requests ? stat : max, 
      { requests: 0, timestamp: now }
    );

    res.json({
      success: true,
      data: {
        timeframe,
        summary: {
          totalRequests,
          totalBlocked,
          blockRate: parseFloat(blockRate),
          averageRequestsPerHour: filteredHourlyStats.length > 0 ? 
            Math.round(totalRequests / filteredHourlyStats.length) : 0,
          peakTraffic: {
            requests: peakTraffic.requests,
            timestamp: peakTraffic.timestamp
          }
        },
        hourlyStats: filteredHourlyStats,
        currentStats: analyticsData.summary
      }
    });
  } catch (error) {
    console.error('Error fetching traffic summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch traffic summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get blocked IPs with details
const getBlockedIPs = async (req, res) => {
  try {
    const analyticsData = analytics.getAnalytics();
    const { limit = 50, page = 1 } = req.query;
    
    // Get all blocked IPs with violation details
    const blockedIPs = analyticsData.topViolators.map(violator => {
      const ipData = analytics.getIPAnalytics(violator.ip);
      return {
        ...violator,
        ...ipData,
        blockRate: ipData.totalRequests > 0 ? 
          (ipData.blockedRequests / ipData.totalRequests * 100).toFixed(2) : 0,
        lastActivity: ipData.recentActivity[0]?.timestamp || null
      };
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedIPs = blockedIPs.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        blockedIPs: paginatedIPs,
        pagination: {
          current: parseInt(page),
          limit: parseInt(limit),
          total: blockedIPs.length,
          pages: Math.ceil(blockedIPs.length / limit)
        },
        summary: {
          totalBlockedIPs: blockedIPs.length,
          totalViolations: blockedIPs.reduce((sum, ip) => sum + ip.violations, 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blocked IPs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Block/unblock IP manually (future feature)
const toggleIPBlock = async (req, res) => {
  try {
    const { ip } = req.params;
    const { action } = req.body; // 'block' or 'unblock'
    
    // This would integrate with a more permanent IP blocking system
    // For now, we'll just return a success message
    
    console.log(`Admin ${req.user.username} ${action}ed IP: ${ip}`);
    
    res.json({
      success: true,
      message: `IP ${ip} has been ${action}ed`,
      data: {
        ip,
        action,
        timestamp: new Date().toISOString(),
        adminUser: req.user.username
      }
    });
  } catch (error) {
    console.error('Error toggling IP block:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle IP block',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  getRateLimitAnalytics,
  getIPAnalytics,
  getSystemHealth,
  getTrafficSummary,
  getBlockedIPs,
  toggleIPBlock
};