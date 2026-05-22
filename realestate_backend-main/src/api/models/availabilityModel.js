const mongoose = require('mongoose');
const { Schema } = mongoose;

const availabilitySchema = new Schema(
  {
    // Listing reference
    listingType: {
      type: String,
      enum: ['property', 'vehicle'],
      required: true
    },
    listingId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Availability windows
    availableRanges: [{
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      notes: String
    }],
    
    // Blocked dates (manual blocks by owner)
    blockedRanges: [{
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      reason: String
    }],
    
    // Booked dates (automatically managed)
    bookedRanges: [{
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'Booking'
      }
    }],
    
    // Default availability settings
    defaultAvailable: {
      type: Boolean,
      default: true
    },
    
    // Minimum/maximum rental periods
    minRentalDays: {
      type: Number,
      min: 1,
      default: 1
    },
    maxRentalDays: {
      type: Number,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries (unique per listing)
availabilitySchema.index({ listingType: 1, listingId: 1 }, { unique: true });
availabilitySchema.index({ owner: 1 });

/**
 * Check if a date range is available for booking
 * @param {Date} startDate - Start date of the booking
 * @param {Date} endDate - End date of the booking
 * @returns {Boolean} - True if the range is available, false otherwise
 */
availabilitySchema.methods.isRangeAvailable = function(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check if dates fall within any booked range
  const isBooked = this.bookedRanges.some(range => {
    return (start < range.endDate && end > range.startDate);
  });
  
  if (isBooked) return false;
  
  // Check if dates fall within any blocked range
  const isBlocked = this.blockedRanges.some(range => {
    return (start < range.endDate && end > range.startDate);
  });
  
  if (isBlocked) return false;
  
  // If default is available, return true (no need to check available ranges)
  if (this.defaultAvailable) {
    return true;
  }
  
  // If default is not available, must be within an available range
  const isInAvailableRange = this.availableRanges.some(range => {
    return (start >= range.startDate && end <= range.endDate);
  });
  
  return isInAvailableRange;
};

/**
 * Add a booked range when a booking is accepted
 * @param {Date} startDate - Start date of the booking
 * @param {Date} endDate - End date of the booking
 * @param {ObjectId} bookingId - ID of the booking
 * @returns {Promise} - Saved availability document
 */
availabilitySchema.methods.addBookedRange = function(startDate, endDate, bookingId) {
  this.bookedRanges.push({ startDate, endDate, bookingId });
  return this.save();
};

/**
 * Remove a booked range when a booking is cancelled
 * @param {ObjectId} bookingId - ID of the booking to remove
 * @returns {Promise} - Saved availability document
 */
availabilitySchema.methods.removeBookedRange = function(bookingId) {
  this.bookedRanges = this.bookedRanges.filter(
    range => range.bookingId.toString() !== bookingId.toString()
  );
  return this.save();
};

/**
 * Check if rental duration meets minimum/maximum requirements
 * @param {Date} startDate - Start date of the booking
 * @param {Date} endDate - End date of the booking
 * @returns {Object} - { valid: Boolean, reason: String }
 */
availabilitySchema.methods.validateRentalDuration = function(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  if (this.minRentalDays && durationDays < this.minRentalDays) {
    return {
      valid: false,
      reason: `Minimum rental period is ${this.minRentalDays} day(s)`
    };
  }
  
  if (this.maxRentalDays && durationDays > this.maxRentalDays) {
    return {
      valid: false,
      reason: `Maximum rental period is ${this.maxRentalDays} day(s)`
    };
  }
  
  return { valid: true };
};

module.exports = mongoose.model('Availability', availabilitySchema);
