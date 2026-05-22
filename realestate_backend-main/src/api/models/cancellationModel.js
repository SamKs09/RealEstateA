const mongoose = require('mongoose');
const { Schema } = mongoose;

const cancellationSchema = new Schema(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    role: {
      type: String,
      enum: ['guest', 'owner'],
      required: true
    },
    
    reason: {
      type: String,
      enum: ['change_of_plans', 'found_alternative', 'price_concerns', 
             'property_issues', 'emergency', 'other'],
      required: true
    },
    
    comments: {
      type: String,
      maxlength: 1000
    },
    
    // Cancellation policy applied
    policyApplied: {
      type: String
    },
    
    // Timing information
    daysBeforeCheckIn: {
      type: Number
    },
    
    // Metadata
    cancellationDate: {
      type: Date,
      default: Date.now
    },
    
    // Original booking details (snapshot for historical record)
    bookingSnapshot: {
      startDate: Date,
      endDate: Date,
      price: Number,
      status: String,
      listingType: String,
      listingId: Schema.Types.ObjectId,
      numberOfGuests: Number
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
cancellationSchema.index({ booking: 1 });
cancellationSchema.index({ cancelledBy: 1 });
cancellationSchema.index({ cancellationDate: 1 });

/**
 * Create a cancellation record with booking snapshot
 * @param {Object} booking - The booking document
 * @param {ObjectId} userId - ID of the user cancelling
 * @param {String} role - Role of the user ('guest' or 'owner')
 * @param {String} reason - Cancellation reason
 * @param {String} comments - Optional comments
 * @returns {Promise} - Created cancellation document
 */
cancellationSchema.statics.createFromBooking = async function(booking, userId, role, reason, comments = '') {
  // Calculate days before check-in
  const now = new Date();
  const checkInDate = new Date(booking.startDate);
  const daysBeforeCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
  
  // Create booking snapshot
  const bookingSnapshot = {
    startDate: booking.startDate,
    endDate: booking.endDate,
    price: booking.finalPrice || booking.proposedPrice,
    status: booking.status,
    listingType: booking.listingType,
    listingId: booking.property || booking.vehicle,
    numberOfGuests: booking.numberOfGuests
  };
  
  // Create cancellation record
  const cancellation = await this.create({
    booking: booking._id,
    cancelledBy: userId,
    role,
    reason,
    comments,
    daysBeforeCheckIn: daysBeforeCheckIn > 0 ? daysBeforeCheckIn : 0,
    bookingSnapshot
  });
  
  return cancellation;
};

/**
 * Get cancellation statistics for a user
 * @param {ObjectId} userId - User ID
 * @param {String} role - Role ('guest' or 'owner')
 * @returns {Promise} - Cancellation statistics
 */
cancellationSchema.statics.getUserCancellationStats = async function(userId, role) {
  const stats = await this.aggregate([
    {
      $match: {
        cancelledBy: userId,
        role: role
      }
    },
    {
      $group: {
        _id: '$reason',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const totalCancellations = stats.reduce((sum, item) => sum + item.count, 0);
  
  return {
    totalCancellations,
    byReason: stats
  };
};

module.exports = mongoose.model('Cancellation', cancellationSchema);
