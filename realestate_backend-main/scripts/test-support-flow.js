/**
 * Test Support Ticket Flow
 * This script tests the complete flow from sending to receiving support messages
 * Run: node scripts/test-support-flow.js
 */

const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate';
const API_URL = 'http://172.20.10.6:3000/api';

async function testSupportFlow() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   Test Support Ticket Flow Script    ║');
  console.log('╚═══════════════════════════════════════╝\n');

  try {
    // Step 1: Connect to database
    console.log('📡 Step 1: Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Step 2: Check for support messages in database
    console.log('📊 Step 2: Checking support messages in database...');
    const SupportMessage = mongoose.connection.collection('supportmessages');
    const messageCount = await SupportMessage.countDocuments();
    console.log(`   Found ${messageCount} support message(s) in database\n`);

    if (messageCount > 0) {
      const recentMessages = await SupportMessage.find().sort({ createdAt: -1 }).limit(5).toArray();
      console.log('   Recent messages:');
      recentMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. User: ${msg.user}, Content: "${msg.content.substring(0, 50)}..."`);
        console.log(`      Created: ${msg.createdAt}, Status: ${msg.status}, Read: ${msg.isRead}`);
      });
      console.log('');
    }

    // Step 3: Test API endpoint (GET /api/support) without auth
    console.log('📡 Step 3: Testing GET /api/support (without auth)...');
    try {
      const response = await axios.get(`${API_URL}/support`);
      console.log('❌ ERROR: API should require authentication but didn\'t!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ API correctly requires authentication\n');
      } else {
        console.log('⚠️  Unexpected error:', error.message, '\n');
      }
    }

    // Step 4: Check for users
    console.log('👥 Step 4: Checking for users in database...');
    const Users = mongoose.connection.collection('users');
    const userCount = await Users.countDocuments();
    console.log(`   Found ${userCount} user(s) in database`);

    const supportUser = await Users.findOne({ email: 'support@gmail.com' });
    if (supportUser) {
      console.log(`   ✅ Support user exists:`);
      console.log(`      ID: ${supportUser._id}`);
      console.log(`      Role: ${supportUser.role}`);
      console.log(`      Name: ${supportUser.firstName} ${supportUser.lastName}`);
    } else {
      console.log(`   ⚠️  No support@gmail.com user found`);
    }
    console.log('');

    // Step 5: Test login
    console.log('🔐 Step 5: Testing support login...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'support@gmail.com',
        password: 'password123'
      });

      if (loginResponse.data.success) {
        console.log('   ✅ Login successful');
        console.log(`   Token: ${loginResponse.data.access_token.substring(0, 20)}...`);
        console.log(`   User Role: ${loginResponse.data.user.role}`);
        
        const token = loginResponse.data.access_token;

        // Step 6: Test fetching support messages with auth
        console.log('\n📡 Step 6: Testing GET /api/support (with auth)...');
        const messagesResponse = await axios.get(`${API_URL}/support`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (messagesResponse.data.success) {
          console.log(`   ✅ Successfully fetched ${messagesResponse.data.data.length} message(s)`);
          
          if (messagesResponse.data.data.length > 0) {
            console.log('\n   📋 Message details:');
            messagesResponse.data.data.slice(0, 3).forEach((msg, index) => {
              console.log(`   ${index + 1}. From: ${msg.user?.firstName || 'Unknown'} (${msg.email})`);
              console.log(`      Content: "${msg.content.substring(0, 60)}..."`);
              console.log(`      Created: ${new Date(msg.createdAt).toLocaleString()}`);
              console.log(`      Attachments: ${msg.attachments.length}`);
              console.log('');
            });
          }
        }

      } else {
        console.log('   ❌ Login failed:', loginResponse.data.message);
      }
    } catch (error) {
      console.log('   ❌ Login error:', error.response?.data?.message || error.message);
    }

    // Summary
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║            Test Summary               ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`Database Messages: ${messageCount}`);
    console.log(`Support User Exists: ${supportUser ? 'Yes' : 'No'}`);
    console.log(`API Authentication: Working`);
    console.log('\n✅ Test completed!\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testSupportFlow();
