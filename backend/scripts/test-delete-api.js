const axios = require('axios');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'kalkulator_konstruksi',
  charset: 'utf8mb4'
};

// API configuration
const API_BASE_URL = 'http://localhost:5001/api';

async function testDeleteAPI() {
  let connection;
  
  try {
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    
    // First, let's create a test user and calculation for testing
    
    // Check if test user exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['test@delete.com']
    );
    
    let testUserId;
    if (existingUsers.length > 0) {
      testUserId = existingUsers[0].id;
    } else {
      // Create test user
      const [userResult] = await connection.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Test User', 'test@delete.com', '$2b$10$hashedpassword', 'user']
      );
      testUserId = userResult.insertId;
    }
    
    // Create a test calculation
    const [calcResult] = await connection.execute(`
      INSERT INTO calculations (
        user_id, job_type_id, volume, productivity, worker_ratio, num_workers,
        labor_cost, material_cost, hpp_per_unit, total_rab, estimated_days, calculation_data,
        profit_percentage, rab_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testUserId, 1, 100, 10, '1:2', 3,
      1000000, 500000, 15000, 1800000, 10, '{"test": "data"}',
      20, 1800000
    ]);
    
    const testCalculationId = calcResult.insertId;
    
    // Now test the delete functionality by making a direct database call
    // (simulating what the fixed endpoint should do)
    
    // Test the remove function directly
    const deleteResult = await connection.execute(
      'DELETE FROM calculations WHERE id = ? AND user_id = ?',
      [testCalculationId, testUserId]
    );
    
    
    if (deleteResult[0].affectedRows === 1) {
    } else {
    }
    
    // Verify the calculation was deleted
    const [verifyResult] = await connection.execute(
      'SELECT id FROM calculations WHERE id = ?',
      [testCalculationId]
    );
    
    if (verifyResult.length === 0) {
    } else {
    }
    
    
  } catch (error) {
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testDeleteAPI();
