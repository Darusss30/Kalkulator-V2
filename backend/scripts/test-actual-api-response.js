const axios = require('axios');

async function testActualAPIResponse() {
  
  try {
    // First, login to get token
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      username: 'admin',
      password: 'admin'
    });
    
    const token = loginResponse.data.token;
    
    // Test history API with authentication
    const historyResponse = await axios.get('http://localhost:5001/api/calculations/history?page=1&limit=10&search=', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    
    const responseData = historyResponse.data;
    
    
    if (responseData.data) {
      
      if (responseData.data.calculations) {
        
        if (responseData.data.calculations.length > 0) {
          const sample = responseData.data.calculations[0];
        }
      } else {
      }
      
      if (responseData.data.pagination) {
      }
    } else {
    }
    
    
    
  } catch (error) {
    if (error.response) {
    }
  }
}

// Run the test
testActualAPIResponse();
