#!/usr/bin/env node

// Admin API Test Script
const axios = require('axios');

const BASE_URL = 'https://api-pjqcolhhra-uc.a.run.app';
const ADMIN_EMAIL = 'admin@loremaster.com';
const ADMIN_PASSWORD = 'admin123'; // Default admin password

async function testAdminAPI() {
  console.log('🔄 Testing Lore Master Admin API...\n');

  try {
    // Step 1: Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Health: ${healthResponse.data.status}\n`);

    // Step 2: Admin login
    console.log('2. Attempting admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const { token } = loginResponse.data;
    console.log(`✅ Admin login successful\n`);

    // Create authenticated axios instance
    const adminAPI = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 3: Test admin endpoints
    const endpoints = [
      '/admin/dashboard/stats',
      '/admin/topics',
      '/admin/questions', 
      '/admin/users'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`3. Testing ${endpoint}...`);
        const response = await adminAPI.get(endpoint);
        console.log(`✅ ${endpoint}: ${response.status} - Success`);
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`   📊 ${response.data.length} items returned`);
        } else if (response.data && typeof response.data === 'object') {
          console.log(`   📊 Data keys: ${Object.keys(response.data).join(', ')}`);
        }
        console.log();
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status || 'Error'} - ${error.response?.data?.error || error.message}`);
        console.log();
      }
    }

  } catch (error) {
    if (error.response) {
      console.log(`❌ API Error: ${error.response.status} - ${error.response.data?.error || error.response.data}`);
    } else {
      console.log(`❌ Network Error: ${error.message}`);
    }
  }
}

testAdminAPI();
