// Quick test script to verify all API endpoints are working
const axios = require('axios');

const baseURL = 'https://us-central1-lore-master-287f0.cloudfunctions.net/admin';

async function testEndpoints() {
  const endpoints = [
    '/topics',
    '/questions', 
    '/users',
    '/leaderboard'
  ];

  console.log('Testing API endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(baseURL + endpoint);
      console.log(`✅ ${endpoint}: ${response.status} - ${response.data.length || 'OK'} items`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.response?.status || 'Network Error'} - ${error.message}`);
    }
  }
}

testEndpoints();
