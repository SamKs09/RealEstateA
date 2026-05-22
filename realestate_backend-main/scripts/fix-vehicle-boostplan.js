require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../src/api/models/vehicleModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/RealEstate';

async function fixBoostPlan() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔗 Connected to MongoDB');

    // Find all vehicles with boostPlan set to null
    const result = await Vehicle.updateMany(
      { boostPlan: null },
      { $unset: { boostPlan: '' } }
    );

    console.log(`✅ Fixed ${result.modifiedCount} vehicles with null boostPlan`);

    await mongoose.disconnect();
    console.log('✅ Done! Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixBoostPlan();
