const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('../config/db');
const Property = require('../src/api/models/propertyModel');
const Vehicle = require('../src/api/models/vehicleModel');
const User = require('../src/api/models/userModel');

// Tunisian Cities
const LOCATIONS = [
    { city: 'Tunis', state: 'Tunis', country: 'Tunisia', lat: 36.8065, lng: 10.1815 },
    { city: 'La Marsa', state: 'Tunis', country: 'Tunisia', lat: 36.8778, lng: 10.3248 },
    { city: 'Carthage', state: 'Tunis', country: 'Tunisia', lat: 36.8525, lng: 10.3233 },
    { city: 'Sousse', state: 'Sousse', country: 'Tunisia', lat: 35.8256, lng: 10.6369 },
    { city: 'Hammamet', state: 'Nabeul', country: 'Tunisia', lat: 36.4000, lng: 10.6167 },
    { city: 'Sfax', state: 'Sfax', country: 'Tunisia', lat: 34.7406, lng: 10.7603 },
    { city: 'Bizerte', state: 'Bizerte', country: 'Tunisia', lat: 37.2744, lng: 9.8739 },
    { city: 'Nabeul', state: 'Nabeul', country: 'Tunisia', lat: 36.4561, lng: 10.7356 },
];

/**
 * Generate 20 diverse users
 */
const generateUsers = async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    return [
        // 5 Buyers (clients who are looking to buy/rent)
        {
            email: 'buyer1@gmail.com',
            password: hashedPassword,
            firstName: 'Ahmed',
            lastName: 'Ben Ali',
            fullName: 'Ahmed Ben Ali',
            phoneNumber: '+21620111001',
            role: 'client',
            interest: 'property',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            preferences: {
                propertyTypes: ['apartment', 'house'],
                location: { city: 'Tunis', state: 'Tunis', country: 'Tunisia' }
            }
        },
        {
            email: 'buyer2@gmail.com',
            password: hashedPassword,
            firstName: 'Fatima',
            lastName: 'Khaled',
            fullName: 'Fatima Khaled',
            phoneNumber: '+21620111002',
            role: 'client',
            interest: 'cars',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            preferences: {
                vehicleTypes: ['car'],
                location: { city: 'Sousse', state: 'Sousse', country: 'Tunisia' }
            }
        },
        {
            email: 'buyer3@gmail.com',
            password: hashedPassword,
            firstName: 'Youssef',
            lastName: 'Mansour',
            fullName: 'Youssef Mansour',
            phoneNumber: '+21620111003',
            role: 'client',
            interest: 'both',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            preferences: {
                propertyTypes: ['villa'],
                vehicleTypes: ['car', 'truck'],
                location: { city: 'La Marsa', state: 'Tunis', country: 'Tunisia' }
            }
        },
        {
            email: 'buyer4@gmail.com',
            password: hashedPassword,
            firstName: 'Salma',
            lastName: 'Trabelsi',
            fullName: 'Salma Trabelsi',
            phoneNumber: '+21620111004',
            role: 'client',
            interest: 'property',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            preferences: {
                propertyTypes: ['apartment'],
                location: { city: 'Hammamet', state: 'Nabeul', country: 'Tunisia' }
            }
        },
        {
            email: 'buyer5@gmail.com',
            password: hashedPassword,
            firstName: 'Omar',
            lastName: 'Saidi',
            fullName: 'Omar Saidi',
            phoneNumber: '+21620111005',
            role: 'client',
            interest: 'cars',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            preferences: {
                vehicleTypes: ['car', 'van'],
                location: { city: 'Sfax', state: 'Sfax', country: 'Tunisia' }
            }
        },

        // 5 Sellers (users who list properties or vehicles)
        {
            email: 'seller1@gmail.com',
            password: hashedPassword,
            firstName: 'Mohamed',
            lastName: 'Bouazizi',
            fullName: 'Mohamed Bouazizi',
            phoneNumber: '+21620222001',
            role: 'seller',
            interest: 'property',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: []
        },
        {
            email: 'seller2@gmail.com',
            password: hashedPassword,
            firstName: 'Amira',
            lastName: 'Gharbi',
            fullName: 'Amira Gharbi',
            phoneNumber: '+21620222002',
            role: 'seller',
            interest: 'cars',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            vehicleListings: []
        },
        {
            email: 'seller3@gmail.com',
            password: hashedPassword,
            firstName: 'Karim',
            lastName: 'Mahjoub',
            fullName: 'Karim Mahjoub',
            phoneNumber: '+21620222003',
            role: 'seller',
            interest: 'both',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: [],
            vehicleListings: []
        },
        {
            email: 'seller4@gmail.com',
            password: hashedPassword,
            firstName: 'Leila',
            lastName: 'Hamdi',
            fullName: 'Leila Hamdi',
            phoneNumber: '+21620222004',
            role: 'seller',
            interest: 'property',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: []
        },
        {
            email: 'seller5@gmail.com',
            password: hashedPassword,
            firstName: 'Rami',
            lastName: 'Jbeli',
            fullName: 'Rami Jbeli',
            phoneNumber: '+21620222005',
            role: 'seller',
            interest: 'cars',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            vehicleListings: []
        },

        // 10 Both (sellers with interest in both properties and vehicles)
        {
            email: 'both1@gmail.com',
            password: hashedPassword,
            firstName: 'Nadia',
            lastName: 'Cherni',
            fullName: 'Nadia Cherni',
            phoneNumber: '+21620333001',
            role: 'seller',
            interest: 'both',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: [],
            vehicleListings: []
        },
        {
            email: 'both2@gmail.com',
            password: hashedPassword,
            firstName: 'Tarek',
            lastName: 'Dridi',
            fullName: 'Tarek Dridi',
            phoneNumber: '+21620333002',
            role: 'seller',
            interest: 'both',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: [],
            vehicleListings: []
        },
        {
            email: 'both3@gmail.com',
            password: hashedPassword,
            firstName: 'Sihem',
            lastName: 'Nabli',
            fullName: 'Sihem Nabli',
            phoneNumber: '+21620333003',
            role: 'seller',
            interest: 'both',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: [],
            vehicleListings: []
        },
        {
            email: 'both4@gmail.com',
            password: hashedPassword,
            firstName: 'Walid',
            lastName: 'Essid',
            fullName: 'Walid Essid',
            phoneNumber: '+21620333004',
            role: 'seller',
            interest: 'both',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: [],
            vehicleListings: []
        },
        {
            email: 'both5@gmail.com',
            password: hashedPassword,
            firstName: 'Sana',
            lastName: 'Mejri',
            fullName: 'Sana Mejri',
            phoneNumber: '+21620333005',
            role: 'seller',
            interest: 'both',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: [],
            vehicleListings: []
        },
        {
            email: 'both6@gmail.com',
            password: hashedPassword,
            firstName: 'Hichem',
            lastName: 'Zaouali',
            fullName: 'Hichem Zaouali',
            phoneNumber: '+21620333006',
            role: 'seller',
            interest: 'both',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: [],
            vehicleListings: []
        },
        {
            email: 'both7@gmail.com',
            password: hashedPassword,
            firstName: 'Ines',
            lastName: 'Hammami',
            fullName: 'Ines Hammami',
            phoneNumber: '+21620333007',
            role: 'seller',
            interest: 'both',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: [],
            vehicleListings: []
        },
        {
            email: 'both8@gmail.com',
            password: hashedPassword,
            firstName: 'Mehdi',
            lastName: 'Fourati',
            fullName: 'Mehdi Fourati',
            phoneNumber: '+21620333008',
            role: 'seller',
            interest: 'both',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: [],
            vehicleListings: []
        },
        {
            email: 'both9@gmail.com',
            password: hashedPassword,
            firstName: 'Asma',
            lastName: 'Brahim',
            fullName: 'Asma Brahim',
            phoneNumber: '+21620333009',
            role: 'seller',
            interest: 'both',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: [],
            vehicleListings: []
        },
        {
            email: 'both10@gmail.com',
            password: hashedPassword,
            firstName: 'Slim',
            lastName: 'Riahi',
            fullName: 'Slim Riahi',
            phoneNumber: '+21620333010',
            role: 'seller',
            interest: 'both',
            emailVerified: true,
            phoneVerified: true,
            profileCompleted: true,
            propertyListings: [],
            vehicleListings: []
        }
    ];
};

/**
 * Generate 10 diverse properties
 */
const generateProperties = (sellers) => {
    return [
        {
            owner: sellers[0]._id,
            title: 'Luxury Beachfront Villa in La Marsa',
            description: 'Stunning modern villa with direct beach access, infinity pool, and panoramic Mediterranean views. Features 5 spacious bedrooms, home theater, gym, and smart home technology.',
            type: 'villa',
            listingType: 'rent',
            propertyDetails: {
                bedrooms: 5,
                bathrooms: 4,
                area: 450,
                areaUnit: 'sqm',
                furnishing: 'furnished',
                parking: 3,
                age: 1,
                amenities: ['Swimming Pool', 'Sea View', 'Garden', 'Security 24/7', 'Gym', 'Air Conditioning', 'Modern Kitchen', 'Smart Home'],
            },
            location: {
                address: '45 Avenue Habib Bourguiba',
                city: 'La Marsa',
                state: 'Tunis',
                country: 'Tunisia',
                zipCode: '2070',
                coordinates: { latitude: 36.8778, longitude: 10.3248 }
            },
            pricing: {
                rentPrice: 4500,
                rentPeriod: 'monthly',
                currency: 'TND',
                deposit: 9000,
                negotiable: true
            },
            media: {
                images: [
                    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
                    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
                ]
            },
            status: 'active',
            capacity: 10,
            cancellationPolicy: 'moderate'
        },
        {
            owner: sellers[1]._id,
            title: 'Modern Downtown Apartment - Tunis Center',
            description: 'Chic 3-bedroom apartment in the heart of Tunis. Walking distance to Avenue Habib Bourguiba, shops, restaurants, and cultural sites. Perfect for urban professionals.',
            type: 'apartment',
            listingType: 'rent',
            propertyDetails: {
                bedrooms: 3,
                bathrooms: 2,
                area: 140,
                areaUnit: 'sqm',
                furnishing: 'semi-furnished',
                parking: 1,
                age: 4,
                amenities: ['Elevator', 'Air Conditioning', 'Balcony', 'High Speed Internet'],
                floor: 6,
                totalFloors: 10
            },
            location: {
                address: '12 Rue de la Liberté',
                city: 'Tunis',
                state: 'Tunis',
                country: 'Tunisia',
                zipCode: '1000',
                coordinates: { latitude: 36.8065, longitude: 10.1815 }
            },
            pricing: {
                rentPrice: 1500,
                rentPeriod: 'monthly',
                currency: 'TND',
                deposit: 3000,
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800']
            },
            status: 'active',
            capacity: 6,
            cancellationPolicy: 'flexible'
        },
        {
            owner: sellers[2]._id,
            title: 'Charming Traditional House in Carthage',
            description: 'Beautifully restored traditional Tunisian house blending authentic architecture with modern comfort. Featuring a stunning courtyard, marble floors, and ornate tile work.',
            type: 'house',
            listingType: 'sale',
            propertyDetails: {
                bedrooms: 4,
                bathrooms: 3,
                area: 300,
                areaUnit: 'sqm',
                furnishing: 'furnished',
                parking: 2,
                age: 25,
                amenities: ['Garden', 'Terrace', 'Furnished', 'Traditional Architecture'],
            },
            location: {
                address: '78 Avenue de Carthage',
                city: 'Carthage',
                state: 'Tunis',
                country: 'Tunisia',
                zipCode: '2016',
                coordinates: { latitude: 36.8525, longitude: 10.3233 }
            },
            pricing: {
                salePrice: 850000,
                currency: 'TND',
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800']
            },
            status: 'active',
            capacity: 8,
            cancellationPolicy: 'strict'
        },
        {
            owner: sellers[3]._id,
            title: 'Luxury Penthouse - Sousse Marina',
            description: 'Exclusive penthouse with breathtaking marina and sea views. Features a 100 sqm rooftop terrace, jacuzzi, and premium finishes throughout.',
            type: 'apartment',
            listingType: 'rent',
            propertyDetails: {
                bedrooms: 4,
                bathrooms: 3,
                area: 250,
                areaUnit: 'sqm',
                furnishing: 'furnished',
                parking: 2,
                age: 2,
                amenities: ['Sea View', 'Elevator', 'Terrace', 'Jacuzzi', 'Modern Kitchen', 'Gym'],
                floor: 12,
                totalFloors: 12
            },
            location: {
                address: '23 Boulevard de la Corniche',
                city: 'Sousse',
                state: 'Sousse',
                country: 'Tunisia',
                zipCode: '4000',
                coordinates: { latitude: 35.8256, longitude: 10.6369 }
            },
            pricing: {
                rentPrice: 3500,
                rentPeriod: 'monthly',
                currency: 'TND',
                deposit: 7000,
                negotiable: false
            },
            media: {
                images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800']
            },
            status: 'active',
            capacity: 8,
            cancellationPolicy: 'strict'
        },
        {
            owner: sellers[4]._id,
            title: 'Beach Studio Apartment - Hammamet',
            description: 'Cozy studio perfect for vacation rentals. Steps from the beach, fully equipped kitchen, and beautiful sea glimpses from the balcony.',
            type: 'apartment',
            listingType: 'rent',
            propertyDetails: {
                bedrooms: 1,
                bathrooms: 1,
                area: 40,
                areaUnit: 'sqm',
                furnishing: 'furnished',
                parking: 1,
                age: 3,
                amenities: ['Air Conditioning', 'Balcony', 'Furnished'],
                floor: 2,
                totalFloors: 4
            },
            location: {
                address: '15 Rue des Jasmins',
                city: 'Hammamet',
                state: 'Nabeul',
                country: 'Tunisia',
                zipCode: '8050',
                coordinates: { latitude: 36.4000, longitude: 10.6167 }
            },
            pricing: {
                rentPrice: 900,
                rentPeriod: 'monthly',
                currency: 'TND',
                deposit: 1800,
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800']
            },
            status: 'active',
            capacity: 2,
            cancellationPolicy: 'flexible'
        },
        {
            owner: sellers[5]._id,
            title: 'Spacious Family Villa - Bizerte',
            description: 'Perfect family home with large garden, swimming pool, and plenty of outdoor space. Close to schools and amenities.',
            type: 'villa',
            listingType: 'sale',
            propertyDetails: {
                bedrooms: 6,
                bathrooms: 4,
                area: 500,
                areaUnit: 'sqm',
                furnishing: 'semi-furnished',
                parking: 4,
                age: 8,
                amenities: ['Swimming Pool', 'Garden', 'Parking', 'Security 24/7'],
            },
            location: {
                address: '56 Route de la Corniche',
                city: 'Bizerte',
                state: 'Bizerte',
                country: 'Tunisia',
                zipCode: '7000',
                coordinates: { latitude: 37.2744, longitude: 9.8739 }
            },
            pricing: {
                salePrice: 950000,
                currency: 'TND',
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800']
            },
            status: 'active',
            capacity: 12,
            cancellationPolicy: 'moderate'
        },
        {
            owner: sellers[6]._id,
            title: 'Commercial Space - Sfax Downtown',
            description: 'Prime commercial location in the business district of Sfax. Ideal for offices, retail, or restaurant. High foot traffic area.',
            type: 'commercial',
            listingType: 'rent',
            propertyDetails: {
                area: 200,
                areaUnit: 'sqm',
                furnishing: 'unfurnished',
                parking: 5,
                age: 10,
                amenities: ['Elevator', 'High Speed Internet', 'Parking'],
                floor: 1,
                totalFloors: 5
            },
            location: {
                address: '88 Avenue Majida Boulila',
                city: 'Sfax',
                state: 'Sfax',
                country: 'Tunisia',
                zipCode: '3000',
                coordinates: { latitude: 34.7406, longitude: 10.7603 }
            },
            pricing: {
                rentPrice: 2500,
                rentPeriod: 'monthly',
                currency: 'TND',
                deposit: 5000,
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800']
            },
            status: 'active',
            cancellationPolicy: 'moderate'
        },
        {
            owner: sellers[7]._id,
            title: 'Elegant 2-Bedroom Apartment - Nabeul',
            description: 'Bright and airy apartment with modern finishes. Close to beaches, markets, and the famous Nabeul pottery workshops.',
            type: 'apartment',
            listingType: 'rent',
            propertyDetails: {
                bedrooms: 2,
                bathrooms: 1,
                area: 95,
                areaUnit: 'sqm',
                furnishing: 'furnished',
                parking: 1,
                age: 5,
                amenities: ['Air Conditioning', 'Balcony', 'Furnished'],
                floor: 3,
                totalFloors: 5
            },
            location: {
                address: '34 Avenue Farhat Hached',
                city: 'Nabeul',
                state: 'Nabeul',
                country: 'Tunisia',
                zipCode: '8000',
                coordinates: { latitude: 36.4561, longitude: 10.7356 }
            },
            pricing: {
                rentPrice: 1100,
                rentPeriod: 'monthly',
                currency: 'TND',
                deposit: 2200,
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800']
            },
            status: 'active',
            capacity: 4,
            cancellationPolicy: 'flexible'
        },
        {
            owner: sellers[8]._id,
            title: 'Investment Opportunity - Tunis Apartment Complex',
            description: 'Brand new residential building with 8 apartments. Excellent rental yield potential in growing neighborhood.',
            type: 'apartment',
            listingType: 'sale',
            propertyDetails: {
                bedrooms: 2,
                bathrooms: 1,
                area: 85,
                areaUnit: 'sqm',
                furnishing: 'unfurnished',
                parking: 1,
                age: 0,
                amenities: ['Elevator', 'Security 24/7', 'Parking'],
                floor: 4,
                totalFloors: 8
            },
            location: {
                address: '125 Rue de Marseille',
                city: 'Tunis',
                state: 'Tunis',
                country: 'Tunisia',
                zipCode: '1000',
                coordinates: { latitude: 36.8065, longitude: 10.1815 }
            },
            pricing: {
                salePrice: 350000,
                currency: 'TND',
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800']
            },
            status: 'active',
            capacity: 4,
            cancellationPolicy: 'strict'
        },
        {
            owner: sellers[9]._id,
            title: 'Countryside Villa with Olive Grove - Hammamet',
            description: 'Peaceful retreat surrounded by olive trees. Traditional architecture with modern amenities. Perfect for nature lovers.',
            type: 'villa',
            listingType: 'sale',
            propertyDetails: {
                bedrooms: 5,
                bathrooms: 3,
                area: 400,
                areaUnit: 'sqm',
                furnishing: 'semi-furnished',
                parking: 3,
                age: 15,
                amenities: ['Garden', 'Swimming Pool', 'Terrace', 'Olive Grove'],
            },
            location: {
                address: 'Route Touristique Km 8',
                city: 'Hammamet',
                state: 'Nabeul',
                country: 'Tunisia',
                zipCode: '8050',
                coordinates: { latitude: 36.4000, longitude: 10.6167 }
            },
            pricing: {
                salePrice: 750000,
                currency: 'TND',
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800']
            },
            status: 'active',
            capacity: 10,
            cancellationPolicy: 'moderate'
        }
    ];
};

/**
 * Generate 10 diverse vehicles
 */
const generateVehicles = (sellers) => {
    return [
        {
            owner: sellers[0]._id,
            title: 'Mercedes-Benz E-Class 2023 - Luxury Sedan',
            description: 'Pristine luxury sedan with advanced safety features, premium leather interior, and cutting-edge technology. Perfect for business or special occasions.',
            type: 'car',
            listingType: 'rent',
            vehicleDetails: {
                make: 'Mercedes-Benz',
                model: 'E-Class',
                year: 2023,
                mileage: 8000,
                fuelType: 'hybrid',
                transmission: 'automatic',
                color: 'Silver',
                seatingCapacity: 5,
                engineCapacity: 2.0,
                condition: 'certified',
                features: ['Leather Seats', 'Sunroof', 'Navigation System', 'Bluetooth', 'Parking Sensors', 'Adaptive Cruise Control', 'Lane Assist']
            },
            location: {
                city: 'Tunis',
                state: 'Tunis',
                country: 'Tunisia',
                coordinates: { latitude: 36.8065, longitude: 10.1815 }
            },
            pricing: {
                rentPrice: 350,
                rentPeriod: 'daily',
                currency: 'TND',
                deposit: 1500,
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800']
            },
            status: 'active',
            cancellationPolicy: 'moderate'
        },
        {
            owner: sellers[1]._id,
            title: 'BMW X5 2022 - Premium SUV',
            description: 'Powerful luxury SUV with all-wheel drive. Spacious interior, advanced infotainment, and exceptional performance. Ideal for family trips.',
            type: 'car',
            listingType: 'rent',
            vehicleDetails: {
                make: 'BMW',
                model: 'X5',
                year: 2022,
                mileage: 18000,
                fuelType: 'diesel',
                transmission: 'automatic',
                color: 'Black',
                seatingCapacity: 7,
                engineCapacity: 3.0,
                condition: 'certified',
                features: ['Leather Seats', 'Sunroof', 'Navigation System', '4WD', 'Third Row Seating', 'Apple CarPlay', 'Heated Seats']
            },
            location: {
                city: 'La Marsa',
                state: 'Tunis',
                country: 'Tunisia',
                coordinates: { latitude: 36.8778, longitude: 10.3248 }
            },
            pricing: {
                rentPrice: 400,
                rentPeriod: 'daily',
                currency: 'TND',
                deposit: 2000,
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800']
            },
            status: 'active',
            cancellationPolicy: 'moderate'
        },
        {
            owner: sellers[2]._id,
            title: 'Audi A4 2024 - Executive Sedan',
            description: 'Brand new executive sedan with the latest technology and safety features. Elegant design and superior driving experience.',
            type: 'car',
            listingType: 'sale',
            vehicleDetails: {
                make: 'Audi',
                model: 'A4',
                year: 2024,
                mileage: 500,
                fuelType: 'petrol',
                transmission: 'automatic',
                color: 'White',
                seatingCapacity: 5,
                engineCapacity: 2.0,
                condition: 'new',
                features: ['Leather Seats', 'Sunroof', 'Navigation System', 'Virtual Cockpit', 'Matrix LED Headlights', 'Sport Package']
            },
            location: {
                city: 'Sousse',
                state: 'Sousse',
                country: 'Tunisia',
                coordinates: { latitude: 35.8256, longitude: 10.6369 }
            },
            pricing: {
                salePrice: 145000,
                currency: 'TND',
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800']
            },
            status: 'active',
            cancellationPolicy: 'strict'
        },
        {
            owner: sellers[3]._id,
            title: 'Toyota Land Cruiser 2021 - Adventure SUV',
            description: 'Rugged and reliable 4x4 SUV perfect for both city driving and off-road adventures. Well-maintained with full service history.',
            type: 'car',
            listingType: 'rent',
            vehicleDetails: {
                make: 'Toyota',
                model: 'Land Cruiser',
                year: 2021,
                mileage: 35000,
                fuelType: 'diesel',
                transmission: 'automatic',
                color: 'Grey',
                seatingCapacity: 7,
                engineCapacity: 4.5,
                condition: 'certified',
                features: ['4WD', 'Third Row Seating', 'Off-Road Package', 'Roof Rack', 'Bluetooth', 'Cruise Control']
            },
            location: {
                city: 'Sfax',
                state: 'Sfax',
                country: 'Tunisia',
                coordinates: { latitude: 34.7406, longitude: 10.7603 }
            },
            pricing: {
                rentPrice: 450,
                rentPeriod: 'daily',
                currency: 'TND',
                deposit: 2500,
                negotiable: false
            },
            media: {
                images: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800']
            },
            status: 'active',
            cancellationPolicy: 'moderate'
        },
        {
            owner: sellers[4]._id,
            title: 'Volkswagen Golf 2023 - Compact Hatchback',
            description: 'Efficient and practical compact car perfect for city driving. Great fuel economy and modern features.',
            type: 'car',
            listingType: 'rent',
            vehicleDetails: {
                make: 'Volkswagen',
                model: 'Golf',
                year: 2023,
                mileage: 12000,
                fuelType: 'petrol',
                transmission: 'manual',
                color: 'Blue',
                seatingCapacity: 5,
                engineCapacity: 1.4,
                condition: 'certified',
                features: ['Bluetooth', 'Air Conditioning', 'USB Port', 'Parking Sensors']
            },
            location: {
                city: 'Hammamet',
                state: 'Nabeul',
                country: 'Tunisia',
                coordinates: { latitude: 36.4000, longitude: 10.6167 }
            },
            pricing: {
                rentPrice: 150,
                rentPeriod: 'daily',
                currency: 'TND',
                deposit: 800,
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1552519507-cf8e7d49fb94?w=800']
            },
            status: 'active',
            cancellationPolicy: 'flexible'
        },
        {
            owner: sellers[5]._id,
            title: 'Renault Clio 2022 - Economy Car',
            description: 'Affordable and reliable economy car. Low mileage, excellent fuel efficiency, perfect for daily commuting or vacation.',
            type: 'car',
            listingType: 'rent',
            vehicleDetails: {
                make: 'Renault',
                model: 'Clio',
                year: 2022,
                mileage: 15000,
                fuelType: 'petrol',
                transmission: 'manual',
                color: 'Red',
                seatingCapacity: 5,
                engineCapacity: 1.0,
                condition: 'used',
                features: ['Air Conditioning', 'Bluetooth', 'USB Port']
            },
            location: {
                city: 'Bizerte',
                state: 'Bizerte',
                country: 'Tunisia',
                coordinates: { latitude: 37.2744, longitude: 9.8739 }
            },
            pricing: {
                rentPrice: 120,
                rentPeriod: 'daily',
                currency: 'TND',
                deposit: 600,
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1583267746897-c27b47964923?w=800']
            },
            status: 'active',
            cancellationPolicy: 'flexible'
        },
        {
            owner: sellers[6]._id,
            title: 'Peugeot 3008 2023 - Crossover SUV',
            description: 'Stylish crossover with spacious interior and advanced safety features. Comfortable ride for families and road trips.',
            type: 'car',
            listingType: 'rent',
            vehicleDetails: {
                make: 'Peugeot',
                model: '3008',
                year: 2023,
                mileage: 9000,
                fuelType: 'diesel',
                transmission: 'automatic',
                color: 'Grey',
                seatingCapacity: 5,
                engineCapacity: 1.6,
                condition: 'certified',
                features: ['Leather Seats', 'Navigation System', 'Parking Sensors', 'Panoramic Roof', 'Apple CarPlay']
            },
            location: {
                city: 'Nabeul',
                state: 'Nabeul',
                country: 'Tunisia',
                coordinates: { latitude: 36.4561, longitude: 10.7356 }
            },
            pricing: {
                rentPrice: 280,
                rentPeriod: 'daily',
                currency: 'TND',
                deposit: 1200,
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800']
            },
            status: 'active',
            cancellationPolicy: 'moderate'
        },
        {
            owner: sellers[7]._id,
            title: 'Hyundai Tucson 2021 - Family SUV',
            description: 'Reliable family SUV with plenty of cargo space. Well-equipped with modern safety and convenience features.',
            type: 'car',
            listingType: 'sale',
            vehicleDetails: {
                make: 'Hyundai',
                model: 'Tucson',
                year: 2021,
                mileage: 28000,
                fuelType: 'hybrid',
                transmission: 'automatic',
                color: 'White',
                seatingCapacity: 5,
                engineCapacity: 1.6,
                condition: 'certified',
                features: ['Bluetooth', 'Parking Sensors', 'Cruise Control', 'Rear Camera', 'Lane Keeping Assist']
            },
            location: {
                city: 'Tunis',
                state: 'Tunis',
                country: 'Tunisia',
                coordinates: { latitude: 36.8065, longitude: 10.1815 }
            },
            pricing: {
                salePrice: 85000,
                currency: 'TND',
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800']
            },
            status: 'active',
            cancellationPolicy: 'moderate'
        },
        {
            owner: sellers[8]._id,
            title: 'Ford Ranger 2022 - Pickup Truck',
            description: 'Powerful pickup truck perfect for work or recreation. 4x4 capability, large cargo bed, and towing capacity.',
            type: 'truck',
            listingType: 'rent',
            vehicleDetails: {
                make: 'Ford',
                model: 'Ranger',
                year: 2022,
                mileage: 22000,
                fuelType: 'diesel',
                transmission: 'automatic',
                color: 'Black',
                seatingCapacity: 5,
                engineCapacity: 2.0,
                condition: 'used',
                features: ['4WD', 'Tow Package', 'Bluetooth', 'Cruise Control', 'Bed Liner']
            },
            location: {
                city: 'Carthage',
                state: 'Tunis',
                country: 'Tunisia',
                coordinates: { latitude: 36.8525, longitude: 10.3233 }
            },
            pricing: {
                rentPrice: 320,
                rentPeriod: 'daily',
                currency: 'TND',
                deposit: 1500,
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800']
            },
            status: 'active',
            cancellationPolicy: 'moderate'
        },
        {
            owner: sellers[9]._id,
            title: 'Citroen C3 2023 - City Car',
            description: 'Compact and nimble city car with charming design. Perfect for navigating tight streets and parking in small spaces.',
            type: 'car',
            listingType: 'rent',
            vehicleDetails: {
                make: 'Citroen',
                model: 'C3',
                year: 2023,
                mileage: 5000,
                fuelType: 'petrol',
                transmission: 'manual',
                color: 'Orange',
                seatingCapacity: 5,
                engineCapacity: 1.2,
                condition: 'certified',
                features: ['Air Conditioning', 'Bluetooth', 'Touchscreen Display', 'Rear Camera']
            },
            location: {
                city: 'Sousse',
                state: 'Sousse',
                country: 'Tunisia',
                coordinates: { latitude: 35.8256, longitude: 10.6369 }
            },
            pricing: {
                rentPrice: 140,
                rentPeriod: 'daily',
                currency: 'TND',
                deposit: 700,
                negotiable: true
            },
            media: {
                images: ['https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800']
            },
            status: 'active',
            cancellationPolicy: 'flexible'
        }
    ];
};

/**
 * Main seeding function
 */
const seedDatabase = async () => {
    try {
        console.log('🌱 Starting comprehensive database seeding...');
        
        // Connect to database
        await connectDB();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({ email: { $regex: /@gmail\.com$/ } });
        await Property.deleteMany({});
        await Vehicle.deleteMany({});
        
        // Create users
        console.log('👥 Creating 20 users (5 buyers, 5 sellers, 10 both)...');
        const usersData = await generateUsers();
        const users = await User.insertMany(usersData);
        console.log(`✅ Created ${users.length} users`);
        
        // Get sellers (indices 5-19 have role='seller')
        const sellers = users.slice(5);
        console.log(`📋 Found ${sellers.length} sellers/both users for listings`);
        
        // Create properties
        console.log('🏠 Creating 10 properties...');
        const propertiesData = generateProperties(sellers);
        const properties = await Property.insertMany(propertiesData);
        console.log(`✅ Created ${properties.length} properties`);
        
        // Update users with property listings
        for (let i = 0; i < properties.length; i++) {
            const property = properties[i];
            await User.findByIdAndUpdate(
                property.owner,
                { $push: { propertyListings: property._id } }
            );
        }
        console.log('✅ Updated users with property listings');
        
        // Create vehicles
        console.log('🚗 Creating 10 vehicles...');
        const vehiclesData = generateVehicles(sellers);
        const vehicles = await Vehicle.insertMany(vehiclesData);
        console.log(`✅ Created ${vehicles.length} vehicles`);
        
        // Update users with vehicle listings
        for (let i = 0; i < vehicles.length; i++) {
            const vehicle = vehicles[i];
            await User.findByIdAndUpdate(
                vehicle.owner,
                { $push: { vehicleListings: vehicle._id } }
            );
        }
        console.log('✅ Updated users with vehicle listings');
        
        // Summary
        console.log('\n📊 SEEDING SUMMARY:');
        console.log('==================');
        console.log(`👥 Users: ${users.length}`);
        console.log(`   - Buyers (clients): 5`);
        console.log(`   - Sellers: 5`);
        console.log(`   - Both: 10`);
        console.log(`🏠 Properties: ${properties.length}`);
        console.log(`🚗 Vehicles: ${vehicles.length}`);
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📝 Sample login credentials:');
        console.log('   Buyer: buyer1@gmail.com / password123');
        console.log('   Seller: seller1@gmail.com / password123');
        console.log('   Both: both1@gmail.com / password123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seeding
seedDatabase();
