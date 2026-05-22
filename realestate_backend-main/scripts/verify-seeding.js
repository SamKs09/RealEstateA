const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/api/models/userModel');
const Property = require('../src/api/models/propertyModel');
const Vehicle = require('../src/api/models/vehicleModel');

const verify = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/realestate', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('=== DATABASE VERIFICATION ===\n');

        // Count summary
        const totalUsers = await User.countDocuments();
        const buyers = await User.countDocuments({ role: 'client' });
        const sellers = await User.countDocuments({ role: 'seller' });
        const totalProps = await Property.countDocuments();
        const totalVehicles = await Vehicle.countDocuments();

        console.log('📊 COUNTS:');
        console.log('  Total users:', totalUsers);
        console.log('  - Buyers (clients):', buyers);
        console.log('  - Sellers:', sellers);
        console.log('  Total properties:', totalProps);
        console.log('  Total vehicles:', totalVehicles);

        // User distribution
        console.log('\n👥 USER DISTRIBUTION:\n');

        const buyerUsers = await User.find({ role: 'client' }).select('email firstName lastName interest');
        console.log('BUYERS (clients):');
        buyerUsers.forEach(u => console.log(`  - ${u.email} | ${u.firstName} ${u.lastName} | Interest: ${u.interest}`));

        const sellerUsers = await User.find({ role: 'seller', interest: { $ne: 'both' } }).select('email firstName lastName interest');
        console.log('\nSELLERS:');
        sellerUsers.forEach(u => console.log(`  - ${u.email} | ${u.firstName} ${u.lastName} | Interest: ${u.interest}`));

        const bothUsers = await User.find({ interest: 'both' }).select('email firstName lastName interest propertyListings vehicleListings');
        console.log('\nBOTH (Buyers & Sellers):');
        bothUsers.forEach(u => console.log(`  - ${u.email} | ${u.firstName} ${u.lastName} | Props: ${u.propertyListings.length}, Vehicles: ${u.vehicleListings.length}`));

        // Sample property
        console.log('\n🏠 SAMPLE PROPERTY:');
        const sampleProp = await Property.findOne().populate('owner', 'email firstName lastName');
        if (sampleProp) {
            console.log(`  Title: ${sampleProp.title}`);
            console.log(`  Location: ${sampleProp.location.city}, ${sampleProp.location.state}`);
            console.log(`  Price: ${sampleProp.price?.amount || sampleProp.price || 'N/A'} ${sampleProp.price?.currency || ''}`);
            console.log(`  Type: ${sampleProp.propertyType}`);
            console.log(`  Owner: ${sampleProp.owner?.email || 'N/A'}`);
        }

        // Sample vehicle
        console.log('\n🚗 SAMPLE VEHICLE:');
        const sampleVehicle = await Vehicle.findOne().populate('owner', 'email firstName lastName');
        if (sampleVehicle) {
            console.log(`  Title: ${sampleVehicle.title}`);
            console.log(`  Make/Model: ${sampleVehicle.vehicleDetails.make} ${sampleVehicle.vehicleDetails.model}`);
            console.log(`  Year: ${sampleVehicle.vehicleDetails.year}`);
            console.log(`  Price: ${sampleVehicle.price?.amount || sampleVehicle.price || 'N/A'} ${sampleVehicle.price?.currency || ''}`);
            console.log(`  Condition: ${sampleVehicle.vehicleDetails.condition}`);
            console.log(`  Owner: ${sampleVehicle.owner?.email || 'N/A'}`);
        }

        console.log('\n✅ Verification complete!');
        console.log('\n📝 Sample login credentials:');
        console.log('   Buyer: buyer1@gmail.com / password123');
        console.log('   Seller: seller1@gmail.com / password123');
        console.log('   Both: both1@gmail.com / password123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Verification error:', error.message);
        process.exit(1);
    }
};

verify();
