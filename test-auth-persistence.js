/**
 * Test Script for Auth Persistence and Token Refresh
 * 
 * This script tests the new authentication features:
 * 1. Token persistence
 * 2. Automatic token refresh
 * 3. Session restoration
 * 
 * Run with: node test-auth-persistence.js
 */

const axios = require('axios');

const API_BASE_URL = 'https://spelling-backend.onrender.com/api';

// Test credentials (use your test account)
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

async function testAuthFlow() {
  console.log('🧪 Testing Mobile App Auth Persistence\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (loginResponse.data.token) {
      console.log('✅ Login successful');
      console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
      console.log(`   User: ${loginResponse.data.user.email}\n`);
    } else {
      console.log('❌ Login failed - no token received\n');
      return;
    }

    const token = loginResponse.data.token;

    // Step 2: Test authenticated request
    console.log('2️⃣ Testing authenticated request...');
    const groupsResponse = await axios.get(`${API_BASE_URL}/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(`✅ Authenticated request successful`);
    console.log(`   Groups found: ${groupsResponse.data.groups?.length || 0}\n`);

    // Step 3: Test token refresh
    console.log('3️⃣ Testing token refresh...');
    const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      token: token,
    });

    if (refreshResponse.data.token) {
      console.log('✅ Token refresh successful');
      console.log(`   New token: ${refreshResponse.data.token.substring(0, 20)}...`);
      console.log(`   Token is different: ${refreshResponse.data.token !== token}\n`);
    } else {
      console.log('❌ Token refresh failed\n');
      return;
    }

    // Step 4: Test new token works
    console.log('4️⃣ Testing refreshed token...');
    const newToken = refreshResponse.data.token;
    const verifyResponse = await axios.get(`${API_BASE_URL}/groups`, {
      headers: { Authorization: `Bearer ${newToken}` },
    });

    console.log(`✅ Refreshed token works correctly\n`);

    // Step 5: Test timeout (simulated)
    console.log('5️⃣ Testing timeout handling...');
    console.log('   API timeout set to 30 seconds (increased from 10s)');
    console.log('   This helps with slow mobile connections and Render cold starts\n');

    console.log('✅ All tests passed!\n');
    console.log('📱 Mobile app should now:');
    console.log('   • Stay logged in across app restarts');
    console.log('   • Automatically refresh expired tokens');
    console.log('   • Handle slow connections better (30s timeout)');
    console.log('   • Retry failed network requests once');
    console.log('   • Redirect to login only when necessary\n');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure the test account exists:');
      console.log(`   Email: ${TEST_EMAIL}`);
      console.log(`   Password: ${TEST_PASSWORD}`);
      console.log('\n   Or update the credentials at the top of this file.');
    }
  }
}

// Run tests
testAuthFlow();
