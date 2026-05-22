const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const TEST_SELLER_ID = '6913043cabe0ab7e14181d62';

async function testAuthEndpoints() {
  console.log('🧪 Testing Authentication Required Endpoints...\n');

  try {
    // Test 1: Follow endpoint without auth (should fail)
    console.log('1️⃣ Testing POST /api/user/:userId/follow (without auth)');
    try {
      const response = await axios.post(`${BASE_URL}/user/${TEST_SELLER_ID}/follow`);
      console.log('❌ Should have failed but got:', response.status);
    } catch (error) {
      console.log('✅ Correctly returned error:', error.response?.status, error.response?.data?.message);
    }

    // Test 2: Review creation without auth (should fail)
    console.log('\n2️⃣ Testing POST /api/seller/reviews (without auth)');
    try {
      const response = await axios.post(`${BASE_URL}/seller/reviews`, {
        sellerId: TEST_SELLER_ID,
        itemId: '507f1f77bcf86cd799439011',
        itemType: 'Property',
        rating: 5,
        comment: 'Test review without authentication'
      });
      console.log('❌ Should have failed but got:', response.status);
    } catch (error) {
      console.log('✅ Correctly returned error:', error.response?.status, error.response?.data?.message);
    }

    // Test 3: Follow status endpoint without auth (should fail)
    console.log('\n3️⃣ Testing GET /api/user/:userId/follow-status (without auth)');
    try {
      const response = await axios.get(`${BASE_URL}/user/${TEST_SELLER_ID}/follow-status`);
      console.log('❌ Should have failed but got:', response.status);
    } catch (error) {
      console.log('✅ Correctly returned error:', error.response?.status, error.response?.data?.message);
    }

    // Test 4: Public endpoints (should work without auth)
    console.log('\n4️⃣ Testing public endpoints (should work without auth)');
    
    // Test follow stats (public)
    try {
      const response = await axios.get(`${BASE_URL}/seller/users/${TEST_SELLER_ID}/follow-stats`);
      console.log('✅ Follow stats (public):', response.status, response.data);
    } catch (error) {
      console.log('❌ Follow stats failed:', error.response?.status, error.response?.data?.message);
    }

    // Test followers list (public)
    try {
      const response = await axios.get(`${BASE_URL}/seller/users/${TEST_SELLER_ID}/followers`);
      console.log('✅ Followers list (public):', response.status, 'Total followers:', response.data.data?.totalFollowers);
    } catch (error) {
      console.log('❌ Followers list failed:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n🎉 Authentication endpoint testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthEndpoints().catch(console.error);