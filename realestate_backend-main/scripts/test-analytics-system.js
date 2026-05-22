const mongoose = require('mongoose');
require('dotenv').config();

const Vehicle = require('../src/api/models/vehicleModel');
const Property = require('../src/api/models/propertyModel');
const Analytics = require('../src/api/models/analyticsModel');

async function testAnalyticsSystem() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env file');
      return;
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Find a real vehicle
    console.log('📋 Test 1: Finding a real vehicle...');
    const vehicle = await Vehicle.findOne().limit(1);
    
    if (!vehicle) {
      console.log('❌ No vehicles found in database');
      return;
    }
    
    console.log(`✅ Found vehicle: ${vehicle._id}`);
    console.log(`   Title: ${vehicle.title}`);
    console.log(`   Owner: ${vehicle.owner}`);
    console.log('');

    // Test 2: Check if analytics exists
    console.log('📋 Test 2: Checking if analytics exists...');
    let analytics = await Analytics.findOne({
      listingId: vehicle._id,
      listingType: 'Vehicle'
    });
    
    if (analytics) {
      console.log(`✅ Analytics exists: ${analytics._id}`);
      console.log(`   Total Views: ${analytics.totalViews}`);
      console.log(`   Total Saves: ${analytics.totalSaves}`);
      console.log(`   Total Inquiries: ${analytics.totalInquiries}`);
    } else {
      console.log('⚠️  No analytics found - will be auto-created');
    }
    console.log('');

    // Test 3: Use getOrCreate method
    console.log('📋 Test 3: Testing getOrCreate method...');
    analytics = await Analytics.getOrCreate(
      vehicle._id,
      'Vehicle',
      vehicle.owner
    );
    
    console.log(`✅ Analytics retrieved/created: ${analytics._id}`);
    console.log(`   Listing ID: ${analytics.listingId}`);
    console.log(`   Listing Type: ${analytics.listingType}`);
    console.log(`   Seller ID: ${analytics.sellerId}`);
    console.log(`   Total Views: ${analytics.totalViews}`);
    console.log('');

    // Test 4: Test weekly views method
    console.log('📋 Test 4: Testing getWeeklyViews method...');
    const weeklyViews = analytics.getWeeklyViews();
    console.log(`✅ Weekly views: [${weeklyViews.join(', ')}]`);
    console.log('');

    // Test 5: Test recent inquiries method
    console.log('📋 Test 5: Testing getRecentInquiries method...');
    const recentInquiries = await analytics.getRecentInquiries(10);
    console.log(`✅ Recent inquiries count: ${recentInquiries.length}`);
    console.log('');

    // Test 6: Find a real property
    console.log('📋 Test 6: Finding a real property...');
    const property = await Property.findOne().limit(1);
    
    if (property) {
      console.log(`✅ Found property: ${property._id}`);
      console.log(`   Title: ${property.title}`);
      console.log(`   Owner: ${property.owner}`);
      
      // Test property analytics
      console.log('\n📋 Test 7: Testing property analytics...');
      const propertyAnalytics = await Analytics.getOrCreate(
        property._id,
        'Property',
        property.owner
      );
      
      console.log(`✅ Property analytics: ${propertyAnalytics._id}`);
      console.log(`   Total Views: ${propertyAnalytics.totalViews}`);
    } else {
      console.log('⚠️  No properties found in database');
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('\n📝 Test Results:');
    console.log(`   Vehicle ID for testing: ${vehicle._id}`);
    console.log(`   Analytics ID: ${analytics._id}`);
    console.log(`   API endpoint to test: GET /api/analytics/listing/${vehicle._id}?listingType=vehicle`);
    console.log('');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testAnalyticsSystem();
