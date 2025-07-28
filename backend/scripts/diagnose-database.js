const db = require('../config/database');
require('dotenv').config();

async function diagnoseDatabaseIssues() {
  
  try {
    // 1. Test basic database connection
    await db.execute('SELECT 1 as test');
    
    // 2. Check if database exists
    const dbName = process.env.DB_NAME || 'kalkulator_konstruksi';
    const databases = await db.getMany('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === dbName);
    
    if (dbExists) {
    } else {
      return;
    }
    
    // 3. Check if calculations table exists
    try {
      const tables = await db.getMany('SHOW TABLES LIKE "calculations"');
      if (tables.length > 0) {
        
        // Check table structure
        const columns = await db.getMany('DESCRIBE calculations');
        columns.forEach(col => {
        });
        
        // Check if new columns exist
        const hasRabColumns = columns.some(col => col.Field === 'profit_percentage') && 
                             columns.some(col => col.Field === 'rab_total');
        
        if (hasRabColumns) {
        } else {
        }
        
      } else {
        return;
      }
    } catch (error) {
      return;
    }
    
    // 4. Check if there are any calculations in the database
    const totalCalcs = await db.getOne('SELECT COUNT(*) as count FROM calculations');
    
    if (totalCalcs.count > 0) {
      // Show recent calculations
      const recentCalcs = await db.getMany(`
        SELECT c.id, c.user_id, c.volume, c.created_at, 
               jt.name as job_type_name, u.username
        FROM calculations c
        LEFT JOIN job_types jt ON c.job_type_id = jt.id
        LEFT JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC 
        LIMIT 5
      `);
      
      recentCalcs.forEach(calc => {
      });
    } else {
    }
    
    // 5. Check users table
    const totalUsers = await db.getOne('SELECT COUNT(*) as count FROM users');
    
    if (totalUsers.count > 0) {
      const users = await db.getMany('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 3');
      users.forEach(user => {
      });
    }
    
    // 6. Check job_types table
    const totalJobTypes = await db.getOne('SELECT COUNT(*) as count FROM job_types');
    
    if (totalJobTypes.count > 0) {
      const jobTypes = await db.getMany(`
        SELECT jt.id, jt.name, jc.name as category_name 
        FROM job_types jt 
        LEFT JOIN job_categories jc ON jt.category_id = jc.id 
        LIMIT 5
      `);
      jobTypes.forEach(jt => {
      });
    }
    
    // 7. Test calculation save simulation
    try {
      // Check if we can insert a test calculation (we'll rollback)
      await db.transaction(async (connection) => {
        const testUserId = 1; // Assuming user ID 1 exists
        const testJobTypeId = 1; // Assuming job type ID 1 exists
        
        const testData = {
          user_id: testUserId,
          job_type_id: testJobTypeId,
          volume: 100,
          productivity: 10,
          worker_ratio: '1:1',
          num_workers: 2,
          labor_cost: 500000,
          material_cost: 300000,
          hpp_per_unit: 8000,
          total_rab: 800000,
          estimated_days: 10,
          calculation_data: JSON.stringify({ test: true }),
          profit_percentage: 20,
          rab_total: 1000000
        };
        
        const [result] = await connection.execute(`
          INSERT INTO calculations (
            user_id, job_type_id, volume, productivity, worker_ratio, num_workers,
            labor_cost, material_cost, hpp_per_unit, total_rab, estimated_days, 
            calculation_data, profit_percentage, rab_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          testData.user_id, testData.job_type_id, testData.volume, testData.productivity,
          testData.worker_ratio, testData.num_workers, testData.labor_cost, testData.material_cost,
          testData.hpp_per_unit, testData.total_rab, testData.estimated_days, testData.calculation_data,
          testData.profit_percentage, testData.rab_total
        ]);
        
        
        // Rollback the transaction to not actually save the test data
        throw new Error('ROLLBACK_TEST');
      });
    } catch (error) {
      if (error.message === 'ROLLBACK_TEST') {
      } else {
      }
    }
    
    
  } catch (error) {
  } finally {
    process.exit(0);
  }
}

// Run diagnosis
diagnoseDatabaseIssues();
