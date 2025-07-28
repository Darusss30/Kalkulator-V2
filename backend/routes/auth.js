const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { 
  generateToken, 
  hashPassword, 
  comparePassword, 
  authenticate,
  adminOnly 
} = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin 
} = require('../middleware/validation');
const {
  resetTableAutoIncrement,
  isTableEmpty,
  resetIfEmpty,
  getCurrentAutoIncrement
} = require('../utils/autoIncrementReset');

// Register new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    
    // Check if username already exists
    const existingUsername = await db.getOne(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsername) {
      return res.status(409).json({
        error: 'Username already exists',
        message: 'Please choose a different username'
      });
    }
    
    // Check if email already exists
    const existingEmail = await db.getOne(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingEmail) {
      return res.status(409).json({
        error: 'Email already exists',
        message: 'An account with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert new user
    const userId = await db.insert(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, full_name || null]
    );
    
    // Get created user (without password)
    const newUser = await db.getOne(
      'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role
    });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error during registration'
    });
  }
});

// Login user
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username or email
    const user = await db.getOne(
      'SELECT id, username, email, password_hash, full_name, role, is_active FROM users WHERE username = ? OR email = ?',
      [username, username]
    );
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account inactive',
        message: 'Your account has been deactivated'
      });
    }
    
    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });
    
    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error during login'
    });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await db.getOne(
      'SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }
    
    res.json({
      user
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'Internal server error while fetching profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { full_name, email } = req.body;
    const userId = req.user.id;
    
    // Check if email is being changed and if it already exists
    if (email && email !== req.user.email) {
      const existingEmail = await db.getOne(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existingEmail) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'Another account is already using this email'
        });
      }
    }
    
    // Update user profile
    const affectedRows = await db.update(
      'UPDATE users SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [full_name || null, email || req.user.email, userId]
    );
    
    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }
    
    // Get updated user
    const updatedUser = await db.getOne(
      'SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Profile update failed',
      message: 'Internal server error while updating profile'
    });
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    if (!current_password || !new_password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Current password and new password are required'
      });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'New password must be at least 6 characters long'
      });
    }
    
    // Get current user with password
    const user = await db.getOne(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await comparePassword(current_password, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Invalid current password',
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedNewPassword = await hashPassword(new_password);
    
    // Update password
    await db.update(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );
    
    res.json({
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Password change failed',
      message: 'Internal server error while changing password'
    });
  }
});

// Verify token (for frontend to check if token is still valid)
router.get('/verify', authenticate, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user
  });
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', authenticate, (req, res) => {
  // In a more complex setup, you might want to blacklist the token
  // For now, we just acknowledge the logout
  res.json({
    message: 'Logged out successfully'
  });
});

// Reset AUTO_INCREMENT for users table (admin only)
router.post('/reset-auto-increment', authenticate, adminOnly, async (req, res) => {
  try {
    // Reset AUTO_INCREMENT counter to 1
    await resetTableAutoIncrement('users', 1);
    
    res.json({
      message: 'Users AUTO_INCREMENT counter reset successfully',
      table: 'users',
      info: 'Next registered user will have ID = 1'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset AUTO_INCREMENT',
      message: 'Internal server error while resetting users AUTO_INCREMENT counter'
    });
  }
});

// Clear all users and reset counter (admin only)
router.delete('/clear-all-users', authenticate, adminOnly, async (req, res) => {
  try {
    // Check if any users have calculations
    const calculationsCount = await db.getOne(
      'SELECT COUNT(*) as count FROM calculations WHERE user_id IS NOT NULL'
    );
    
    if (calculationsCount.count > 0) {
      return res.status(409).json({
        error: 'Cannot clear users',
        message: 'Some users have calculations. Delete calculations first.',
        calculations_count: calculationsCount.count
      });
    }
    
    // Don't delete the current admin user
    const currentUserId = req.user.id;
    const deletedCount = await db.remove('DELETE FROM users WHERE id != ?', [currentUserId]);
    
    // Reset AUTO_INCREMENT counter
    await resetTableAutoIncrement('users', 1);
    
    res.json({
      message: 'All users (except current admin) cleared and AUTO_INCREMENT reset successfully',
      table: 'users',
      deleted_count: deletedCount,
      info: 'Next registered user will have ID = 1',
      note: 'Current admin user was preserved'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear users',
      message: 'Internal server error while clearing users'
    });
  }
});

// Get users AUTO_INCREMENT status (admin only)
router.get('/auto-increment-status', authenticate, adminOnly, async (req, res) => {
  try {
    const isEmpty = await isTableEmpty('users');
    const currentAutoIncrement = await getCurrentAutoIncrement('users');
    const rowCount = await db.getOne('SELECT COUNT(*) as count FROM users');
    
    const status = {
      table: 'users',
      is_empty: isEmpty,
      row_count: rowCount.count,
      current_auto_increment: currentAutoIncrement,
      needs_reset: isEmpty && currentAutoIncrement > 1
    };
    
    res.json({
      message: 'Users AUTO_INCREMENT status retrieved successfully',
      status
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get AUTO_INCREMENT status',
      message: 'Internal server error while getting users AUTO_INCREMENT status'
    });
  }
});

// Get all users (admin only)
router.get('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.q || '';
    
    let whereClause = '';
    let params = [];
    
    if (search) {
      whereClause = 'WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const totalCount = await db.getCount(countQuery, params);
    
    // Get users with pagination
    const offset = (page - 1) * limit;
    const query = `
      SELECT id, username, email, full_name, role, is_active, created_at, updated_at 
      FROM users ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const users = await db.getMany(query, [...params, limit, offset]);
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'Internal server error while fetching users'
    });
  }
});

// Temporary endpoint to make user admin (for testing only)
router.post('/make-admin-temp', async (req, res) => {
  try {
    const { username, secret_key } = req.body;
    
    // Simple secret key check for security
    if (secret_key !== 'temp_admin_secret_2024') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Invalid secret key'
      });
    }
    
    // Update user role to admin
    const affectedRows = await db.update(
      'UPDATE users SET role = ? WHERE username = ?',
      ['admin', username]
    );
    
    if (affectedRows === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }
    
    // Get updated user
    const updatedUser = await db.getOne(
      'SELECT id, username, email, full_name, role FROM users WHERE username = ?',
      [username]
    );
    
    res.json({
      message: 'User role updated to admin successfully',
      user: updatedUser,
      warning: 'This is a temporary endpoint for testing only'
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update user role',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
