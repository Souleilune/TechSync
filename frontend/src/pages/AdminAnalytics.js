// frontend/src/pages/AdminAnalytics.js
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Clock, 
  Server,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

const AdminAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [trafficSummary, setTrafficSummary] = useState(null);
  const [blockedIPs, setBlockedIPs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [error, setError] = useState(null);

  // Fetch all analytics data - memoized with useCallback
  const fetchAnalyticsData = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [analyticsRes, healthRes, trafficRes, blockedRes] = await Promise.all([
        fetch('/api/analytics/rate-limits', { headers }),
        fetch('/api/analytics/system-health', { headers }),
        fetch(`/api/analytics/traffic-summary?timeframe=${selectedTimeframe}`, { headers }),
        fetch('/api/analytics/blocked-ips?limit=20', { headers })
      ]);

      // Check if any request failed
      if (!analyticsRes.ok || !healthRes.ok || !trafficRes.ok || !blockedRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [analytics, health, traffic, blocked] = await Promise.all([
        analyticsRes.json(),
        healthRes.json(),
        trafficRes.json(),
        blockedRes.json()
      ]);

      if (analytics.success) setAnalyticsData(analytics.data);
      if (health.success) setSystemHealth(health.data);
      if (traffic.success) setTrafficSummary(traffic.data);
      if (blocked.success) setBlockedIPs(blocked.data);

      setError(null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTimeframe]); // Include selectedTimeframe as dependency

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalyticsData]); // Now fetchAnalyticsData is properly memoized

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'slow': return '#eab308';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Your existing admin dashboard styles - keeping consistent with your design
  const styles = {
    container: {
      padding: '30px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    },
    header: {
      marginBottom: '30px'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6c757d',
      marginBottom: '20px'
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginBottom: '30px'
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'white'
    },
    button: {
      padding: '8px 16px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    tabs: {
      display: 'flex',
      borderBottom: '2px solid #e9ecef',
      marginBottom: '30px'
    },
    tab: {
      padding: '12px 24px',
      cursor: 'pointer',
      border: 'none',
      backgroundColor: 'transparent',
      fontSize: '14px',
      fontWeight: '500',
      color: '#6c757d',
      borderBottom: '2px solid transparent',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    tabActive: {
      color: '#007bff',
      borderBottom: '2px solid #007bff'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#333',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    metric: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    metricValue: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#333'
    },
    metricLabel: {
      fontSize: '14px',
      color: '#6c757d',
      marginBottom: '8px'
    },
    metricIcon: {
      marginLeft: '16px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '16px'
    },
    th: {
      padding: '12px',
      textAlign: 'left',
      borderBottom: '2px solid #e9ecef',
      fontSize: '14px',
      fontWeight: '600',
      color: '#495057'
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #e9ecef',
      fontSize: '14px'
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    badgeRed: {
      backgroundColor: '#fecaca',
      color: '#dc2626'
    },
    badgeGreen: {
      backgroundColor: '#bbf7d0',
      color: '#16a34a'
    },
    badgeYellow: {
      backgroundColor: '#fef3c7',
      color: '#d97706'
    },
    loading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      flexDirection: 'column',
      gap: '16px'
    },
    error: {
      padding: '20px',
      backgroundColor: '#fee2e2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      color: '#dc2626',
      textAlign: 'center',
      marginBottom: '20px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p>Loading security analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <Shield size={40} color="#007bff" />
          Security Analytics Dashboard
        </h1>
        <p style={styles.subtitle}>
          Monitor rate limiting, traffic patterns, and system security in real-time
        </p>
        
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <div style={styles.controls}>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            style={styles.select}
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              ...styles.button,
              ...(refreshing ? styles.buttonDisabled : {})
            }}
          >
            <RefreshCw size={16} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabs}>
        {[
          { id: 'overview', name: 'Overview', icon: Activity },
          { id: 'traffic', name: 'Traffic', icon: TrendingUp },
          { id: 'security', name: 'Security', icon: Shield },
          { id: 'system', name: 'System Health', icon: Server }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            style={{
              ...styles.tab,
              ...(selectedTab === tab.id ? styles.tabActive : {})
            }}
          >
            <tab.icon size={16} />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && analyticsData && (
        <div>
          {/* Key Metrics */}
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Total Requests</div>
                  <div style={styles.metricValue}>
                    {formatNumber(analyticsData.summary.totalRequests)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>Last hour</div>
                </div>
                <Activity size={40} color="#007bff" style={styles.metricIcon} />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Blocked Requests</div>
                  <div style={{ ...styles.metricValue, color: '#dc3545' }}>
                    {formatNumber(analyticsData.summary.blockedRequests)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {analyticsData.summary.blockRate}% block rate
                  </div>
                </div>
                <Ban size={40} color="#dc3545" style={styles.metricIcon} />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Active IPs</div>
                  <div style={{ ...styles.metricValue, color: '#28a745' }}>
                    {analyticsData.summary.activeIPs}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>Unique visitors</div>
                </div>
                <Users size={40} color="#28a745" style={styles.metricIcon} />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Security Violations</div>
                  <div style={{ ...styles.metricValue, color: '#fd7e14' }}>
                    {analyticsData.summary.totalViolations}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>Rate limit violations</div>
                </div>
                <AlertTriangle size={40} color="#fd7e14" style={styles.metricIcon} />
              </div>
            </div>
          </div>

          {/* Recent Activity and Top Violators */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Recent Requests */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <Clock size={20} />
                  Recent Requests
                </h3>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {analyticsData.recentRequests?.length > 0 ? (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>IP</th>
                        <th style={styles.th}>Method</th>
                        <th style={styles.th}>Endpoint</th>
                        <th style={styles.th}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.recentRequests.slice(0, 10).map((request, index) => (
                        <tr key={index}>
                          <td style={styles.td}>
                            {request.blocked ? (
                              <XCircle size={16} color="#dc3545" />
                            ) : (
                              <CheckCircle size={16} color="#28a745" />
                            )}
                          </td>
                          <td style={styles.td}>
                            <code style={{ fontSize: '12px' }}>{request.ip}</code>
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badge,
                              ...(request.method === 'POST' ? styles.badgeYellow : styles.badgeGreen)
                            }}>
                              {request.method}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {request.endpoint}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <small>{new Date(request.timestamp).toLocaleTimeString()}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
                    No recent requests
                  </p>
                )}
              </div>
            </div>

            {/* Top Violators */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>
                  <AlertTriangle size={20} />
                  Top Violators
                </h3>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {analyticsData.topViolators?.length > 0 ? (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Rank</th>
                        <th style={styles.th}>IP Address</th>
                        <th style={styles.th}>Violations</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topViolators.slice(0, 8).map((violator, index) => (
                        <tr key={violator.ip}>
                          <td style={styles.td}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {index + 1}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <code style={{ fontSize: '12px' }}>{violator.ip}</code>
                          </td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, ...styles.badgeRed }}>
                              {violator.violations}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <button
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#007bff',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                              onClick={() => setSelectedTab('security')}
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
                    No security violations detected
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Traffic Tab */}
      {selectedTab === 'traffic' && trafficSummary && (
        <div>
          {/* Traffic Summary */}
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Total Requests</div>
                  <div style={styles.metricValue}>
                    {formatNumber(trafficSummary.summary.totalRequests)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>{selectedTimeframe}</div>
                </div>
                <TrendingUp size={40} color="#007bff" style={styles.metricIcon} />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Avg/Hour</div>
                  <div style={{ ...styles.metricValue, color: '#28a745' }}>
                    {trafficSummary.summary.averageRequestsPerHour}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>Requests per hour</div>
                </div>
                <Clock size={40} color="#28a745" style={styles.metricIcon} />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Peak Traffic</div>
                  <div style={{ ...styles.metricValue, color: '#fd7e14' }}>
                    {trafficSummary.summary.peakTraffic.requests}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {new Date(trafficSummary.summary.peakTraffic.timestamp).toLocaleString()}
                  </div>
                </div>
                <AlertTriangle size={40} color="#fd7e14" style={styles.metricIcon} />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Block Rate</div>
                  <div style={{ ...styles.metricValue, color: '#dc3545' }}>
                    {trafficSummary.summary.blockRate}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>of total requests</div>
                </div>
                <Ban size={40} color="#dc3545" style={styles.metricIcon} />
              </div>
            </div>
          </div>

          {/* Traffic Chart */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Traffic Over Time</h3>
            </div>
            <div style={{ padding: '20px' }}>
              {trafficSummary.hourlyStats?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {trafficSummary.hourlyStats.slice(-12).map((stat, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '80px', fontSize: '12px', color: '#6c757d' }}>
                        {new Date(stat.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, backgroundColor: '#e9ecef', borderRadius: '4px', height: '8px' }}>
                            <div 
                              style={{ 
                                backgroundColor: '#007bff', 
                                height: '8px', 
                                borderRadius: '4px',
                                width: `${Math.min((stat.requests / trafficSummary.summary.peakTraffic.requests) * 100, 100)}%`
                              }}
                            ></div>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '500', minWidth: '60px', textAlign: 'right' }}>
                            {stat.requests}
                          </span>
                        </div>
                        {stat.blocked > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <div style={{ flex: 1, backgroundColor: '#e9ecef', borderRadius: '2px', height: '4px' }}>
                              <div 
                                style={{ 
                                  backgroundColor: '#dc3545', 
                                  height: '4px', 
                                  borderRadius: '2px',
                                  width: `${Math.min((stat.blocked / stat.requests) * 100, 100)}%`
                                }}
                              ></div>
                            </div>
                            <span style={{ fontSize: '12px', color: '#dc3545', minWidth: '60px', textAlign: 'right' }}>
                              {stat.blocked} blocked
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>
                  No traffic data available
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {selectedTab === 'security' && blockedIPs && analyticsData && (
        <div>
          {/* Security Overview */}
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Blocked IPs</div>
                  <div style={{ ...styles.metricValue, color: '#dc3545' }}>
                    {blockedIPs.summary.totalBlockedIPs}
                  </div>
                </div>
                <Ban size={40} color="#dc3545" style={styles.metricIcon} />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Total Violations</div>
                  <div style={{ ...styles.metricValue, color: '#fd7e14' }}>
                    {blockedIPs.summary.totalViolations}
                  </div>
                </div>
                <AlertTriangle size={40} color="#fd7e14" style={styles.metricIcon} />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Security Status</div>
                  <div style={{ ...styles.metricValue, color: '#28a745', fontSize: '20px' }}>
                    Protected
                  </div>
                </div>
                <Shield size={40} color="#28a745" style={styles.metricIcon} />
              </div>
            </div>
          </div>

          {/* Blocked IPs Table */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Blocked IP Addresses</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {blockedIPs.blockedIPs?.length > 0 ? (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>IP Address</th>
                      <th style={styles.th}>Violations</th>
                      <th style={styles.th}>Total Requests</th>
                      <th style={styles.th}>Block Rate</th>
                      <th style={styles.th}>Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blockedIPs.blockedIPs.map((ip) => (
                      <tr key={ip.ip}>
                        <td style={styles.td}>
                          <code style={{ fontSize: '12px' }}>{ip.ip}</code>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...styles.badgeRed }}>
                            {ip.violations}
                          </span>
                        </td>
                        <td style={styles.td}>{ip.totalRequests}</td>
                        <td style={styles.td}>{ip.blockRate}%</td>
                        <td style={styles.td}>
                          <small>
                            {ip.lastActivity ? new Date(ip.lastActivity).toLocaleString() : 'N/A'}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>
                  No blocked IPs detected - System is secure! 🛡️
                </p>
              )}
            </div>
          </div>

          {/* Most Targeted Endpoints */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Most Targeted Endpoints</h3>
            </div>
            <div>
              {analyticsData.endpointStats?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {analyticsData.endpointStats.map((endpoint, index) => (
                    <div key={endpoint.endpoint} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '6px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#007bff',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                        <code style={{ fontSize: '14px' }}>{endpoint.endpoint}</code>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 'bold' }}>{endpoint.total}</div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>requests</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 'bold', color: '#dc3545' }}>{endpoint.blocked}</div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>blocked</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 'bold', color: '#fd7e14' }}>{endpoint.blockRate}%</div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>rate</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>
                  No endpoint data available
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Health Tab */}
      {selectedTab === 'system' && systemHealth && (
        <div>
          {/* System Metrics */}
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Memory Usage</div>
                  <div style={styles.metricValue}>
                    {systemHealth.memory.usagePercentage}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {systemHealth.memory.heapUsed}MB / {systemHealth.memory.heapTotal}MB
                  </div>
                </div>
                <Server size={40} color="#007bff" style={styles.metricIcon} />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Uptime</div>
                  <div style={{ ...styles.metricValue, fontSize: '20px', color: '#28a745' }}>
                    {systemHealth.uptime.formatted}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {systemHealth.uptime.seconds} seconds
                  </div>
                </div>
                <Clock size={40} color="#28a745" style={styles.metricIcon} />
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Database</div>
                  <div style={{ 
                    ...styles.metricValue, 
                    fontSize: '18px',
                    color: getHealthColor(systemHealth.database.status),
                    textTransform: 'capitalize'
                  }}>
                    {systemHealth.database.status}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {systemHealth.database.responseTime}ms response
                  </div>
                </div>
                {systemHealth.database.status === 'healthy' ? (
                  <CheckCircle size={40} color={getHealthColor(systemHealth.database.status)} style={styles.metricIcon} />
                ) : (
                  <XCircle size={40} color={getHealthColor(systemHealth.database.status)} style={styles.metricIcon} />
                )}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.metric}>
                <div>
                  <div style={styles.metricLabel}>Node.js</div>
                  <div style={{ ...styles.metricValue, fontSize: '18px', color: '#6f42c1' }}>
                    {systemHealth.nodeVersion}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {systemHealth.platform}
                  </div>
                </div>
                <Server size={40} color="#6f42c1" style={styles.metricIcon} />
              </div>
            </div>
          </div>

          {/* Detailed System Info */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>System Details</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <h4 style={{ marginBottom: '16px', color: '#333' }}>Memory Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6c757d' }}>Heap Used:</span>
                    <span style={{ fontWeight: '500' }}>{systemHealth.memory.heapUsed}MB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6c757d' }}>Heap Total:</span>
                    <span style={{ fontWeight: '500' }}>{systemHealth.memory.heapTotal}MB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6c757d' }}>External:</span>
                    <span style={{ fontWeight: '500' }}>{systemHealth.memory.external}MB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6c757d' }}>RSS:</span>
                    <span style={{ fontWeight: '500' }}>{systemHealth.memory.rss}MB</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 style={{ marginBottom: '16px', color: '#333' }}>System Status</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6c757d' }}>Database Status:</span>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: systemHealth.database.status === 'healthy' ? '#d4edda' : '#f8d7da',
                      color: systemHealth.database.status === 'healthy' ? '#155724' : '#721c24'
                    }}>
                      {systemHealth.database.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6c757d' }}>Last Updated:</span>
                    <span style={{ fontWeight: '500' }}>
                      {new Date(systemHealth.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;