/**
 * Test Script: Messaging API
 * 
 * Tests the new messaging endpoints for the live chat system
 */

require("dotenv").config();
const axios = require("axios");

const API_URL = "http://172.20.10.6:3000/api";

// Support user credentials
const SUPPORT_EMAIL = "support@gmail.com";
const SUPPORT_PASSWORD = "password123";

let authToken = null;

async function login() {
  try {
    console.log("🔐 Logging in as support user...");
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: SUPPORT_EMAIL,
      password: SUPPORT_PASSWORD,
    });

    authToken = response.data.access_token || response.data.accessToken;
    console.log("✅ Login successful");
    if (authToken) {
      console.log(`   Token: ${authToken.substring(0, 30)}...`);
    } else {
      console.log("   Response:", JSON.stringify(response.data, null, 2));
    }
    return !!authToken;
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
    return false;
  }
}

async function getThreadStats() {
  try {
    console.log("\n📊 Fetching thread statistics...");
    const response = await axios.get(`${API_URL}/messages/threads/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log("✅ Thread Stats:");
    console.log(`   Total: ${response.data.data.total}`);
    console.log(`   Active: ${response.data.data.active}`);
    console.log(`   Unassigned: ${response.data.data.unassigned}`);
    console.log(`   Closed: ${response.data.data.closed}`);
    console.log(`   Open: ${response.data.data.open}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching stats:", error.response?.data || error.message);
  }
}

async function getAllThreads() {
  try {
    console.log("\n📋 Fetching all threads...");
    const response = await axios.get(`${API_URL}/messages/threads`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log(`✅ Found ${response.data.data.length} threads`);
    response.data.data.slice(0, 3).forEach((thread, i) => {
      console.log(`\n   Thread ${i + 1}:`);
      console.log(`   ID: ${thread._id}`);
      console.log(`   User: ${thread.user?.firstName} ${thread.user?.lastName}`);
      console.log(`   Subject: ${thread.subject}`);
      console.log(`   Status: ${thread.status}`);
      console.log(`   Unread (Support): ${thread.unreadCount?.support || 0}`);
      console.log(`   Last Message: ${thread.lastMessage?.text?.substring(0, 50)}...`);
    });
    
    return response.data.data;
  } catch (error) {
    console.error("❌ Error fetching threads:", error.response?.data || error.message);
  }
}

async function getUnassignedThreads() {
  try {
    console.log("\n🆕 Fetching unassigned threads...");
    const response = await axios.get(`${API_URL}/messages/threads?status=unassigned`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log(`✅ Found ${response.data.data.length} unassigned threads`);
    return response.data.data;
  } catch (error) {
    console.error("❌ Error fetching unassigned threads:", error.response?.data || error.message);
  }
}

async function getThreadDetails(threadId) {
  try {
    console.log(`\n💬 Fetching thread details: ${threadId}`);
    const response = await axios.get(`${API_URL}/messages/threads/${threadId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const thread = response.data.data.thread;
    const messages = response.data.data.messages;

    console.log("✅ Thread Details:");
    console.log(`   User: ${thread.user.firstName} ${thread.user.lastName} (${thread.user.email})`);
    console.log(`   Subject: ${thread.subject}`);
    console.log(`   Status: ${thread.status}`);
    console.log(`   Created: ${new Date(thread.createdAt).toLocaleString()}`);
    console.log(`\n   Messages (${messages.length}):`);
    
    messages.forEach((msg, i) => {
      const sender = msg.sender.userId ? 
        `${msg.sender.userId.firstName} (${msg.sender.role})` : 
        msg.sender.role;
      console.log(`   ${i + 1}. [${msg.type}] ${sender}: ${msg.content.text?.substring(0, 40)}...`);
    });

    return response.data.data;
  } catch (error) {
    console.error("❌ Error fetching thread details:", error.response?.data || error.message);
  }
}

async function sendReply(threadId, replyText) {
  try {
    console.log(`\n📤 Sending reply to thread ${threadId}...`);
    const response = await axios.post(
      `${API_URL}/messages/threads/${threadId}/messages`,
      {
        type: "text",
        content: { text: replyText },
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log("✅ Reply sent successfully!");
    console.log(`   Message ID: ${response.data.data._id}`);
    return response.data.data;
  } catch (error) {
    console.error("❌ Error sending reply:", error.response?.data || error.message);
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("🧪 TESTING MESSAGING API");
  console.log("=".repeat(60));

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log("\n❌ Cannot proceed without authentication");
    return;
  }

  // Step 2: Get stats
  await getThreadStats();

  // Step 3: Get all threads
  const threads = await getAllThreads();

  // Step 4: Get unassigned threads
  const unassignedThreads = await getUnassignedThreads();

  // Step 5: Get details of first thread
  if (threads && threads.length > 0) {
    const firstThread = threads[0];
    await getThreadDetails(firstThread._id);

    // Step 6: Send a test reply
    await sendReply(firstThread._id, "Hello! This is a test reply from the support team. How can we help you today?");

    // Step 7: Get thread details again to see the new message
    console.log("\n🔄 Fetching thread again to verify reply...");
    await getThreadDetails(firstThread._id);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ ALL TESTS COMPLETE!");
  console.log("=".repeat(60));
}

// Run the tests
runTests();
