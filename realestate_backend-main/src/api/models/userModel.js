
const { Schema } = require("mongoose");
const mongoose = require("mongoose");

const userSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Set password for user"],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    phoneNumber: {
      type: String,
      unique: true,
    },
    userName: {
      type: String,
      unique: true,
      sparse: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    fullName: {
      type: String,
    },
    latestOtp: {
      type: String,
    },
    otpExpiry: {
      type: String,
    },
    avatar: {
      type: String,
    },
    city: {
      type: String,
    },
    role: {
      type: String,
      enum: ['client', 'seller', 'renter', 'support', 'admin'],
      default: 'client'
    },
    interest: {
      type: String,
      enum: ['property', 'cars', 'both'],
      default: 'property'
    },
    preferences: {
      propertyTypes: [String],   // e.g. ['apartment', 'house']
      vehicleTypes: [String],    // e.g. ['car', 'motorcycle']
      priceRange: {
        min: Number,
        max: Number
      },
      location: {
        city: String,
        state: String,
        country: String,
        coordinates: {
          latitude: Number,
          longitude: Number
        }
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false }
      }
    },
    verification: {
      email: { type: Boolean, default: false },    // you already have emailVerified, can keep or remove old one
      phone: { type: Boolean, default: false },    // same for phoneVerified
      identity: { type: Boolean, default: false }
    },
    sellerVerification: {
      documentType: {
        type: String,
        enum: ['cin', 'passport'],
        default: 'cin'
      },
      identityFront: {
        type: String,
      },
      identityBack: {
        type: String,
      },
      faceVideo: {
        type: String,
      },
      status: {
        type: String,
        enum: ['not_submitted', 'pending', 'approved', 'rejected'],
        default: 'not_submitted'
      },
      submittedAt: {
        type: Date,
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      notes: {
        type: String,
      }
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    lastLogin: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    propertyListings: [{
      type: Schema.Types.ObjectId,
      ref: 'Property',
      index: true
    }],
    vehicleListings: [{
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      index: true
    }],

    // User's favorites
    favoriteProperties: [{
      type: Schema.Types.ObjectId,
      ref: 'Property',
      index: true
    }],
    favoriteVehicles: [{
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      index: true
    }],

    pack: {
      type: String,
      enum: ['freemium', 'bronze', 'silver', 'gold', 'platinum'],
      default: 'freemium'
    },

    listingConfig: {
      status: { type: Boolean, default: true },
      number: { type: Number, default: 1 }, 

    },
        
    boost: {
      status: { type: Boolean, default: false }, 
      number: { type: Number, default: 0 } 
    },
    trial: {
      isUsed: { type: Boolean, default: false },
      startDate: { type: Date },
      endDate: { type: Date },
      status: { type: String, enum: ['none', 'active', 'expired'], default: 'none' }
    },
    pushTokens: [{
      token: String,
      platform: String,
      createdAt: { type: Date, default: Date.now }
    }]
  },
  { versionKey: false, timestamps: true }
);

// Index for better performance on favorites queries
userSchema.index({ 'favorites': 1 });

// Virtual for favorites count
userSchema.virtual('favoritesCount').get(function () {
  return this.favorites ? this.favorites.length : 0;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Pre-save hook to sanitize role (fix for legacy array/buyer issue)
userSchema.pre('save', function(next) {
  if (Array.isArray(this.role)) {
    this.role = this.role[0] === 'buyer' ? 'client' : this.role[0];
  }
  if (this.role === 'buyer') {
    this.role = 'client';
  }
  next();
});

module.exports = mongoose.model("User", userSchema);