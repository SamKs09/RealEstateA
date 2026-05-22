const mongoose = require('mongoose');
const Availability = require('../models/availabilityModel');
const Property = require('../models/propertyModel');
const Vehicle = require('../models/vehicleModel');

/**
 * Availability Controller
 * Manages availability windows for properties and vehicles
 */

/**
 * Get availability for a listing
 * GET /api/availability/listing/:listingId
 */
exports.getAvailability = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { listingType } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID'
      });
    }
    
    // Find availability record
    const query = { listingId };
    if (listingType) {
      query.listingType = listingType;
    }
    
    let availability = await Availability.findOne(query);
    
    // If no availability record exists, create default one
    if (!availability) {
      // Verify listing exists
      let listing;
      let owner;
      let type;
      
      if (listingType === 'property') {
        listing = await Property.findById(listingId);
        if (!listing) {
          return res.status(404).json({
            success: false,
            message: 'Property not found'
          });
        }
        owner = listing.owner;
        type = 'property';
      } else if (listingType === 'vehicle') {
        listing = await Vehicle.findById(listingId);
        if (!listing) {
          return res.status(404).json({
            success: false,
            message: 'Vehicle not found'
          });
        }
        owner = listing.owner;
        type = 'vehicle';
      } else {
        // Try to find in both collections
        listing = await Property.findById(listingId);
        if (listing) {
          owner = listing.owner;
          type = 'property';
        } else {
          listing = await Vehicle.findById(listingId);
          if (listing) {
            owner = listing.owner;
            type = 'vehicle';
          } else {
            return res.status(404).json({
              success: false,
              message: 'Listing not found'
            });
          }
        }
      }
      
      // Create default availability (all dates available)
      availability = await Availability.create({
        listingType: type,
        listingId,
        owner,
        defaultAvailable: true,
        availableRanges: [],
        blockedRanges: [],
        bookedRanges: []
      });
      
      console.log(`📅 Created default availability for ${type}: ${listingId}`);
    }
    
    return res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('❌ Error fetching availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching availability',
      error: error.message
    });
  }
};

/**
 * Set availability ranges for a listing
 * POST /api/availability/listing/:listingId
 */
exports.setAvailability = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { listingType, availableRanges, blockedRanges, defaultAvailable, minRentalDays, maxRentalDays } = req.body;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID'
      });
    }
    
    if (!listingType || !['property', 'vehicle'].includes(listingType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid listing type is required (property or vehicle)'
      });
    }
    
    // Verify listing exists and user owns it
    let listing;
    if (listingType === 'property') {
      listing = await Property.findById(listingId);
    } else {
      listing = await Vehicle.findById(listingId);
    }
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: `${listingType === 'property' ? 'Property' : 'Vehicle'} not found`
      });
    }
    
    // Authorization: only owner can set availability
    if (listing.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage availability for your own listings'
      });
    }
    
    // Validate date ranges
    const validateRanges = (ranges, rangeName) => {
      if (!ranges || !Array.isArray(ranges)) return true;
      
      for (const range of ranges) {
        if (!range.startDate || !range.endDate) {
          throw new Error(`${rangeName}: startDate and endDate are required`);
        }
        
        const start = new Date(range.startDate);
        const end = new Date(range.endDate);
        
        if (end <= start) {
          throw new Error(`${rangeName}: endDate must be after startDate`);
        }
      }
      return true;
    };
    
    try {
      validateRanges(availableRanges, 'Available ranges');
      validateRanges(blockedRanges, 'Blocked ranges');
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }
    
    // Find or create availability record
    let availability = await Availability.findOne({ listingType, listingId });
    
    if (availability) {
      // Update existing availability
      if (availableRanges !== undefined) availability.availableRanges = availableRanges;
      if (blockedRanges !== undefined) availability.blockedRanges = blockedRanges;
      if (defaultAvailable !== undefined) availability.defaultAvailable = defaultAvailable;
      if (minRentalDays !== undefined) availability.minRentalDays = minRentalDays;
      if (maxRentalDays !== undefined) availability.maxRentalDays = maxRentalDays;
      
      await availability.save();
      console.log(`📅 Updated availability for ${listingType}: ${listingId}`);
    } else {
      // Create new availability record
      availability = await Availability.create({
        listingType,
        listingId,
        owner: userId,
        availableRanges: availableRanges || [],
        blockedRanges: blockedRanges || [],
        bookedRanges: [],
        defaultAvailable: defaultAvailable !== undefined ? defaultAvailable : true,
        minRentalDays,
        maxRentalDays
      });
      console.log(`📅 Created availability for ${listingType}: ${listingId}`);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: availability
    });
  } catch (error) {
    console.error('❌ Error setting availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Error setting availability',
      error: error.message
    });
  }
};

/**
 * Update availability ranges
 * PATCH /api/availability/listing/:listingId
 */
exports.updateAvailability = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { addAvailableRanges, addBlockedRanges, removeAvailableRanges, removeBlockedRanges } = req.body;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID'
      });
    }
    
    const availability = await Availability.findOne({ listingId });
    
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability record not found'
      });
    }
    
    // Authorization: only owner can update availability
    if (availability.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage availability for your own listings'
      });
    }
    
    // Add new available ranges
    if (addAvailableRanges && Array.isArray(addAvailableRanges)) {
      availability.availableRanges.push(...addAvailableRanges);
    }
    
    // Add new blocked ranges
    if (addBlockedRanges && Array.isArray(addBlockedRanges)) {
      availability.blockedRanges.push(...addBlockedRanges);
    }
    
    // Remove available ranges (by index or date matching)
    if (removeAvailableRanges && Array.isArray(removeAvailableRanges)) {
      removeAvailableRanges.forEach(rangeToRemove => {
        availability.availableRanges = availability.availableRanges.filter(range => {
          return !(range.startDate.getTime() === new Date(rangeToRemove.startDate).getTime() &&
                   range.endDate.getTime() === new Date(rangeToRemove.endDate).getTime());
        });
      });
    }
    
    // Remove blocked ranges
    if (removeBlockedRanges && Array.isArray(removeBlockedRanges)) {
      removeBlockedRanges.forEach(rangeToRemove => {
        availability.blockedRanges = availability.blockedRanges.filter(range => {
          return !(range.startDate.getTime() === new Date(rangeToRemove.startDate).getTime() &&
                   range.endDate.getTime() === new Date(rangeToRemove.endDate).getTime());
        });
      });
    }
    
    await availability.save();
    
    console.log(`📅 Availability updated for listing: ${listingId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: availability
    });
  } catch (error) {
    console.error('❌ Error updating availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating availability',
      error: error.message
    });
  }
};

/**
 * Remove availability ranges
 * DELETE /api/availability/listing/:listingId
 */
exports.removeAvailability = async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID'
      });
    }
    
    const availability = await Availability.findOne({ listingId });
    
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability record not found'
      });
    }
    
    // Authorization: only owner can remove availability
    if (availability.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only manage availability for your own listings'
      });
    }
    
    // Reset to default availability (all dates available, no blocks)
    availability.availableRanges = [];
    availability.blockedRanges = [];
    availability.defaultAvailable = true;
    
    await availability.save();
    
    console.log(`📅 Availability reset for listing: ${listingId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Availability reset to default (all dates available)',
      data: availability
    });
  } catch (error) {
    console.error('❌ Error removing availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Error removing availability',
      error: error.message
    });
  }
};

/**
 * Check if a date range is available
 * POST /api/availability/listing/:listingId/check
 */
exports.checkDateRangeAvailable = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { startDate, endDate, listingType } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID'
      });
    }
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }
    
    const availability = await Availability.findOne({ listingId, listingType });
    
    if (!availability) {
      // No availability record means all dates are available by default
      return res.status(200).json({
        success: true,
        available: true,
        message: 'Dates are available'
      });
    }
    
    // Check rental duration requirements
    const durationValidation = availability.validateRentalDuration(startDate, endDate);
    if (!durationValidation.valid) {
      return res.status(200).json({
        success: true,
        available: false,
        reason: durationValidation.reason
      });
    }
    
    // Check if range is available
    const isAvailable = availability.isRangeAvailable(startDate, endDate);
    
    return res.status(200).json({
      success: true,
      available: isAvailable,
      message: isAvailable ? 'Dates are available' : 'Dates are not available'
    });
  } catch (error) {
    console.error('❌ Error checking availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message
    });
  }
};

module.exports = exports;
