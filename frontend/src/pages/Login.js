import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [formData, setFormData] = useState({
    identifier: '', // This can be username or email
    password: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    years_experience: 0
  });

  const { login, register, loading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when switching between login/register
  useEffect(() => {
    clearError();
  }, [isRegistering, clearError]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    const result = await login(formData);
    if (result.success) {
      navigate('/');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    const result = await register(registerData);
    if (result.success) {
      navigate('/');
    }
  };

  const handleLoginChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };

  const styles = {
    container: {
      maxWidth: '400px',
      margin: '50px auto',
      padding: '20px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      backgroundColor: 'white'
    },
    title: {
      textAlign: 'center',
      marginBottom: '30px',
      color: '#333'
    },
    formGroup: {
      marginBottom: '15px'
    },
    input: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      fontSize: '16px',
      cursor: 'pointer',
      borderRadius: '4px',
      marginBottom: '10px'
    },
    buttonDisabled: {
      backgroundColor: '#6c757d',
      cursor: 'not-allowed'
    },
    error: {
      color: 'red',
      textAlign: 'center',
      marginBottom: '15px',
      padding: '10px',
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderRadius: '4px'
    },
    switchText: {
      textAlign: 'center',
      marginTop: '15px'
    },
    link: {
      color: '#007bff',
      cursor: 'pointer',
      textDecoration: 'underline'
    },
    helpText: {
      fontSize: '12px',
      color: '#666',
      marginTop: '5px'
    }
  };

  if (!isRegistering) {
    // LOGIN FORM
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Login to Your Account</h2>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleLoginSubmit}>
          <div style={styles.formGroup}>
            <input
              type="text"
              name="identifier"
              placeholder="Username or Email"
              value={formData.identifier}
              onChange={handleLoginChange}
              style={styles.input}
              required
            />
            <div style={styles.helpText}>
              You can use either your username or email to login
            </div>
          </div>
          
          <div style={styles.formGroup}>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleLoginChange}
              style={styles.input}
              required
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={styles.switchText}>
          Don't have an account?{' '}
          <span 
            style={styles.link}
            onClick={() => setIsRegistering(true)}
          >
            Create one here
          </span>
        </div>
      </div>
    );
  }

  // REGISTRATION FORM
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create New Account</h2>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <form onSubmit={handleRegisterSubmit}>
        <div style={styles.formGroup}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={registerData.username}
            onChange={handleRegisterChange}
            style={styles.input}
            required
          />
          <div style={styles.helpText}>
            3-50 characters, letters, numbers, and underscores only
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={registerData.email}
            onChange={handleRegisterChange}
            style={styles.input}
            required
          />
        </div>
        
        <div style={styles.formGroup}>
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={registerData.full_name}
            onChange={handleRegisterChange}
            style={styles.input}
            required
          />
        </div>
        
        <div style={styles.formGroup}>
          <input
            type="number"
            name="years_experience"
            placeholder="Years of Programming Experience"
            value={registerData.years_experience}
            onChange={handleRegisterChange}
            style={styles.input}
            min="0"
            max="50"
          />
          <div style={styles.helpText}>
            How many years have you been programming? (Optional)
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={registerData.password}
            onChange={handleRegisterChange}
            style={styles.input}
            required
            minLength="8"
          />
          <div style={styles.helpText}>
            At least 8 characters with uppercase, lowercase, and number
          </div>
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {})
          }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <div style={styles.switchText}>
        Already have an account?{' '}
        <span 
          style={styles.link}
          onClick={() => setIsRegistering(false)}
        >
          Login here
        </span>
      </div>
    </div>
  );
}

export default Login;