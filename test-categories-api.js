const axios = require('axios');

async function testCategoriesAPI() {
  try {
    console.log('🔍 Testing categories API...');
    
    const response = await axios.get('https://api-pjqcolhhra-uc.a.run.app/admin/categories', {
      params: {
        topic_id: 'MTG-LORE-2025',
        subtopic_id: 'planeswalkers'
      },
      headers: {
        'Authorization': 'Bearer invalid-token' // This will fail auth but show structure
      }
    });
    
    console.log('✅ Categories API Response:', response.data);
  } catch (error) {
    console.log('❌ Categories API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Check if it's just auth error vs other issues
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🔐 Authentication required - this is expected');
      console.log('💡 The API endpoint exists and is responding');
    }
  }
}

testCategoriesAPI();
