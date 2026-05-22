/**
 * Messaging API Test Script
 * 
 * This script tests all messaging endpoints
 * Run: node test-messaging-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://172.20.10.6:3000/api';

// Test user tokens - You need to replace these with actual tokens
let USER1_TOKEN = '';
let USER2_TOKEN = '';
let SUPPORT_TOKEN = '';

// Test data storage
let testThreadId = '';
let testMessageId = '';
let supportThreadId = '';

/**
 * Color output helpers
 */
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Helper function to make API requests
 */
async function apiRequest(method, endpoint, token, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

/**
 * Test 1: Login users to get tokens
 */
async function testLogin() {
  logInfo('TEST 1: Login users to get authentication tokens');
  
  try {
    // You need to provide valid user credentials here
    logWarning('Please manually set USER1_TOKEN, USER2_TOKEN, and SUPPORT_TOKEN variables');
    logWarning('You can get tokens by logging in through the auth endpoint');
    
    // Example login code (uncomment and add real credentials):
    /*
    const user1Login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'user1@example.com',
      password: 'password123'
    });
    USER1_TOKEN = user1Login.data.token;
    
    const user2Login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'user2@example.com',
      password: 'password123'
    });
    USER2_TOKEN = user2Login.data.token;
    
    const supportLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'support@example.com',
      password: 'password123'
    });
    SUPPORT_TOKEN = supportLogin.data.token;
    */
    
    return false; // Return false to skip tests until tokens are set
  } catch (error) {
    logError(`Login failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Create a support thread
 */
async function testCreateSupportThread() {
  logInfo('\nTEST 2: Create/Get support thread');
  
  const result = await apiRequest('POST', '/messages/support/thread', USER1_TOKEN, {
    category: 'general'
  });
  
  if (result.success) {
    supportThreadId = result.data.data._id;
    logSuccess(`Support thread created/retrieved: ${supportThreadId}`);
    console.log('Thread details:', JSON.stringify(result.data.data, null, 2));
    return true;
  } else {
    logError(`Failed to create support thread: ${JSON.stringify(result.error)}`);
    return false;
  }
}

/**
 * Test 3: Create a user-to-user thread
 */
async function testCreateUserThread() {
  logInfo('\nTEST 3: Create user-to-user thread');
  
  // You need to provide actual user IDs
  const userId2 = 'USER_ID_HERE'; // Replace with actual user ID
  
  const result = await apiRequest('POST', '/messages/threads', USER1_TOKEN, {
    participantIds: [userId2],
    type: 'user_to_user',
    subject: 'Test Property Inquiry',
    category: 'property_inquiry',
    priority: 'medium'
  });
  
  if (result.success) {
    testThreadId = result.data.data._id;
    logSuccess(`User thread created: ${testThreadId}`);
    console.log('Thread details:', JSON.stringify(result.data.data, null, 2));
    return true;
  } else {
    logError(`Failed to create user thread: ${JSON.stringify(result.error)}`);
    return false;
  }
}

/**
 * Test 4: Send a text message
 */
async function testSendMessage() {
  logInfo('\nTEST 4: Send text message');
  
  if (!supportThreadId) {
    logWarning('Skipping: No thread ID available');
    return false;
  }
  
  const result = await apiRequest('POST', `/messages/threads/${supportThreadId}/messages`, USER1_TOKEN, {
    type: 'text',
    content: {
      text: 'Hello! This is a test message from the automated test script.'
    }
  });
  
  if (result.success) {
    testMessageId = result.data.data._id;
    logSuccess(`Message sent: ${testMessageId}`);
    console.log('Message details:', JSON.stringify(result.data.data, null, 2));
    return true;
  } else {
    logError(`Failed to send message: ${JSON.stringify(result.error)}`);
    return false;
  }
}

/**
 * Test 5: Get thread messages
 */
async function testGetMessages() {
  logInfo('\nTEST 5: Get thread messages');
  
  if (!supportThreadId) {
    logWarning('Skipping: No thread ID available');
    return false;
  }
  
  const result = await apiRequest('GET', `/messages/threads/${supportThreadId}/messages?limit=20`, USER1_TOKEN);
  
  if (result.success) {
    logSuccess(`Retrieved ${result.data.data.length} messages`);
    console.log('Messages:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    logError(`Failed to get messages: ${JSON.stringify(result.error)}`);
    return false;
  }
}

/**
 * Test 6: Get user threads
 */
async function testGetUserThreads() {
  logInfo('\nTEST 6: Get user threads');
  
  const result = await apiRequest('GET', '/messages/threads?limit=10', USER1_TOKEN);
  
  if (result.success) {
    logSuccess(`Retrieved ${result.data.data.length} threads`);
    console.log('Threads:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    logError(`Failed to get threads: ${JSON.stringify(result.error)}`);
    return false;
  }
}

/**
 * Test 7: Mark thread as read
 */
async function testMarkAsRead() {
  logInfo('\nTEST 7: Mark thread as read');
  
  if (!supportThreadId) {
    logWarning('Skipping: No thread ID available');
    return false;
  }
  
  const result = await apiRequest('POST', `/messages/threads/${supportThreadId}/read`, USER1_TOKEN);
  
  if (result.success) {
    logSuccess('Thread marked as read');
    console.log('Result:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    logError(`Failed to mark as read: ${JSON.stringify(result.error)}`);
    return false;
  }
}

/**
 * Test 8: Get unread count
 */
async function testGetUnreadCount() {
  logInfo('\nTEST 8: Get unread count');
  
  const result = await apiRequest('GET', '/messages/unread/count', USER1_TOKEN);
  
  if (result.success) {
    logSuccess('Unread count retrieved');
    console.log('Unread count:', JSON.stringify(result.data.data, null, 2));
    return true;
  } else {
    logError(`Failed to get unread count: ${JSON.stringify(result.error)}`);
    return false;
  }
}

/**
 * Test 9: Search messages
 */
async function testSearchMessages() {
  logInfo('\nTEST 9: Search messages');
  
  const result = await apiRequest('GET', '/messages/search?q=test&limit=10', USER1_TOKEN);
  
  if (result.success) {
    logSuccess(`Found ${result.data.data.length} matching messages`);
    console.log('Search results:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    logError(`Failed to search messages: ${JSON.stringify(result.error)}`);
    return false;
  }
}

/**
 * Test 10: Edit message
 */
async function testEditMessage() {
  logInfo('\nTEST 10: Edit message');
  
  if (!testMessageId) {
    logWarning('Skipping: No message ID available');
    return false;
  }
  
  const result = await apiRequest('PATCH', `/messages/${testMessageId}`, USER1_TOKEN, {
    content: 'This is an EDITED test message.'
  });
  
  if (result.success) {
    logSuccess('Message edited successfully');
    console.log('Edited message:', JSON.stringify(result.data.data, null, 2));
    return true;
  } else {
    logError(`Failed to edit message: ${JSON.stringify(result.error)}`);
    return false;
  }
}

/**
 * Test 11: Get support statistics (requires support role)
 */
async function testGetSupportStats() {
  logInfo('\nTEST 11: Get support statistics');
  
  if (!SUPPORT_TOKEN) {
    logWarning('Skipping: No support token available');
    return false;
  }
  
  const result = await apiRequest('GET', '/messages/support/stats', SUPPORT_TOKEN);
  
  if (result.success) {
    logSuccess('Support statistics retrieved');
    console.log('Statistics:', JSON.stringify(result.data.data, null, 2));
    return true;
  } else {
    logError(`Failed to get support stats: ${JSON.stringify(result.error)}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  log('\n========================================', 'blue');
  log('  MESSAGING API TEST SUITE', 'blue');
  log('========================================\n', 'blue');
  
  // Check if tokens are set
  const hasTokens = await testLogin();
  
  if (!hasTokens && !USER1_TOKEN) {
    log('\n========================================', 'yellow');
    logWarning('Please set authentication tokens in the script before running tests');
    logWarning('You need to:');
    logWarning('1. Create test users in your database');
    logWarning('2. Login via /api/auth/login to get tokens');
    logWarning('3. Set USER1_TOKEN, USER2_TOKEN, SUPPORT_TOKEN in this script');
    log('========================================\n', 'yellow');
    return;
  }
  
  // Run tests sequentially
  const tests = [
    testCreateSupportThread,
    testSendMessage,
    testGetMessages,
    testGetUserThreads,
    testMarkAsRead,
    testGetUnreadCount,
    testSearchMessages,
    testEditMessage,
    testCreateUserThread, // This might fail if user IDs not set
    testGetSupportStats
  ];
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result === true) passed++;
      else if (result === false && result !== undefined) failed++;
      else skipped++;
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logError(`Test error: ${error.message}`);
      failed++;
    }
  }
  
  // Summary
  log('\n========================================', 'blue');
  log('  TEST SUMMARY', 'blue');
  log('========================================', 'blue');
  logSuccess(`Passed: ${passed}`);
  logError(`Failed: ${failed}`);
  logWarning(`Skipped: ${skipped}`);
  log('========================================\n', 'blue');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testCreateSupportThread,
  testSendMessage,
  testGetMessages,
  testGetUserThreads
};
