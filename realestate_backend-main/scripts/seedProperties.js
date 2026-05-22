const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// We will import faker dynamically inside runSeed
let faker, fakerAR, fakerFR, fakerEN;

const connectDB = require('../config/db');
const Property = require('../src/api/models/propertyModel');
const User = require('../src/api/models/userModel');

// Configuration
const NUM_USERS = 8;
const NUM_PROPERTIES = 30;

// Tunisian Cities and their approximate coordinates
const TUNISIAN_LOCATIONS = [
    { city: 'Tunis', state: 'Tunis', lat: 36.8065, lng: 10.1815 },
    { city: 'La Marsa', state: 'Tunis', lat: 36.8778, lng: 10.3248 },
    { city: 'Carthage', state: 'Tunis', lat: 36.8525, lng: 10.3233 },
    { city: 'Sidi Bou Said', state: 'Tunis', lat: 36.8700, lng: 10.3400 },
    { city: 'Gammarth', state: 'Tunis', lat: 36.9100, lng: 10.2800 },
    { city: 'Sousse', state: 'Sousse', lat: 35.8256, lng: 10.6369 },
    { city: 'Hammamet', state: 'Nabeul', lat: 36.4000, lng: 10.6167 },
    { city: 'Monastir', state: 'Monastir', lat: 35.7780, lng: 10.8262 },
    { city: 'Sfax', state: 'Sfax', lat: 34.7400, lng: 10.7600 },
    { city: 'Nabeul', state: 'Nabeul', lat: 36.4561, lng: 10.7376 },
    { city: 'Bizerte', state: 'Bizerte', lat: 37.2744, lng: 9.8739 },
    { city: 'Ariana', state: 'Ariana', lat: 36.8625, lng: 10.1956 },
    { city: 'Ben Arous', state: 'Ben Arous', lat: 36.7531, lng: 10.2222 },
    { city: 'Ezzahra', state: 'Ben Arous', lat: 36.7444, lng: 10.3078 },
    { city: 'Tabarka', state: 'Jendouba', lat: 36.9544, lng: 8.7578 },
];

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'hotel', 'commercial', 'land', 'office'];
const AMENITIES_LIST = [
    'Swimming Pool', 'Sea View', 'Garden', 'Security 24/7', 'Parking',
    'Gym', 'Elevator', 'Air Conditioning', 'Central Heating', 'Balcony',
    'Terrace', 'Furnished', 'High Speed Internet', 'Fireplace', 'Modern Kitchen'
];

const FEATURES_LIST = [
    'Luxury Finish', 'Pet Friendly', 'Close to Beach', 'Quiet Area',
    'Near Public Transport', 'Investment Opportunity', 'New Development', 'Mountain View'
];

// Media paths (relative to server root as served via /uploads)
const IMAGES_DIR = path.join(__dirname, '../src/api/uploads/properties/images');
const VIDEOS_DIR = path.join(__dirname, '../src/api/uploads/properties/videos');

/**
 * Get available media files from the project directories
 */
const getAvailableMedia = () => {
    const images = fs.existsSync(IMAGES_DIR) ? fs.readdirSync(IMAGES_DIR).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i)) : [];
    const videos = fs.existsSync(VIDEOS_DIR) ? fs.readdirSync(VIDEOS_DIR).filter(f => f.match(/\.(mp4|mov|avi)$/i)) : [];
    return { images, videos };
};

/**
 * Seed Users
 */
const seedUsers = async () => {
    console.log('👤 Seeding users...');
    const users = [];

    // Create some specific test users
    for (let i = 0; i < NUM_USERS; i++) {
        const firstName = fakerEN.person.firstName();
        const lastName = fakerEN.person.lastName();
        users.push({
            email: fakerEN.internet.email({ firstName, lastName }),
            password: '$2b$10$YourHashedPasswordHere', // placeholder, bcrypt usually used
            userName: fakerEN.internet.username({ firstName, lastName }),
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            phoneNumber: fakerEN.phone.number(),
            role: i === 0 ? ['admin'] : ['seller'],
            isActive: true,
            profileCompleted: true
        });
    }

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users.`);
    return createdUsers;
};

/**
 * Generate a single property
 */
const generateProperty = (ownerId, mediaFiles) => {
    const location = fakerEN.helpers.arrayElement(TUNISIAN_LOCATIONS);
    const type = fakerEN.helpers.arrayElement(PROPERTY_TYPES);
    const listingType = fakerEN.helpers.arrayElement(['sale', 'rent']);

    // Randomize location slightly around the center
    const lat = location.lat + (Math.random() - 0.5) * 0.02;
    const lng = location.lng + (Math.random() - 0.5) * 0.02;

    const hasExtraDetails = Math.random() > 0.2; // 80% have extra details

    const pricing = {
        currency: 'TND',
        negotiable: fakerEN.datatype.boolean(),
        maintenanceCharges: hasExtraDetails ? fakerEN.number.int({ min: 50, max: 500 }) : 0
    };

    if (listingType === 'sale') {
        pricing.salePrice = fakerEN.number.int({ min: 50000, max: 2000000 });
    } else {
        pricing.rentPrice = fakerEN.number.int({ min: 500, max: 10000 });
        pricing.rentPeriod = fakerEN.helpers.arrayElement(['monthly', 'yearly', 'weekly', 'daily']);
        pricing.deposit = Math.random() > 0.3 ? pricing.rentPrice * 2 : undefined;
    }

    // Multi-language descriptions
    const titleEN = `${fakerEN.word.adjective()} ${type} in ${location.city}`;
    const titleFR = `${fakerFR.word.adjective()} ${type === 'apartment' ? 'appartement' : type} à ${location.city}`;
    const titleAR = `${type === 'apartment' ? 'شقة' : 'عقار'} ${fakerAR.word.adjective()} في ${location.city}`;

    const descriptionEN = fakerEN.lorem.paragraphs(2);
    const descriptionFR = fakerFR.lorem.paragraphs(2);
    const descriptionAR = fakerAR.lorem.paragraphs(2);

    // Pick random media from available files
    const propImages = mediaFiles.images.length > 0
        ? fakerEN.helpers.arrayElements(mediaFiles.images, { min: 2, max: 6 }).map(img => `/uploads/properties/images/${img}`)
        : [fakerEN.image.urlLoremFlickr({ category: 'realestate' }), fakerEN.image.urlLoremFlickr({ category: 'apartment' })];

    const propVideos = mediaFiles.videos.length > 0
        ? fakerEN.helpers.arrayElements(mediaFiles.videos, { min: 0, max: 1 }).map(vid => `/uploads/properties/videos/${vid}`)
        : [];

    return {
        owner: ownerId,
        title: `${titleEN} | ${titleFR} | ${titleAR}`,
        description: `${descriptionEN}\n\n${descriptionFR}\n\n${descriptionAR}`,
        type,
        listingType,
        propertyDetails: {
            bedrooms: type === 'land' ? 0 : fakerEN.number.int({ min: 0, max: 6 }),
            bathrooms: type === 'land' ? 0 : fakerEN.number.int({ min: 1, max: 4 }),
            area: fakerEN.number.int({ min: 20, max: 1000 }),
            areaUnit: 'sqm',
            furnishing: type === 'apartment' || type === 'house' ? fakerEN.helpers.arrayElement(['furnished', 'semi-furnished', 'unfurnished']) : undefined,
            parking: fakerEN.number.int({ min: 0, max: 3 }),
            age: fakerEN.number.int({ min: 0, max: 30 }),
            amenities: fakerEN.helpers.arrayElements(AMENITIES_LIST, { min: 4, max: 12 }),
            floor: type === 'apartment' ? fakerEN.number.int({ min: 0, max: 10 }) : undefined,
            totalFloors: type === 'apartment' ? fakerEN.number.int({ min: 1, max: 15 }) : undefined,
        },
        location: {
            address: fakerEN.location.streetAddress(),
            city: location.city,
            state: location.state,
            country: 'Tunisia',
            zipCode: fakerEN.location.zipCode('####'),
            coordinates: {
                latitude: lat,
                longitude: lng
            },
            landmark: hasExtraDetails ? fakerEN.company.name() : undefined
        },
        pricing,
        media: {
            images: propImages,
            videos: propVideos
        },
        status: fakerEN.helpers.arrayElement(['active', 'active', 'active', 'pending', 'sold']),
        features: fakerEN.helpers.arrayElements(FEATURES_LIST, { min: 2, max: 5 }),
        rules: hasExtraDetails ? ['No smoking', 'No pets', 'No loud parties'] : [],
        isPromoted: fakerEN.datatype.boolean(0.2)
    };
};

/**
 * Run Seed Script
 */
const runSeed = async () => {
    try {
        // Dynamically import faker since it's an ESM module
        const fakerModule = await import('@faker-js/faker');
        faker = fakerModule.faker;
        fakerAR = fakerModule.fakerAR;
        fakerFR = fakerModule.fakerFR;
        fakerEN = fakerModule.fakerEN;

        await connectDB();
        console.log('🚀 Starting seed process...');

        // Clear existing properties (Careful!, this ensures a clean seed context)
        const confirm = await Property.deleteMany({});
        console.log(`🗑️ Cleared ${confirm.deletedCount} existing properties.`);

        const users = await User.find({ role: 'seller' }).limit(NUM_USERS);
        let seedUsersList = users;

        if (users.length < NUM_USERS) {
            seedUsersList = await seedUsers();
        }

        const { images, videos } = getAvailableMedia();
        console.log(`📸 Found ${images.length} images and 🎥 ${videos.length} videos in uploads.`);

        const properties = [];
        for (let i = 0; i < NUM_PROPERTIES; i++) {
            const randomOwner = fakerEN.helpers.arrayElement(seedUsersList);
            properties.push(generateProperty(randomOwner._id, { images, videos }));
        }

        console.log('📝 Inserting properties...');
        const createdProperties = await Property.insertMany(properties);
        console.log(`✅ Successfully seeded ${createdProperties.length} properties!`);

        // Update users with their listings
        for (const prop of createdProperties) {
            await User.findByIdAndUpdate(prop.owner, {
                $push: { propertyListings: prop._id }
            });
        }
        console.log('🔗 Linked properties to users.');

        console.log('✨ Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

runSeed();
