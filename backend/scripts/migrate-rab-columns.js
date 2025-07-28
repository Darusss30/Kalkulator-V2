const db = require('../config/database');
require('dotenv').config();

async function migrateRabColumns() {
  
  try {
    // Check if columns already exist
    const columns = await db.getMany('DESCRIBE calculations');
    const hasRabColumns = columns.some(col => col.Field === 'profit_percentage') && 
                         columns.some(col => col.Field === 'rab_total');
    
    if (hasRabColumns) {
      return;
    }
    
    
    // Add profit_percentage column
    await db.execute(`
      ALTER TABLE calculations 
      ADD COLUMN profit_percentage DECIMAL(5,2) DEFAULT 20.00 COMMENT 'Profit percentage for RAB calculation'
    `);
    
    // Add rab_total column
    await db.execute(`
      ALTER TABLE calculations 
      ADD COLUMN rab_total DECIMAL(15,2) DEFAULT 0 COMMENT 'Total RAB (Rencana Anggaran Biaya)'
    `);
    
    // Update existing records (if any)
    const updateResult = await db.update(`
      UPDATE calculations
      SET profit_percentage = 20.00,
          rab_total = ROUND(total_rab / (1 - 0.20))
      WHERE profit_percentage IS NULL
    `);
    
    // Add indexes for better performance
    try {
      await db.execute('CREATE INDEX idx_calculations_profit_percentage ON calculations(profit_percentage)');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
      } else {
        throw error;
      }
    }
    
    try {
      await db.execute('CREATE INDEX idx_calculations_rab_total ON calculations(rab_total)');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
      } else {
        throw error;
      }
    }
    
    
    // Verify the migration
    const newColumns = await db.getMany('DESCRIBE calculations');
    const verifyRabColumns = newColumns.some(col => col.Field === 'profit_percentage') && 
                            newColumns.some(col => col.Field === 'rab_total');
    
    if (verifyRabColumns) {
      newColumns.forEach(col => {
        if (col.Field === 'profit_percentage' || col.Field === 'rab_total') {
        }
      });
    } else {
    }
    
  } catch (error) {
  } finally {
    process.exit(0);
  }
}

// Run migration
migrateRabColumns();
