const db = require('../config/database');

/**
 * Universal AUTO_INCREMENT Reset Utility
 * Provides functions to reset AUTO_INCREMENT counters for any table
 */

/**
 * Reset AUTO_INCREMENT counter for a specific table
 * @param {string} tableName - Name of the table to reset
 * @param {number} startValue - Value to reset to (default: 1)
 * @returns {Promise<boolean>} - Success status
 */
async function resetTableAutoIncrement(tableName, startValue = 1) {
  try {
    // Validate table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }
    
    // MariaDB doesn't support parameter binding for ALTER TABLE, so we use direct string interpolation
    // This is safe because we validate the table name above
    const sql = `ALTER TABLE ${tableName} AUTO_INCREMENT = ${parseInt(startValue)}`;
    await db.execute(sql);
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if a table is empty
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} - True if table is empty
 */
async function isTableEmpty(tableName) {
  try {
    const result = await db.getOne(`SELECT COUNT(*) as count FROM ${tableName}`);
    return result.count === 0;
  } catch (error) {
    throw error;
  }
}

/**
 * Reset AUTO_INCREMENT only if table is empty
 * @param {string} tableName - Name of the table to reset
 * @param {number} startValue - Value to reset to (default: 1)
 * @returns {Promise<{reset: boolean, reason: string}>} - Reset status and reason
 */
async function resetIfEmpty(tableName, startValue = 1) {
  try {
    const isEmpty = await isTableEmpty(tableName);
    
    if (isEmpty) {
      await resetTableAutoIncrement(tableName, startValue);
      return {
        reset: true,
        reason: `Table '${tableName}' was empty, AUTO_INCREMENT reset to ${startValue}`
      };
    } else {
      return {
        reset: false,
        reason: `Table '${tableName}' contains data, AUTO_INCREMENT not reset`
      };
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Get current AUTO_INCREMENT value for a table
 * @param {string} tableName - Name of the table
 * @returns {Promise<number>} - Current AUTO_INCREMENT value
 */
async function getCurrentAutoIncrement(tableName) {
  try {
    const result = await db.getOne(`
      SELECT AUTO_INCREMENT 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ?
    `, [tableName]);
    
    return result ? result.AUTO_INCREMENT : null;
  } catch (error) {
    throw error;
  }
}

/**
 * Reset AUTO_INCREMENT for all tables in the database
 * @param {boolean} onlyIfEmpty - Only reset if table is empty (default: true)
 * @param {number} startValue - Value to reset to (default: 1)
 * @returns {Promise<Object>} - Summary of reset operations
 */
async function resetAllTablesAutoIncrement(onlyIfEmpty = true, startValue = 1) {
  const tables = [
    'job_categories',
    'job_types', 
    'materials',
    'labor_rates',
    'job_type_materials',
    'users',
    'calculations'
  ];
  
  const results = {
    success: [],
    skipped: [],
    errors: []
  };
  
  for (const tableName of tables) {
    try {
      if (onlyIfEmpty) {
        const resetResult = await resetIfEmpty(tableName, startValue);
        
        if (resetResult.reset) {
          results.success.push({
            table: tableName,
            action: 'reset',
            reason: resetResult.reason
          });
        } else {
          results.skipped.push({
            table: tableName,
            action: 'skipped',
            reason: resetResult.reason
          });
        }
      } else {
        await resetTableAutoIncrement(tableName, startValue);
        results.success.push({
          table: tableName,
          action: 'force_reset',
          reason: `AUTO_INCREMENT force reset to ${startValue}`
        });
      }
    } catch (error) {
      results.errors.push({
        table: tableName,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Get AUTO_INCREMENT status for all tables
 * @returns {Promise<Array>} - Array of table status objects
 */
async function getAllTablesAutoIncrementStatus() {
  const tables = [
    'job_categories',
    'job_types', 
    'materials',
    'labor_rates',
    'job_type_materials',
    'users',
    'calculations'
  ];
  
  const status = [];
  
  for (const tableName of tables) {
    try {
      const isEmpty = await isTableEmpty(tableName);
      const currentAutoIncrement = await getCurrentAutoIncrement(tableName);
      const rowCount = await db.getOne(`SELECT COUNT(*) as count FROM ${tableName}`);
      
      status.push({
        table: tableName,
        is_empty: isEmpty,
        row_count: rowCount.count,
        current_auto_increment: currentAutoIncrement,
        needs_reset: isEmpty && currentAutoIncrement > 1
      });
    } catch (error) {
      status.push({
        table: tableName,
        error: error.message
      });
    }
  }
  
  return status;
}

/**
 * Validate table name to prevent SQL injection
 * @param {string} tableName - Table name to validate
 * @returns {boolean} - True if valid table name
 */
function isValidTableName(tableName) {
  const validTables = [
    'job_categories',
    'job_types', 
    'materials',
    'labor_rates',
    'job_type_materials',
    'users',
    'calculations'
  ];
  
  return validTables.includes(tableName);
}

module.exports = {
  resetTableAutoIncrement,
  isTableEmpty,
  resetIfEmpty,
  getCurrentAutoIncrement,
  resetAllTablesAutoIncrement,
  getAllTablesAutoIncrementStatus,
  isValidTableName
};
