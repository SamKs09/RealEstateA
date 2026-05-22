const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    // Participants
    guest: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Listing reference
    listingType: {
      type: String,
      enum: ['property', 'vehicle'],
      required: true
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      index: true
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      index: true
    },
    
    // Booking details
    startDate: {
      type: Date,
      required: true,
      index: true
    },
    endDate: {
      type: Date,
      required: true,
      index: true
    },
    numberOfGuests: {
      type: Number,
      required: true,
      min: 1
    },
    
    // Pricing
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    proposedPrice: {
      type: Number,
      required: true,
      min: 0
    },
    finalPrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    
    // Offer details
    guestMessage: {
      type: String,
      maxlength: 500
    },
    
    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled', 'modification_requested'],
      default: 'pending',
      index: true
    },
    
    // Reference number (generated on acceptance)
    referenceNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    
    // Chat integration
    chatThreadId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatThread'
    },
    
    // Cancellation
    cancellationReason: {
      type: String,
      enum: ['change_of_plans', 'found_alternative', 'price_concerns', 
             'property_issues', 'emergency', 'other']
    },
    cancellationComments: {
      type: String,
      maxlength: 1000
    },
    cancelledAt: {
      type: Date
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Modification support
    modificationHistory: [{
      originalStartDate: Date,
      originalEndDate: Date,
      originalPrice: Number,
      modifiedAt: Date,
      modifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String
    }],
    
    // Timestamps
    acceptedAt: Date,
    declinedAt: Date,
    
    // Special requests
    specialRequests: {
      type: String,
      maxlength: 1000
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for performance
bookingSchema.index({ guest: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });
bookingSchema.index({ referenceNumber: 1 });

// Virtual for duration calculation
bookingSchema.virtual('durationDays').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const diffTime = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save validation
bookingSchema.pre('validate', function(next) {
  // Ensure either property or vehicle is set based on listingType
  if (this.listingType === 'property' && !this.property) {
    return next(new Error('Property ID required for property bookings'));
  } else if (this.listingType === 'vehicle' && !this.vehicle) {
    return next(new Error('Vehicle ID required for vehicle bookings'));
  }
  
  // Validate date range
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    return next(new Error('End date must be after start date'));
  }
  
  next();
});

// Method to generate reference number
bookingSchema.methods.generateReferenceNumber = function() {
  const prefix = this.listingType === 'property' ? 'PR' : 'VH';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  this.referenceNumber = `${prefix}${timestamp}${random}`;
  return this.referenceNumber;
};

// Ensure virtuals are included in JSON output
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);
