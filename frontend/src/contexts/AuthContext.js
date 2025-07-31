import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null
};

// Auth Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      validateToken(token);
    }
  }, []);

  // Validate token and get user profile
  const validateToken = async (token) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authService.getProfile(token);
      
      if (response.success) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token
          }
        });
      } else {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid token' });
      }
    } catch (error) {
      localStorage.removeItem('token');
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Token validation failed' });
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authService.login(credentials);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: response.data
        });
        return { success: true };
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authService.register(userData);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: response.data
        });
        return { success: true };
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      return { success: false, message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await authService.updateProfile(userData, state.token);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_USER', payload: response.data.user });
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
