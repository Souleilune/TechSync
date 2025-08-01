const express = require('express');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Basic middleware
app.use(express.json());

// Simple test route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Simple test route for auth
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

module.exports = app;