const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Generate JWT token
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

// Verify JWT token
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Hash password
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Authentication middleware
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided or invalid format'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = verifyToken(token);
      
      // Get user from database to ensure they still exist and are active
      const user = await db.getOne(
        'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
        [decoded.userId]
      );
      
      if (!user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'User not found'
        });
      }
      
      if (!user.is_active) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'User account is inactive'
        });
      }
      
      // Add user info to request object
      req.user = user;
      next();
      
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Authentication token has expired'
        });
      }
      
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication token is invalid'
      });
    }
    
  } catch (error) {
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
}

// Optional authentication middleware (doesn't fail if no token)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyToken(token);
      
      const user = await db.getOne(
        'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
        [decoded.userId]
      );
      
      if (user && user.is_active) {
        req.user = user;
      } else {
        req.user = null;
      }
      
    } catch (jwtError) {
      req.user = null;
    }
    
    next();
    
  } catch (error) {
    req.user = null;
    next();
  }
}

// Authorization middleware
function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }
    
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access forbidden',
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
}

// Admin only middleware
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access forbidden',
      message: 'Admin access required'
    });
  }
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authenticate,
  optionalAuth,
  authorize,
  adminOnly
};
