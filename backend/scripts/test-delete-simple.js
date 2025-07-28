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

async function testDeleteSimple() {
  let connection;
  
  try {
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    
    // Check existing calculations
    const [calculations] = await connection.execute(
      'SELECT id, user_id FROM calculations ORDER BY id DESC LIMIT 3'
    );
    
    
    if (calculations.length === 0) {
      return;
    }
    
    // Show available calculations
    calculations.forEach((calc, index) => {
    });
    
    // Test the database delete operation (what the fixed endpoint does)
    
    // We'll test with a non-existent ID to avoid actually deleting data
    const testId = 99999;
    const testUserId = 1;
    
    const [deleteResult] = await connection.execute(
      'DELETE FROM calculations WHERE id = ? AND user_id = ?',
      [testId, testUserId]
    );
    
    
    // Test the function that was causing the error
    
    
  } catch (error) {
    if (error.message.includes('db.delete is not a function')) {
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testDeleteSimple();
