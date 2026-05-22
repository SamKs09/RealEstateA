const mongoose = require('mongoose');
const Vehicle = require('../src/api/models/vehicleModel');
require('dotenv').config();

async function fixVehicleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/realestate', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Find the vehicle with incorrect data
    const vehicle = await Vehicle.findById('69ef44370790170704d6471a');

    if (!vehicle) {
      console.log('❌ Vehicle not found');
      process.exit(1);
    }

    console.log('📋 Current vehicle data:');
    console.log('  Make:', vehicle.vehicleDetails.make);
    console.log('  Model:', vehicle.vehicleDetails.model);
    console.log('  Year:', vehicle.vehicleDetails.year);

    // Fix the data - swap make and model
    const correctMake = vehicle.vehicleDetails.model; // BMW
    const correctModel = vehicle.vehicleDetails.make; // 2022
    const correctYear = vehicle.vehicleDetails.year; // 2026

    vehicle.vehicleDetails.make = correctMake;
    vehicle.vehicleDetails.model = correctModel;
    vehicle.vehicleDetails.year = correctYear;

    await vehicle.save();

    console.log('\n✅ Vehicle data fixed:');
    console.log('  Make:', vehicle.vehicleDetails.make);
    console.log('  Model:', vehicle.vehicleDetails.model);
    console.log('  Year:', vehicle.vehicleDetails.year);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixVehicleData();
