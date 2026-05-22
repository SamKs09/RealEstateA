const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../src/api/models/userModel');
const Property = require('../src/api/models/propertyModel');
const Vehicle = require('../src/api/models/vehicleModel');
const Follow = require('../src/api/models/followModel');
const SellerReview = require('../src/api/models/sellerReviewModel');

// Import services
const profileService = require('../src/api/services/profileService');
const followService = require('../src/api/services/followService');
const reviewService = require('../src/api/services/reviewService');

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/realestate';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function testSellerProfileAPI() {
  console.log('\n🧪 Testing Seller Profile API...\n');

  try {
    // Find a user to test with
    const testUser = await User.findOne({ role: 'seller' }).limit(1);
    if (!testUser) {
      console.log('❌ No seller user found in database');
      return;
    }

    console.log(`📋 Testing with seller: ${testUser.fullName || testUser.firstName} (ID: ${testUser._id})`);

    // Test 1: Get seller profile
    console.log('\n1️⃣ Testing getSellerProfile...');
    try {
      const profile = await profileService.getSellerProfile(testUser._id.toString());
      console.log('✅ Profile retrieved successfully');
      console.log(`   Name: ${profile.name}`);
      console.log(`   Followers: ${profile.statistics.followers}`);
      console.log(`   Rating: ${profile.statistics.rating}`);
      console.log(`   Sold/Rent: ${profile.statistics.soldRent}`);
    } catch (error) {
      console.log('❌ Profile retrieval failed:', error.message);
    }

    // Test 2: Get seller listings
    console.log('\n2️⃣ Testing getSellerListings...');
    try {
      const listings = await profileService.getSellerListings(testUser._id.toString(), 1, 10);
      console.log('✅ Listings retrieved successfully');
      console.log(`   Total listings: ${listings.totalListings}`);
      console.log(`   Current page: ${listings.currentPage}`);
    } catch (error) {
      console.log('❌ Listings retrieval failed:', error.message);
    }

    // Test 3: Test follow functionality (need another user)
    const anotherUser = await User.findOne({ _id: { $ne: testUser._id } }).limit(1);
    if (anotherUser) {
      console.log('\n3️⃣ Testing follow functionality...');
      try {
        // Test follow
        const followResult = await followService.followUser(anotherUser._id.toString(), testUser._id.toString());
        console.log('✅ Follow operation successful');
        console.log(`   Follower count: ${followResult.followerCount}`);

        // Test follow status
        const status = await followService.getFollowStatus(anotherUser._id.toString(), testUser._id.toString());
        console.log('✅ Follow status retrieved');
        console.log(`   Is following: ${status.isFollowing}`);

        // Test unfollow
        const unfollowResult = await followService.unfollowUser(anotherUser._id.toString(), testUser._id.toString());
        console.log('✅ Unfollow operation successful');
        console.log(`   Follower count: ${unfollowResult.followerCount}`);
      } catch (error) {
        console.log('❌ Follow functionality failed:', error.message);
      }
    }

    // Test 4: Test review functionality
    console.log('\n4️⃣ Testing review functionality...');
    try {
      // Get reviewable items
      const items = await reviewService.getReviewableItems(testUser._id.toString());
      console.log('✅ Reviewable items retrieved');
      console.log(`   Available items: ${items.length}`);

      if (items.length > 0 && anotherUser) {
        // Create a test review
        const reviewData = {
          reviewerId: anotherUser._id.toString(),
          sellerId: testUser._id.toString(),
          itemId: items[0].id,
          itemType: items[0].type === 'property' ? 'Property' : 'Vehicle',
          rating: 4,
          comment: 'This is a test review for the seller profile API testing.'
        };

        try {
          const reviewResult = await reviewService.createReview(reviewData);
          console.log('✅ Review created successfully');
          console.log(`   Review ID: ${reviewResult.review._id}`);

          // Get seller reviews
          const reviews = await reviewService.getSellerReviews(testUser._id.toString(), 1, 10);
          console.log('✅ Seller reviews retrieved');
          console.log(`   Total reviews: ${reviews.pagination.totalReviews}`);

          // Clean up - delete the test review
          await reviewService.deleteReview(reviewResult.review._id, anotherUser._id.toString());
          console.log('✅ Test review cleaned up');
        } catch (reviewError) {
          console.log('⚠️ Review test failed (might be duplicate):', reviewError.message);
        }
      }
    } catch (error) {
      console.log('❌ Review functionality failed:', error.message);
    }

    console.log('\n🎉 Seller Profile API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function main() {
  await connectDB();
  await testSellerProfileAPI();
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main().catch(console.error);