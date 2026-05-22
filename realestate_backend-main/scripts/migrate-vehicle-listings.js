const mongoose = require('mongoose');
require('dotenv').config();

const Vehicle = require('../src/api/models/vehicleModel');
const User = require('../src/api/models/userModel');

async function migrateVehicleListings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all vehicles
    const vehicles = await Vehicle.find({});
    console.log(`\n📊 Found ${vehicles.length} vehicles to migrate\n`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const vehicle of vehicles) {
      try {
        const ownerId = vehicle.owner;
        
        // Check if vehicle is already in user's vehicleListings
        const user = await User.findById(ownerId);
        
        if (!user) {
          console.log(`⚠️  Owner not found for vehicle ${vehicle._id} (${vehicle.title})`);
          errorCount++;
          continue;
        }

        const alreadyExists = user.vehicleListings.some(
          id => id.toString() === vehicle._id.toString()
        );

        if (alreadyExists) {
          console.log(`✓ Vehicle ${vehicle._id} (${vehicle.title}) already in user's listings`);
          continue;
        }

        // Add vehicle to user's vehicleListings
        await User.findByIdAndUpdate(
          ownerId,
          { $push: { vehicleListings: vehicle._id } },
          { new: true }
        );

        console.log(`✅ Added vehicle ${vehicle._id} (${vehicle.title}) to ${user.firstName} ${user.lastName}'s listings`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error migrating vehicle ${vehicle._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n\n📊 Migration Summary:`);
    console.log(`   Total vehicles: ${vehicles.length}`);
    console.log(`   Successfully migrated: ${migratedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Already existed: ${vehicles.length - migratedCount - errorCount}`);

    // Verify the migration
    console.log('\n\n🔍 Verifying migration...\n');
    const usersWithVehicles = await User.find({ 
      vehicleListings: { $exists: true, $ne: [] } 
    }).select('firstName lastName email vehicleListings');

    console.log(`Found ${usersWithVehicles.length} users with vehicles:`);
    for (const user of usersWithVehicles) {
      console.log(`   ${user.firstName} ${user.lastName} (${user.email}): ${user.vehicleListings.length} vehicles`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Migration complete');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateVehicleListings();
