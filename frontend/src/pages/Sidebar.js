// frontend/src/pages/Sidebar.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Main navigation items (for all users)
  const mainNavItems = [
    { id: 'home', label: 'Home', path: '/', icon: '🏠' },
    { id: 'projects', label: 'Projects', path: '/projects', icon: '📁' },
    { id: 'friends', label: 'Friends', path: '/friends', icon: '👥' },
    { id: 'learns', label: 'Learns', path: '/learns', icon: '📚' }
  ];

  // Admin/Moderator navigation items (only visible to admin/moderator users)
  const adminNavItems = user?.role === 'admin' || user?.role === 'moderator' ? [
    { id: 'challenges', label: 'Challenges', path: '/challenges', icon: '🧩' },
    ...(user?.role === 'admin' ? [
      { id: 'manage-users', label: 'Manage Users', path: '/admin/users', icon: '👥' },
      { id: 'analytics', label: 'Security Analytics', path: '/admin/analytics', icon: '🛡️' }
    ] : []),
    { id: 'admin', label: 'Admin Panel', path: '/admin', icon: '🛡️' }
  ] : [];

  // Bottom navigation items
  const bottomNavItems = [
    { id: 'help', label: 'Help Center', path: '/help', icon: '❓' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  // FIXED: Improved path matching logic
  const isActive = (path) => {
  if (path === '/') {
    return location.pathname === '/';
  }
  
  // Special handling for admin routes to prevent overlap
  if (path === '/admin' && (location.pathname === '/admin/users' || location.pathname === '/admin/analytics')) {
    return false; // Don't highlight admin panel when on manage users OR analytics
  }
  
  if (path === '/admin/users') {
    return location.pathname === '/admin/users' || location.pathname.startsWith('/admin/users/');
  }

  if (path === '/admin/analytics') {
    return location.pathname === '/admin/analytics' || location.pathname.startsWith('/admin/analytics/');
  }
  
  // For other paths, use startsWith but be more specific
  if (path === '/admin') {
    return location.pathname === '/admin' || (
      location.pathname.startsWith('/admin') && 
      !location.pathname.startsWith('/admin/users') && 
      !location.pathname.startsWith('/admin/analytics')
    );
  }
  
  return location.pathname.startsWith(path);
};

  const handleThreeDotsClick = (e) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false);
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

  const styles = {
    sidebar: {
      width: '250px',
      height: '100vh',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #dee2e6',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000
    },
    logo: {
      padding: '20px',
      borderBottom: '1px solid #dee2e6',
      textAlign: 'center',
      backgroundColor: 'white'
    },
    logoText: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#333',
      margin: 0
    },
    nav: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px 0'
    },
    navSection: {
      display: 'flex',
      flexDirection: 'column'
    },
    navItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 20px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      color: '#333',
      borderRadius: '0',
      margin: '0 10px',
      marginBottom: '2px'
    },
    navItemActive: {
      backgroundColor: '#007bff',
      color: 'white',
      borderRadius: '8px'
    },
    navItemHover: {
      backgroundColor: '#e9ecef',
      borderRadius: '8px'
    },
    // Special styling for admin items
    adminNavItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 20px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      color: '#333',
      borderRadius: '0',
      margin: '0 10px',
      marginBottom: '2px'
    },
    adminNavItemActive: {
      backgroundColor: '#dc3545', // Red background for admin
      color: 'white',
      borderRadius: '8px'
    },
    adminNavItemHover: {
      backgroundColor: '#f8d7da', // Light red hover
      borderRadius: '8px'
    },
    adminSeparator: {
      height: '1px',
      backgroundColor: '#dee2e6',
      margin: '10px 20px',
      borderRadius: '1px'
    },
    bottomNav: {
      borderTop: '1px solid #dee2e6',
      paddingTop: '20px'
    },
    userSection: {
      borderTop: '1px solid #dee2e6',
      padding: '16px',
      backgroundColor: 'white',
      position: 'relative'
    },
    userItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      flex: 1,
      padding: '8px',
      borderRadius: '8px',
      transition: 'background-color 0.2s ease'
    },
    userInfoHover: {
      backgroundColor: '#f8f9fa'
    },
    userAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: '#007bff',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 'bold',
      marginRight: '12px',
      flexShrink: 0
    },
    userName: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#333',
      lineHeight: 1.2
    },
    userRole: {
      fontSize: '12px',
      color: '#6c757d',
      textTransform: 'capitalize',
      marginTop: '2px'
    },
    icon: {
      marginRight: '12px',
      fontSize: '16px',
      width: '20px',
      textAlign: 'center'
    },
    label: {
      fontSize: '14px',
      fontWeight: '400'
    },
    threeDots: {
      background: 'none',
      border: 'none',
      fontSize: '16px',
      color: '#6c757d',
      cursor: 'pointer',
      padding: '4px 6px',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    },
    threeDotsHover: {
      backgroundColor: '#e9ecef',
      color: '#333'
    },
    userMenu: {
      position: 'absolute',
      bottom: '100%',
      left: '20px',
      right: '20px',
      backgroundColor: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      zIndex: 1001,
      overflow: 'hidden'
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      fontSize: '14px',
      color: '#333',
      borderBottom: '1px solid #f1f3f4'
    },
    menuItemLast: {
      borderBottom: 'none'
    },
    menuItemHover: {
      backgroundColor: '#f8f9fa'
    },
    menuItemIcon: {
      marginRight: '8px',
      fontSize: '14px'
    }
  };

  return (
    <div style={styles.sidebar}>
      {/* Logo Section */}
      <div style={styles.logo}>
        <h1 style={styles.logoText}>TechSync</h1>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navSection}>
          {/* Main Navigation Items (for all users) */}
          {mainNavItems.map((item) => {
            const isActiveItem = isActive(item.path);
            return (
              <div
                key={item.id}
                style={{
                  ...styles.navItem,
                  ...(isActiveItem ? styles.navItemActive : {})
                }}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={(e) => {
                  if (!isActiveItem) {
                    Object.assign(e.target.style, styles.navItemHover);
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActiveItem) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderRadius = '0';
                  }
                }}
              >
                <span style={styles.icon}>{item.icon}</span>
                <span style={styles.label}>{item.label}</span>
              </div>
            );
          })}

          {/* Admin/Moderator Navigation Items (only for admin/moderator) */}
          {adminNavItems.length > 0 && (
            <>
              <div style={styles.adminSeparator}></div>
              {adminNavItems.map((item) => {
                const isActiveItem = isActive(item.path);
                return (
                  <div
                    key={item.id}
                    style={{
                      ...styles.adminNavItem,
                      ...(isActiveItem ? styles.adminNavItemActive : {})
                    }}
                    onClick={() => handleNavigation(item.path)}
                    onMouseEnter={(e) => {
                      if (!isActiveItem) {
                        Object.assign(e.target.style, styles.adminNavItemHover);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActiveItem) {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.borderRadius = '0';
                      }
                    }}
                  >
                    <span style={styles.icon}>{item.icon}</span>
                    <span style={styles.label}>{item.label}</span>
                    {user?.role === 'admin' && item.id === 'admin' && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: '10px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        padding: '2px 6px',
                        borderRadius: '10px'
                      }}>
                        ADMIN
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Bottom Navigation - Help Center */}
        <div style={{ ...styles.navSection, ...styles.bottomNav }}>
          {bottomNavItems.map((item) => {
            const isActiveItem = isActive(item.path);
            return (
              <div
                key={item.id}
                style={{
                  ...styles.navItem,
                  ...(isActiveItem ? styles.navItemActive : {})
                }}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={(e) => {
                  if (!isActiveItem) {
                    Object.assign(e.target.style, styles.navItemHover);
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActiveItem) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderRadius = '0';
                  }
                }}
              >
                <span style={styles.icon}>{item.icon}</span>
                <span style={styles.label}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Section with Clickable Profile and Three Dots Menu */}
      <div style={styles.userSection}>
        <div style={styles.userItem}>
          <div
            style={styles.userInfo}
            onClick={handleProfileClick}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, styles.userInfoHover);
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <div style={styles.userAvatar}>
              {user?.full_name?.charAt(0)?.toUpperCase() || 
               user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={styles.userName}>
                {user?.full_name || user?.username || 'User'}
              </div>
              {/* Show user role if admin or moderator */}
              {(user?.role === 'admin' || user?.role === 'moderator') && (
                <div style={styles.userRole}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              )}
            </div>
          </div>
          <button
            style={styles.threeDots}
            onClick={handleThreeDotsClick}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, styles.threeDotsHover);
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#6c757d';
            }}
          >
            ⋮
          </button>
        </div>

        {/* User Menu */}
        {showUserMenu && (
          <div style={styles.userMenu}>
            <div
              style={styles.menuItem}
              onClick={handleProfileClick}
              onMouseEnter={(e) => {
                Object.assign(e.target.style, styles.menuItemHover);
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <span style={styles.menuItemIcon}>👤</span>
              Profile Settings
            </div>
            {/* Admin menu item (only for admins) */}
            {(user?.role === 'admin' || user?.role === 'moderator') && (
              <div
                style={styles.menuItem}
                onClick={() => {
                  navigate('/admin');
                  setShowUserMenu(false);
                }}
                onMouseEnter={(e) => {
                  Object.assign(e.target.style, styles.menuItemHover);
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <span style={styles.menuItemIcon}>🛡️</span>
                Admin Dashboard
              </div>
            )}
            <div
              style={{ ...styles.menuItem, ...styles.menuItemLast }}
              onClick={handleLogout}
              onMouseEnter={(e) => {
                Object.assign(e.target.style, styles.menuItemHover);
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <span style={styles.menuItemIcon}>🚪</span>
              Logout
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;