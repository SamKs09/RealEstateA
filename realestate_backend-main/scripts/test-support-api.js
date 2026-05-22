/**
 * Test Support Dashboard API
 * This tests if the support endpoints are working
 */

const axios = require('axios');

const BASE_URL = 'http://172.20.10.6:3000/api';

async function testSupportAPI() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Test Support Dashboard API           ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // First, try to get support messages without auth
    console.log('1️⃣ Testing GET /api/support without authentication...');
    try {
      const response = await axios.get(`${BASE_URL}/support`);
      console.log('✅ Status:', response.status);
      console.log('✅ Response:', response.data);
      console.log(`📊 Found ${response.data.data?.length || 0} tickets\n`);
      
      if (response.data.data && response.data.data.length > 0) {
        console.log('📋 Sample ticket:');
        console.log(JSON.stringify(response.data.data[0], null, 2));
      }
    } catch (error) {
      if (error.response) {
        console.log('❌ Status:', error.response.status);
        console.log('❌ Error:', error.response.data);
        console.log('⚠️  Authentication required!\n');
      } else {
        console.log('❌ Network error:', error.message, '\n');
      }
    }

    // Try to login and get token
    console.log('2️⃣ Testing login with support@gmail.com...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'support@gmail.com',
        password: 'password123'
      });
      
      console.log('✅ Login successful!');
      const token = loginResponse.data.access_token;
      console.log('🔑 Token:', token.substring(0, 50) + '...\n');

      // Now try with authentication
      console.log('3️⃣ Testing GET /api/support WITH authentication...');
      const authResponse = await axios.get(`${BASE_URL}/support`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Status:', authResponse.status);
      console.log(`✅ Found ${authResponse.data.data?.length || 0} support tickets\n`);
      
      if (authResponse.data.data && authResponse.data.data.length > 0) {
        console.log('📋 Tickets:');
        authResponse.data.data.forEach((ticket, index) => {
          console.log(`\n${index + 1}. From: ${ticket.user?.firstName} ${ticket.user?.lastName}`);
          console.log(`   Email: ${ticket.email}`);
          console.log(`   Message: ${ticket.content.substring(0, 50)}...`);
          console.log(`   Attachments: ${ticket.attachments?.length || 0}`);
          console.log(`   Status: ${ticket.status}`);
          console.log(`   Read: ${ticket.isRead}`);
          console.log(`   Created: ${ticket.createdAt}`);
        });
      } else {
        console.log('⚠️  No tickets found in database!');
        console.log('📝 Try sending a test message from the mobile app.');
      }

    } catch (error) {
      if (error.response) {
        console.log('❌ Status:', error.response.status);
        console.log('❌ Error:', error.response.data);
      } else {
        console.log('❌ Network error:', error.message);
      }
    }

    console.log('\n✅ Test complete!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

testSupportAPI();
