const mongoose = require('mongoose');
require('dotenv').config();

const Vehicle = require('../src/api/models/vehicleModel');
const User = require('../src/api/models/userModel');

async function checkVehicles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all vehicles
    const vehicles = await Vehicle.find({}).populate('owner', 'firstName lastName email');
    console.log(`\n📊 Total vehicles in database: ${vehicles.length}\n`);

    if (vehicles.length === 0) {
      console.log('❌ No vehicles found in database');
    } else {
      vehicles.forEach((vehicle, index) => {
        console.log(`\n🚗 Vehicle ${index + 1}:`);
        console.log(`   ID: ${vehicle._id}`);
        console.log(`   Title: ${vehicle.title}`);
        console.log(`   Type: ${vehicle.type}`);
        console.log(`   Make: ${vehicle.vehicleDetails?.make}`);
        console.log(`   Model: ${vehicle.vehicleDetails?.model}`);
        console.log(`   Year: ${vehicle.vehicleDetails?.year}`);
        console.log(`   Owner: ${vehicle.owner?.firstName} ${vehicle.owner?.lastName} (${vehicle.owner?.email})`);
        console.log(`   Status: ${vehicle.status}`);
        console.log(`   Images: ${vehicle.media?.images?.length || 0}`);
        console.log(`   Location: ${vehicle.location?.city}, ${vehicle.location?.country}`);
        console.log(`   Created: ${vehicle.createdAt}`);
      });
    }

    // Check users with vehicles
    console.log('\n\n👥 Checking users with vehicles...\n');
    const usersWithVehicles = await User.find({ 
      vehicleListings: { $exists: true, $ne: [] } 
    }).select('firstName lastName email vehicleListings');

    console.log(`Found ${usersWithVehicles.length} users with vehicles`);
    usersWithVehicles.forEach(user => {
      console.log(`   ${user.firstName} ${user.lastName} (${user.email}): ${user.vehicleListings.length} vehicles`);
    });

    // Check the specific user from logs (imen@gmail.com)
    console.log('\n\n🔍 Checking specific user (imen@gmail.com)...\n');
    const specificUser = await User.findOne({ email: 'imen@gmail.com' })
      .populate('vehicleListings');
    
    if (specificUser) {
      console.log(`User: ${specificUser.firstName} ${specificUser.lastName}`);
      console.log(`Interest: ${specificUser.interest}`);
      console.log(`Role: ${specificUser.role}`);
      console.log(`Vehicle listings count: ${specificUser.vehicleListings?.length || 0}`);
      if (specificUser.vehicleListings && specificUser.vehicleListings.length > 0) {
        console.log('Vehicles:');
        specificUser.vehicleListings.forEach(v => {
          console.log(`   - ${v.title} (${v._id})`);
        });
      }
    } else {
      console.log('User not found');
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkVehicles();
