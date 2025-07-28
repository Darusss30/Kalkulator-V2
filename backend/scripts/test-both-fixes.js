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

async function testBothFixes() {
  let connection;
  
  try {
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    
    // Test 1: Verify Delete Fix
    
    // Check existing calculations
    const [calculations] = await connection.execute(
      'SELECT id, user_id, total_rab, labor_cost, material_cost FROM calculations ORDER BY id DESC LIMIT 3'
    );
    
    
    if (calculations.length > 0) {
      calculations.forEach((calc, index) => {
      });
      
      // Test delete operation (simulate what the fixed endpoint does)
      const testId = 99999; // Non-existent ID to avoid deleting real data
      const [deleteResult] = await connection.execute(
        'DELETE FROM calculations WHERE id = ? AND user_id = ?',
        [testId, 1]
      );
      
    }
    
    // Test 2: Verify RAB Calculation Fix
    
    if (calculations.length > 0) {
      let rabIssuesFound = 0;
      let correctCalculations = 0;
      
      for (const calc of calculations) {
        const totalHPP = (parseFloat(calc.labor_cost) || 0) + (parseFloat(calc.material_cost) || 0);
        const totalRAB = parseFloat(calc.total_rab) || 0;
        
        
        if (totalRAB === totalHPP && totalRAB > 0) {
          rabIssuesFound++;
        } else if (totalRAB > totalHPP) {
          correctCalculations++;
        } else {
        }
      }
      
      
      if (rabIssuesFound > 0) {
      }
    }
    
    // Test 3: API Endpoint Test (if possible)
    
    try {
      // Test health endpoint
      const healthResponse = await axios.get(`${API_BASE_URL}/../health`);
    } catch (apiError) {
    }
    
    // Final Summary
    
    
    
  } catch (error) {
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the comprehensive test
testBothFixes();
