const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vehicleSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Owner is required'] },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long']
  },
  type: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: {
      values: ['car', 'motorcycle', 'truck', 'van', 'bus'],
      message: '{VALUE} is not a valid vehicle type'
    }
  },
  listingType: {
    type: String,
    required: [true, 'Listing type is required'],
    enum: {
      values: ['sale', 'rent'],
      message: '{VALUE} is not a valid listing type'
    }
  },
  vehicleDetails: {
    make: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Vehicle year is required'],
      min: [1900, 'Year cannot be before 1900'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
    },
    color: { type: String, trim: true },
    mileage: {
      type: Number,
      min: [0, 'Mileage cannot be negative']
    },
    fuelType: {
      type: String,
      enum: {
        values: ['petrol', 'diesel', 'electric', 'hybrid'],
        message: '{VALUE} is not a valid fuel type'
      }
    },
    transmission: {
      type: String,
      enum: {
        values: ['manual', 'automatic'],
        message: '{VALUE} is not a valid transmission type'
      }
    },
    condition: {
      type: String,
      enum: {
        values: ['new', 'used', 'certified'],
        message: '{VALUE} is not a valid condition'
      }
    },
    engineCapacity: {
      type: Number,
      min: [0, 'Engine capacity cannot be negative']
    },
    seatingCapacity: {
      type: Number,
      min: [1, 'Seating capacity must be at least 1'],
      max: [100, 'Seating capacity cannot exceed 100']
    },
    registrationNumber: { type: String, trim: true },
    insuranceExpiry: Date,
    features: [String]
  },
  location: {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: { type: String, trim: true },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    address: { type: String, trim: true },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  pricing: {
    salePrice: {
      type: Number,
      min: [0, 'Sale price cannot be negative']
    },
    rentPrice: {
      type: Number,
      min: [0, 'Rent price cannot be negative']
    },
    rentPeriod: {
      type: String,
      enum: {
        values: ['daily', 'weekly', 'monthly'],
        message: '{VALUE} is not a valid rent period'
      }
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true
    },
    deposit: {
      type: Number,
      min: [0, 'Deposit cannot be negative']
    },
    negotiable: { type: Boolean, default: false }
  },
  media: {
    images: [String],
    videos: [String],
    documents: [String]
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
    availableFrom: Date,
    availableTo: Date,
    minRentPeriod: String,
    maxRentPeriod: String
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'sold', 'rented', 'pending', 'archived'],
      message: '{VALUE} is not a valid status'
    },
    default: 'active'
  },
  views: { type: Number, default: 0 },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isPromoted: { type: Boolean, default: false },
  promotionExpiry: Date,
  boostPlan: { type: String, enum: ['1day', '3day', '7day'] },
  
  // Booking system fields
  cancellationPolicy: {
    type: String,
    enum: ['flexible', 'moderate', 'strict', 'custom'],
    default: 'moderate'
  },
  customCancellationPolicy: {
    type: String,
    maxlength: 1000
  }
}, { timestamps: true });

// Indexes for better query performance
vehicleSchema.index({ title: 'text', description: 'text' });
vehicleSchema.index({ 'location.city': 1 });
vehicleSchema.index({ 'vehicleDetails.make': 1 });
vehicleSchema.index({ 'vehicleDetails.model': 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);