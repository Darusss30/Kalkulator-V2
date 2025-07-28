const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kalkulator_konstruksi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection function
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    return false;
  }
}

// Execute query with error handling
async function executeQuery(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Get single record
async function getOne(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows[0] || null;
  } catch (error) {
    throw error;
  }
}

// Get multiple records
async function getMany(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Insert record and return inserted ID
async function insert(query, params = []) {
  try {
    const [result] = await pool.execute(query, params);
    return result.insertId;
  } catch (error) {
    throw error;
  }
}

// Update record and return affected rows
async function update(query, params = []) {
  try {
    const [result] = await pool.execute(query, params);
    return result.affectedRows;
  } catch (error) {
    throw error;
  }
}

// Delete record and return affected rows
async function remove(query, params = []) {
  try {
    const [result] = await pool.execute(query, params);
    return result.affectedRows;
  } catch (error) {
    throw error;
  }
}

// Transaction helper
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Pagination helper
function buildPaginationQuery(baseQuery, page = 1, limit = 10, orderBy = 'id', orderDir = 'ASC') {
  const offset = (page - 1) * limit;
  const query = `${baseQuery} ORDER BY ${orderBy} ${orderDir} LIMIT ${limit} OFFSET ${offset}`;
  return query;
}

// Count helper for pagination
async function getCount(countQuery, params = []) {
  try {
    const [rows] = await pool.execute(countQuery, params);
    return rows[0].total || 0;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  pool,
  execute: executeQuery,
  getOne,
  getMany,
  insert,
  update,
  remove,
  transaction,
  testConnection,
  buildPaginationQuery,
  getCount
};
