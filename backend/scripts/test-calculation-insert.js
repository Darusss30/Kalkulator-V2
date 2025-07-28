const db = require('../config/database');

async function testCalculationInsert() {
  
  try {
    // Test database connection first
    await db.execute('SELECT 1');
    
    // Check if calculations table exists and has required columns
    const tableStructure = await db.getMany('DESCRIBE calculations');
    tableStructure.forEach(col => {
    });
    
    // Check if profit_percentage and rab_total columns exist
    const hasProfit = tableStructure.some(col => col.Field === 'profit_percentage');
    const hasRabTotal = tableStructure.some(col => col.Field === 'rab_total');
    
    
    if (!hasProfit || !hasRabTotal) {
      
      if (!hasProfit) {
        await db.execute('ALTER TABLE calculations ADD COLUMN profit_percentage DECIMAL(5,2) DEFAULT 20.00');
      }
      
      if (!hasRabTotal) {
        await db.execute('ALTER TABLE calculations ADD COLUMN rab_total DECIMAL(15,2) NOT NULL DEFAULT 0');
      }
    }
    
    // Test getting user ID (should be 1 for admin)
    const users = await db.getMany('SELECT id, username, role FROM users LIMIT 5');
    users.forEach(user => {
    });
    
    const adminUser = users.find(u => u.username === 'admin');
    if (!adminUser) {
      return;
    }
    
    // Test getting job type (should be 1 for Pembersihan Lahan)
    const jobTypes = await db.getMany('SELECT id, name, category_id FROM job_types LIMIT 5');
    jobTypes.forEach(jt => {
    });
    
    // Test calculation insert
    
    const testCalculationData = {
      user_id: adminUser.id,
      job_type_id: 1, // Pembersihan Lahan
      volume: 100,
      productivity: 100,
      worker_ratio: '1:1',
      num_workers: 4,
      labor_cost: 570000,
      material_cost: 0,
      hpp_per_unit: 5700,
      total_rab: 570000,
      estimated_days: 1,
      calculation_data: JSON.stringify({
        job_type: { id: 1, name: 'Pembersihan Lahan' },
        input: { volume: 100, productivity: 100 },
        summary: { total_cost: 570000 }
      }),
      profit_percentage: 20.00,
      rab_total: 712500
    };
    
    
    const insertId = await db.insert(`
      INSERT INTO calculations (
        user_id, job_type_id, volume, productivity, worker_ratio, num_workers,
        labor_cost, material_cost, hpp_per_unit, total_rab, estimated_days, calculation_data,
        profit_percentage, rab_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testCalculationData.user_id,
      testCalculationData.job_type_id,
      testCalculationData.volume,
      testCalculationData.productivity,
      testCalculationData.worker_ratio,
      testCalculationData.num_workers,
      testCalculationData.labor_cost,
      testCalculationData.material_cost,
      testCalculationData.hpp_per_unit,
      testCalculationData.total_rab,
      testCalculationData.estimated_days,
      testCalculationData.calculation_data,
      testCalculationData.profit_percentage,
      testCalculationData.rab_total
    ]);
    
    
    // Verify the insert
    const insertedCalc = await db.getOne('SELECT * FROM calculations WHERE id = ?', [insertId]);
    
    if (insertedCalc) {
    } else {
    }
    
    // Test history query
    const historyResults = await db.getMany(`
      SELECT 
        c.*,
        jt.name as job_type_name,
        jt.unit as job_type_unit,
        jc.name as category_name
      FROM calculations c
      JOIN job_types jt ON c.job_type_id = jt.id
      JOIN job_categories jc ON jt.category_id = jc.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT 5
    `, [adminUser.id]);
    
    historyResults.forEach((calc, index) => {
    });
    
    
  } catch (error) {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  } finally {
    process.exit(0);
  }
}

// Run the test
testCalculationInsert();
