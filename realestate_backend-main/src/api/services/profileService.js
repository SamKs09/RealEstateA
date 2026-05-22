const User = require('../models/userModel');
const Property = require('../models/propertyModel');
const Vehicle = require('../models/vehicleModel');
const Follow = require('../models/followModel');
const SellerReview = require('../models/sellerReviewModel');
const mongoose = require('mongoose');

class ProfileService {
  /**
   * Get seller profile data with statistics
   * @param {string} sellerId - The seller's user ID
   * @returns {Object} Seller profile data with statistics
   */
  async getSellerProfile(sellerId) {
    try {
      // Validate seller ID
      if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        throw new Error('Invalid seller ID');
      }

      // Get seller basic info
      const seller = await User.findById(sellerId)
        .select('firstName lastName fullName avatar preferences.location email role')
        .lean();

      if (!seller) {
        throw new Error('Seller not found');
      }

      // Get follower count
      const followerCount = await Follow.getFollowerCount(sellerId);

      // Get seller rating and review count
      const { averageRating, totalReviews } = await SellerReview.getSellerRating(sellerId);

      // Get sold/rent count
      const soldRentCount = await this.getSoldRentCount(sellerId);

      // Get cover photo from first active listing if no avatar
      let coverPhoto = null;
      if (!seller.avatar) {
        coverPhoto = await this.getDefaultCoverPhoto(sellerId);
      }

      return {
        id: seller._id,
        name: seller.fullName || `${seller.firstName} ${seller.lastName}`.trim(),
        firstName: seller.firstName,
        lastName: seller.lastName,
        avatar: seller.avatar,
        coverPhoto: coverPhoto,
        location: this.formatLocation(seller.preferences?.location),
        statistics: {
          followers: followerCount,
          rating: averageRating,
          soldRent: soldRentCount,
          totalReviews: totalReviews
        },
        role: seller.role
      };
    } catch (error) {
      // Re-throw validation errors as-is
      if (error.message === 'Invalid seller ID' || error.message === 'Seller not found') {
        throw error;
      }
      throw new Error(`Failed to get seller profile: ${error.message}`);
    }
  }

  /**
   * Get seller's active listings (properties and vehicles)
   * @param {string} sellerId - The seller's user ID
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of items per page
   * @returns {Object} Active listings with pagination info
   */
  async getSellerListings(sellerId, page = 1, limit = 20) {
    try {
      if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        throw new Error('Invalid seller ID');
      }

      const skip = (page - 1) * limit;

      // Get active properties
      const properties = await Property.find({
        owner: sellerId,
        status: 'active',
        'availability.isAvailable': true
      })
        .select('title media pricing propertyDetails location listingType')
        .sort({ createdAt: -1 })
        .lean();

      // Get active vehicles
      const vehicles = await Vehicle.find({
        owner: sellerId,
        status: 'active',
        'availability.isAvailable': true
      })
        .select('title media pricing vehicleDetails location listingType')
        .sort({ createdAt: -1 })
        .lean();

      // Combine and format listings
      const allListings = [
        ...properties.map(p => ({ ...p, type: 'property' })),
        ...vehicles.map(v => ({ ...v, type: 'vehicle' }))
      ];

      // Sort by creation date and paginate
      allListings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      const totalListings = allListings.length;
      const paginatedListings = allListings.slice(skip, skip + limit);

      return {
        listings: paginatedListings.map(listing => this.formatListing(listing)),
        totalListings,
        totalPages: Math.ceil(totalListings / limit),
        currentPage: page,
        hasNext: skip + paginatedListings.length < totalListings,
        hasPrev: page > 1
      };
    } catch (error) {
      // Re-throw validation errors as-is
      if (error.message === 'Invalid seller ID') {
        throw error;
      }
      throw new Error(`Failed to get seller listings: ${error.message}`);
    }
  }

  /**
   * Get count of sold/rented items for a seller
   * @param {string} sellerId - The seller's user ID
   * @returns {number} Count of sold/rented items
   */
  async getSoldRentCount(sellerId) {
    try {
      const [soldProperties, rentedProperties, soldVehicles, rentedVehicles] = await Promise.all([
        Property.countDocuments({ owner: sellerId, status: 'sold' }),
        Property.countDocuments({ owner: sellerId, status: 'rented' }),
        Vehicle.countDocuments({ owner: sellerId, status: 'sold' }),
        Vehicle.countDocuments({ owner: sellerId, status: 'rented' })
      ]);

      return soldProperties + rentedProperties + soldVehicles + rentedVehicles;
    } catch (error) {
      throw new Error(`Failed to get sold/rent count: ${error.message}`);
    }
  }

  /**
   * Get default cover photo from seller's first active listing
   * @param {string} sellerId - The seller's user ID
   * @returns {string|null} Cover photo URL or null
   */
  async getDefaultCoverPhoto(sellerId) {
    try {
      // Try to get from properties first
      const property = await Property.findOne({
        owner: sellerId,
        status: 'active',
        'media.images.0': { $exists: true }
      })
        .select('media.images')
        .lean();

      if (property && property.media?.images?.length > 0) {
        return property.media.images[0];
      }

      // Try to get from vehicles
      const vehicle = await Vehicle.findOne({
        owner: sellerId,
        status: 'active',
        'media.images.0': { $exists: true }
      })
        .select('media.images')
        .lean();

      if (vehicle && vehicle.media?.images?.length > 0) {
        return vehicle.media.images[0];
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Format location for display
   * @param {Object} location - Location object from user preferences
   * @returns {string} Formatted location string
   */
  formatLocation(location) {
    if (!location) return '';
    
    const { city, country } = location;
    
    if (city && country) {
      return `${city}, ${country}`;
    } else if (city) {
      return city;
    } else if (country) {
      return country;
    }
    
    return '';
  }

  /**
   * Format listing for API response
   * @param {Object} listing - Raw listing object
   * @returns {Object} Formatted listing object
   */
  formatListing(listing) {
    const firstImage = listing.media?.images?.[0] || null;
    
    return {
      id: listing._id,
      title: listing.title,
      type: listing.type,
      listingType: listing.listingType,
      image: firstImage,
      pricing: listing.pricing,
      details: listing.type === 'property' ? {
        bedrooms: listing.propertyDetails?.bedrooms,
        bathrooms: listing.propertyDetails?.bathrooms,
        area: listing.propertyDetails?.area
      } : {
        make: listing.vehicleDetails?.make,
        model: listing.vehicleDetails?.model,
        year: listing.vehicleDetails?.year
      },
      location: listing.location
    };
  }
}

module.exports = new ProfileService();