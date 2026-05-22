const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/db');
const Property = require('../src/api/models/propertyModel');
const Vehicle = require('../src/api/models/vehicleModel');
const User = require('../src/api/models/userModel');

// Tunisian Cities
const TUNISIAN_LOCATIONS = [
    { city: 'Tunis', state: 'Tunis', lat: 36.8065, lng: 10.1815 },
    { city: 'La Marsa', state: 'Tunis', lat: 36.8778, lng: 10.3248 },
    { city: 'Carthage', state: 'Tunis', lat: 36.8525, lng: 10.3233 },
    { city: 'Sousse', state: 'Sousse', lat: 35.8256, lng: 10.6369 },
    { city: 'Hammamet', state: 'Nabeul', lat: 36.4000, lng: 10.6167 },
];

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'commercial'];
const AMENITIES_LIST = [
    'Swimming Pool', 'Sea View', 'Garden', 'Security 24/7', 'Parking',
    'Gym', 'Elevator', 'Air Conditioning', 'Central Heating', 'Balcony',
    'Terrace', 'Furnished', 'High Speed Internet', 'Modern Kitchen'
];

/**
 * Generate Properties for Imen
 */
const generateProperties = (ownerId) => {
    return [
        {
            owner: ownerId,
            title: 'Luxury Beachfront Villa in La Marsa',
            description: 'Stunning 4-bedroom villa with direct beach access, modern amenities, and breathtaking Mediterranean views. Perfect for families seeking luxury coastal living.',
            type: 'villa',
            listingType: 'rent',
            propertyDetails: {
                bedrooms: 4,
                bathrooms: 3,
                area: 350,
                areaUnit: 'sqm',
                furnishing: 'furnished',
                parking: 2,
                age: 2,
                amenities: ['Swimming Pool', 'Sea View', 'Garden', 'Security 24/7', 'Parking', 'Air Conditioning', 'Balcony', 'Terrace'],
            },
            location: {
                address: '45 Avenue Habib Bourguiba',
                city: 'La Marsa',
                state: 'Tunis',
                country: 'Tunisia',
                zipCode: '2070',
                coordinates: {
                    latitude: 36.8778,
                    longitude: 10.3248
                }
            },
            pricing: {
                rentPrice: 2500,
                rentPeriod: 'monthly',
                currency: 'TND',
                deposit: 5000,
                negotiable: true,
                maintenanceCharges: 200
            },
            media: {
                images: [
                    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
                    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
                ],
                videos: []
            },
            status: 'active',
            features: ['Luxury Finish', 'Close to Beach', 'Quiet Area'],
            capacity: 8,
            cancellationPolicy: 'moderate',
            isPromoted: false
        },
        {
            owner: ownerId,
            title: 'Modern Downtown Apartment in Tunis',
            description: 'Spacious 3-bedroom apartment in the heart of Tunis. Walking distance to shops, restaurants, and public transport. Ideal for professionals and families.',
            type: 'apartment',
            listingType: 'rent',
            propertyDetails: {
                bedrooms: 3,
                bathrooms: 2,
                area: 150,
                areaUnit: 'sqm',
                furnishing: 'semi-furnished',
                parking: 1,
                age: 5,
                amenities: ['Elevator', 'Air Conditioning', 'Central Heating', 'Balcony', 'High Speed Internet'],
                floor: 5,
                totalFloors: 8
            },
            location: {
                address: '12 Rue de la Liberté',
                city: 'Tunis',
                state: 'Tunis',
                country: 'Tunisia',
                zipCode: '1000',
                coordinates: {
                    latitude: 36.8065,
                    longitude: 10.1815
                }
            },
            pricing: {
                rentPrice: 1200,
                rentPeriod: 'monthly',
                currency: 'TND',
                deposit: 2400,
                negotiable: true,
                maintenanceCharges: 100
            },
            media: {
                images: [
                    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
                    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
                ],
                videos: []
            },
            status: 'active',
            features: ['Near Public Transport', 'Investment Opportunity'],
            capacity: 6,
            cancellationPolicy: 'flexible',
            isPromoted: false
        },
        {
            owner: ownerId,
            title: 'Charming House in Carthage',
            description: 'Beautiful traditional Tunisian house with modern renovations. Features a lovely courtyard, 5 bedrooms, and authentic architecture. Perfect for large families.',
            type: 'house',
            listingType: 'rent',
            propertyDetails: {
                bedrooms: 5,
                bathrooms: 3,
                area: 280,
                areaUnit: 'sqm',
                furnishing: 'furnished',
                parking: 2,
                age: 15,
                amenities: ['Garden', 'Security 24/7', 'Parking', 'Air Conditioning', 'Terrace', 'Furnished'],
            },
            location: {
                address: '78 Avenue de Carthage',
                city: 'Carthage',
                state: 'Tunis',
                country: 'Tunisia',
                zipCode: '2016',
                coordinates: {
                    latitude: 36.8525,
                    longitude: 10.3233
                }
            },
            pricing: {
                rentPrice: 1800,
                rentPeriod: 'monthly',
                currency: 'TND',
                deposit: 3600,
                negotiable: true,
                maintenanceCharges: 150
            },
            media: {
                images: [
                    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
                ],
                videos: []
            },
            status: 'active',
            features: ['Quiet Area', 'Pet Friendly'],
            capacity: 10,
            cancellationPolicy: 'moderate',
            isPromoted: false
        },
        {
            owner: ownerId,
            title: 'Luxury Penthouse in Sousse',
            description: 'Exclusive penthouse with panoramic sea views, rooftop terrace, and premium finishes. The ultimate in luxury coastal living.',
            type: 'apartment',
            listingType: 'rent',
            propertyDetails: {
                bedrooms: 3,
                bathrooms: 2,
                area: 200,
                areaUnit: 'sqm',
                furnishing: 'furnished',
                parking: 2,
                age: 1,
                amenities: ['Sea View', 'Gym', 'Elevator', 'Air Conditioning', 'Balcony', 'Terrace', 'Furnished', 'Modern Kitchen'],
                floor: 10,
                totalFloors: 10
            },
            location: {
                address: '23 Boulevard de la Corniche',
                city: 'Sousse',
                state: 'Sousse',
                country: 'Tunisia',
                zipCode: '4000',
                coordinates: {
                    latitude: 35.8256,
                    longitude: 10.6369
                }
            },
            pricing: {
                rentPrice: 3000,
                rentPeriod: 'monthly',
                currency: 'TND',
                deposit: 6000,
                negotiable: false,
                maintenanceCharges: 250
            },
            media: {
                images: [
                    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
                    'https://images.unsplash.com/photo-1502672260066-6bc35f0a1f80?w=800'
                ],
                videos: []
            },
            status: 'active',
            features: ['Luxury Finish', 'Close to Beach', 'New Development'],
            capacity: 6,
            cancellationPolicy: 'strict',
            isPromoted: false
        },
        {
            owner: ownerId,
            title: 'Cozy Studio in Hammamet',
            description: 'Perfect vacation rental! Compact studio apartment near the beach with all essentials. Great for couples or solo travelers.',
            type: 'apartment',
            listingType: 'rent',
            propertyDetails: {
                bedrooms: 1,
                bathrooms: 1,
                area: 45,
                areaUnit: 'sqm',
                furnishing: 'furnished',
                parking: 1,
                age: 3,
                amenities: ['Air Conditioning', 'Balcony', 'Furnished', 'High Speed Internet'],
                floor: 2,
                totalFloors: 4
            },
            location: {
                address: '15 Rue des Jasmins',
                city: 'Hammamet',
                state: 'Nabeul',
                country: 'Tunisia',
                zipCode: '8050',
                coordinates: {
                    latitude: 36.4000,
                    longitude: 10.6167
                }
            },
            pricing: {
                rentPrice: 800,
                rentPeriod: 'monthly',
                currency: 'TND',
                deposit: 1600,
                negotiable: true,
                maintenanceCharges: 50
            },
            media: {
                images: [
                    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800',
                    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800'
                ],
                videos: []
            },
            status: 'active',
            features: ['Close to Beach', 'Investment Opportunity'],
            capacity: 2,
            cancellationPolicy: 'flexible',
            isPromoted: false
        }
    ];
};

/**
 * Generate Vehicles for Imen
 */
const generateVehicles = (ownerId) => {
    return [
        {
            owner: ownerId,
            title: 'Mercedes-Benz E-Class 2022',
            description: 'Luxury sedan in pristine condition. Perfect for business trips or special occasions. Features leather interior, advanced safety systems, and premium sound.',
            type: 'car',
            listingType: 'rent',
            vehicleDetails: {
                make: 'Mercedes-Benz',
                model: 'E-Class',
                year: 2022,
                mileage: 15000,
                fuelType: 'petrol',
                transmission: 'automatic',
                color: 'Black',
                seatingCapacity: 5,
                condition: 'certified',
                features: ['Leather Seats', 'Sunroof', 'Navigation System', 'Bluetooth', 'Parking Sensors', 'Cruise Control']
            },
            location: {
                city: 'Tunis',
                state: 'Tunis',
                country: 'Tunisia',
                coordinates: {
                    latitude: 36.8065,
                    longitude: 10.1815
                }
            },
            pricing: {
                rentPrice: 250,
                rentPeriod: 'daily',
                currency: 'TND',
                deposit: 1000,
                negotiable: true
            },
            media: {
                images: [
                    'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800',
                    'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'
                ],
                videos: []
            },
            status: 'active',
            cancellationPolicy: 'moderate'
        },
        {
            owner: ownerId,
            title: 'BMW X5 2021 - Premium SUV',
            description: 'Spacious luxury SUV perfect for family trips. All-wheel drive, advanced technology, and exceptional comfort.',
            type: 'car',
            listingType: 'rent',
            vehicleDetails: {
                make: 'BMW',
                model: 'X5',
                year: 2021,
                mileage: 25000,
                fuelType: 'diesel',
                transmission: 'automatic',
                color: 'White',
                seatingCapacity: 7,
                condition: 'certified',
                features: ['Leather Seats', 'Sunroof', 'Navigation System', 'Bluetooth', 'Parking Sensors', 'Third Row Seating', '4WD']
            },
            location: {
                city: 'La Marsa',
                state: 'Tunis',
                country: 'Tunisia',
                coordinates: {
                    latitude: 36.8778,
                    longitude: 10.3248
                }
            },
            pricing: {
                rentPrice: 350,
                rentPeriod: 'daily',
                currency: 'TND',
                deposit: 1500,
                negotiable: true
            },
            media: {
                images: [
                    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
                    'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800'
                ],
                videos: []
            },
            status: 'active',
            cancellationPolicy: 'moderate'
        },
        {
            owner: ownerId,
            title: 'Audi A4 2023 - Latest Model',
            description: 'Brand new Audi A4 with cutting-edge technology and elegant design. Ideal for business professionals.',
            type: 'car',
            listingType: 'rent',
            vehicleDetails: {
                make: 'Audi',
                model: 'A4',
                year: 2023,
                mileage: 5000,
                fuelType: 'petrol',
                transmission: 'automatic',
                color: 'Silver',
                seatingCapacity: 5,
                condition: 'new',
                features: ['Leather Seats', 'Sunroof', 'Navigation System', 'Bluetooth', 'Parking Sensors', 'Adaptive Cruise Control', 'LED Headlights']
            },
            location: {
                city: 'Sousse',
                state: 'Sousse',
                country: 'Tunisia',
                coordinates: {
                    latitude: 35.8256,
                    longitude: 10.6369
                }
            },
            pricing: {
                rentPrice: 280,
                rentPeriod: 'daily',
                currency: 'TND',
                deposit: 1200,
                negotiable: false
            },
            media: {
                images: [
                    'https://images.unsplash.com/photo-1610768764270-790fbec18178?w=800',
                    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800'
                ],
                videos: []
            },
            status: 'active',
            cancellationPolicy: 'strict'
        },
        {
            owner: ownerId,
            title: 'Toyota Land Cruiser 2020',
            description: 'Rugged and reliable SUV perfect for desert adventures and family trips. Spacious interior with premium features.',
            type: 'car',
            listingType: 'rent',
            vehicleDetails: {
                make: 'Toyota',
                model: 'Land Cruiser',
                year: 2020,
                mileage: 45000,
                fuelType: 'diesel',
                transmission: 'automatic',
                color: 'Beige',
                seatingCapacity: 8,
                condition: 'used',
                features: ['Leather Seats', 'Navigation System', 'Bluetooth', 'Parking Sensors', '4WD', 'Third Row Seating']
            },
            location: {
                city: 'Hammamet',
                state: 'Nabeul',
                country: 'Tunisia',
                coordinates: {
                    latitude: 36.4000,
                    longitude: 10.6167
                }
            },
            pricing: {
                rentPrice: 300,
                rentPeriod: 'daily',
                currency: 'TND',
                deposit: 1300,
                negotiable: true
            },
            media: {
                images: [
                    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
                    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800'
                ],
                videos: []
            },
            status: 'active',
            cancellationPolicy: 'moderate'
        }
    ];
};

/**
 * Run Seed Script
 */
const runSeed = async () => {
    try {
        await connectDB();
        console.log('🚀 Starting seed process for imen@gmail.com...');

        // Find the user
        const user = await User.findOne({ email: 'imen@gmail.com' });
        
        if (!user) {
            console.error('❌ User with email imen@gmail.com not found!');
            console.log('Please create this user first or update the email in the script.');
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);

        // Delete existing listings for this user
        const deletedProps = await Property.deleteMany({ owner: user._id });
        const deletedVehicles = await Vehicle.deleteMany({ owner: user._id });
        console.log(`🗑️ Cleared ${deletedProps.deletedCount} existing properties and ${deletedVehicles.deletedCount} vehicles.`);

        // Generate and insert properties
        const properties = generateProperties(user._id);
        const createdProperties = await Property.insertMany(properties);
        console.log(`✅ Created ${createdProperties.length} properties (all with rent prices > 100 TND/month)`);

        // Generate and insert vehicles
        const vehicles = generateVehicles(user._id);
        const createdVehicles = await Vehicle.insertMany(vehicles);
        console.log(`✅ Created ${createdVehicles.length} vehicles (all with rent prices > 100 TND/day)`);

        // Update user with listings
        await User.findByIdAndUpdate(user._id, {
            $set: {
                propertyListings: createdProperties.map(p => p._id),
                vehicleListings: createdVehicles.map(v => v._id)
            }
        });
        console.log('🔗 Linked all listings to user.');

        console.log('\n✨ Seeding complete!');
        console.log(`📊 Summary:`);
        console.log(`   - Properties: ${createdProperties.length}`);
        console.log(`   - Vehicles: ${createdVehicles.length}`);
        console.log(`   - Total Listings: ${createdProperties.length + createdVehicles.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

runSeed();
