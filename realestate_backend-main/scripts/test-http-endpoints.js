const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test seller ID from our previous test
const TEST_SELLER_ID = '6913043cabe0ab7e14181d62';

async function testEndpoints() {
  console.log('🧪 Testing HTTP Endpoints...\n');

  try {
    // Test 1: Get seller profile
    console.log('1️⃣ Testing GET /api/seller/:sellerId/profile');
    try {
      const response = await axios.get(`${BASE_URL}/seller/${TEST_SELLER_ID}/profile`);
      console.log('✅ Status:', response.status);
      console.log('✅ Profile data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 2: Get seller listings
    console.log('\n2️⃣ Testing GET /api/seller/:sellerId/listings');
    try {
      const response = await axios.get(`${BASE_URL}/seller/${TEST_SELLER_ID}/listings?page=1&limit=5`);
      console.log('✅ Status:', response.status);
      console.log('✅ Listings count:', response.data.data.totalListings);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 3: Get seller reviews
    console.log('\n3️⃣ Testing GET /api/seller/:sellerId/reviews');
    try {
      const response = await axios.get(`${BASE_URL}/seller/${TEST_SELLER_ID}/reviews?page=1&limit=10`);
      console.log('✅ Status:', response.status);
      console.log('✅ Reviews count:', response.data.data.pagination.totalReviews);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 4: Get seller rating
    console.log('\n4️⃣ Testing GET /api/seller/:sellerId/rating');
    try {
      const response = await axios.get(`${BASE_URL}/seller/${TEST_SELLER_ID}/rating`);
      console.log('✅ Status:', response.status);
      console.log('✅ Rating data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 5: Get reviewable items
    console.log('\n5️⃣ Testing GET /api/seller/:sellerId/reviewable-items');
    try {
      const response = await axios.get(`${BASE_URL}/seller/${TEST_SELLER_ID}/reviewable-items`);
      console.log('✅ Status:', response.status);
      console.log('✅ Reviewable items count:', response.data.data.length);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 6: Test invalid seller ID
    console.log('\n6️⃣ Testing invalid seller ID');
    try {
      const response = await axios.get(`${BASE_URL}/seller/invalid-id/profile`);
      console.log('❌ Should have failed but got:', response.status);
    } catch (error) {
      console.log('✅ Correctly returned error:', error.response?.status, error.response?.data?.message);
    }

    // Test 7: Test non-existent seller
    console.log('\n7️⃣ Testing non-existent seller');
    try {
      const response = await axios.get(`${BASE_URL}/seller/507f1f77bcf86cd799439011/profile`);
      console.log('❌ Should have failed but got:', response.status);
    } catch (error) {
      console.log('✅ Correctly returned error:', error.response?.status, error.response?.data?.message);
    }

    console.log('\n🎉 HTTP Endpoint testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndpoints().catch(console.error);