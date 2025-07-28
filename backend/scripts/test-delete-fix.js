const mysql = require('mysql2/promise');
const axios = require('axios');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'kalkulator_konstruksi',
  charset: 'utf8mb4'
};

async function testDeleteFix() {
  let connection;
  
  try {
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    
    // Check if there are any calculations in the database
    const [calculations] = await connection.execute(
      'SELECT id, user_id FROM calculations LIMIT 5'
    );
    
    
    if (calculations.length === 0) {
      return;
    }
    
    // Show the first few calculations
    calculations.forEach((calc, index) => {
    });
    
    
    
  } catch (error) {
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
testDeleteFix();
