const db = require('../config/database');

async function testHistoryAPI() {
  
  try {
    // Test the exact same query that the API uses
    const userId = 1; // Admin user ID
    const page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    const totalCount = await db.getOne(
      'SELECT COUNT(*) as total FROM calculations WHERE user_id = ?',
      [userId]
    );
    
    const calculations = await db.getMany(`
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
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), offset]);
    
    calculations.forEach((calc, index) => {
    });
    
    const calculationsWithData = calculations.map(calc => {
      let parsedData = null;
      try {
        parsedData = calc.calculation_data ? JSON.parse(calc.calculation_data) : null;
      } catch (parseError) {
      }
      
      return {
        ...calc,
        calculation_data: parsedData
      };
    });
    
    calculationsWithData.forEach((calc, index) => {
    });
    
    const totalPages = Math.ceil(totalCount.total / limit);
    
    const apiResponse = {
      message: 'Calculation history retrieved successfully',
      data: {
        calculations: calculationsWithData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount.total,
          pages: totalPages
        }
      }
    };
    
    
    if (apiResponse.data.calculations.length > 0) {
      const sample = apiResponse.data.calculations[0];
    }
    
    if (apiResponse.data.calculations.length === 0) {
    } else {
    }
    
    
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
testHistoryAPI();
