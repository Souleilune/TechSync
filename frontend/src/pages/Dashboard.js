import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '30px'
    },
    welcome: {
      margin: 0,
      color: '#333'
    },
    userInfo: {
      fontSize: '14px',
      color: '#666',
      margin: '5px 0'
    },
    logoutButton: {
      padding: '10px 20px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    content: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px'
    },
    card: {
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef'
    },
    cardTitle: {
      marginTop: 0,
      marginBottom: '15px',
      color: '#495057'
    },
    cardText: {
      color: '#6c757d',
      lineHeight: '1.5'
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.welcome}>
            Welcome back, {user?.full_name || user?.username}!
          </h1>
          <div style={styles.userInfo}>
            Username: {user?.username}
          </div>
          <div style={styles.userInfo}>
            Email: {user?.email}
          </div>
          {user?.years_experience > 0 && (
            <div style={styles.userInfo}>
              Experience: {user.years_experience} years
            </div>
          )}
        </div>
        <button 
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </button>
      </header>

      <div style={styles.content}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🚀 Getting Started</h3>
          <p style={styles.cardText}>
            Welcome to your coding collaboration platform! Here you can find projects, 
            challenges, and connect with other developers.
          </p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📊 Your Stats</h3>
          <p style={styles.cardText}>
            • Projects: 0<br/>
            • Challenges completed: 0<br/>
            • Collaborations: 0
          </p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🔥 Recent Activity</h3>
          <p style={styles.cardText}>
            No recent activity yet. Start by exploring projects or taking on a coding challenge!
          </p>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>💡 Quick Actions</h3>
          <p style={styles.cardText}>
            • Browse Projects<br/>
            • Take a Challenge<br/>
            • Update Profile<br/>
            • Find Collaborators
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;