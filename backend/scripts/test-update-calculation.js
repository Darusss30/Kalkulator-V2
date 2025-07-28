const axios = require('axios');

async function testUpdateCalculation() {
  
  const baseURL = 'http://localhost:5001/api';
  let authToken = null;
  let testCalculationId = null;
  
  try {
    // Step 1: Login to get auth token
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: 'admin',
      password: 'admin'
    });
    
    authToken = loginResponse.data.token;
    
    // Step 2: Create a test calculation first
    const createResponse = await axios.post(`${baseURL}/calculations/1`, {
      volume: 100,
      productivity: 10,
      worker_ratio: '1:1',
      num_workers: 2,
      material_specs: [],
      profit_percentage: 20,
      project_name: 'Test Project Original',
      custom_waste_factor: 5
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    
    // Step 3: Get the calculation ID from history
    const historyResponse = await axios.get(`${baseURL}/calculations/history?limit=1`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (historyResponse.data.data.calculations.length > 0) {
      testCalculationId = historyResponse.data.data.calculations[0].id;
        volume: historyResponse.data.data.calculations[0].volume,
        project_name: historyResponse.data.data.calculations[0].project_name,
        profit_percentage: historyResponse.data.data.calculations[0].profit_percentage
      });
    } else {
      throw new Error('No calculations found in history');
    }
    
    // Step 4: Update the calculation
    const updateResponse = await axios.put(`${baseURL}/calculations/history/${testCalculationId}`, {
      volume: 150, // Changed from 100 to 150
      productivity: 12, // Changed from 10 to 12
      worker_ratio: '1:2', // Changed from 1:1 to 1:2
      num_workers: 3, // Changed from 2 to 3
      material_specs: [],
      profit_percentage: 25, // Changed from 20 to 25
      project_name: 'Test Project Updated', // Changed name
      custom_waste_factor: 7, // Changed from 5 to 7
      edit_notes: 'Updated for testing purposes'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
      message: updateResponse.data.message,
      updated_volume: updateResponse.data.data.calculation.volume,
      updated_project_name: updateResponse.data.data.calculation.project_name,
      updated_profit_percentage: updateResponse.data.data.calculation.profit_percentage
    });
    
    // Step 5: Verify the update by fetching the calculation again
    const verifyResponse = await axios.get(`${baseURL}/calculations/history/${testCalculationId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const updatedCalc = verifyResponse.data.data.calculation;
      volume: updatedCalc.volume,
      project_name: updatedCalc.project_name,
      profit_percentage: updatedCalc.profit_percentage,
      updated_at: updatedCalc.updated_at,
      created_at: updatedCalc.created_at
    });
    
    // Check if updated_at is different from created_at
    if (updatedCalc.updated_at && updatedCalc.updated_at !== updatedCalc.created_at) {
    } else {
    }
    
    // Step 6: Test error cases
    
    // Test updating non-existent calculation
    try {
      await axios.put(`${baseURL}/calculations/history/99999`, {
        volume: 100,
        productivity: 10,
        worker_ratio: '1:1',
        profit_percentage: 20
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
      } else {
      }
    }
    
    // Test updating without authentication
    try {
      await axios.put(`${baseURL}/calculations/history/${testCalculationId}`, {
        volume: 100,
        productivity: 10,
        worker_ratio: '1:1',
        profit_percentage: 20
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
      } else {
      }
    }
    
    
  } catch (error) {
    if (error.response) {
    }
  }
}

// Run the test
testUpdateCalculation();
