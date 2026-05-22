const mongoose = require('mongoose');
const { Schema } = mongoose;

const PropertySchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['apartment', 'house', 'villa', 'hotel', 'commercial', 'land', 'office']
  },
  listingType: {
    type: String,
    required: true,
    enum: ['sale', 'rent']
  },
  propertyDetails: {
    bedrooms: { type: Number, min: 0 },
    bathrooms: { type: Number, min: 0 },
    area: { type: Number, min: 0 },
    areaUnit: { type: String, enum: ['sqft', 'sqm'] },
    furnishing: { type: String, enum: ['furnished', 'semi-furnished', 'unfurnished'] },
    parking: { type: Number, min: 0 },
    floor: { type: Number },
    totalFloors: { type: Number },
    age: { type: Number, min: 0 },
    amenities: [{ type: String }]
  },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
    zipCode: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    landmark: { type: String }
  },
  pricing: {
    salePrice: { type: Number, min: 0 },
    rentPrice: { type: Number, min: 0 },
    rentPeriod: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    currency: { type: String, default: 'USD' },
    deposit: { type: Number, min: 0 },
    maintenanceCharges: { type: Number, min: 0 },
    negotiable: { type: Boolean, default: false }
  },
  media: {
    images: [{ type: String }], // Store URLs or file paths
    videos: [{ type: String }],
    virtualTour: { type: String },
    documents: [{ type: String }]
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
    availableFrom: { type: Date },
    availableTo: { type: Date },
    minRentPeriod: { type: String },
    maxRentPeriod: { type: String }
  },
  features: [{ type: String }],
  rules: [{ type: String }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'sold', 'rented', 'pending'],
    default: 'active'
  },
  views: { type: Number, default: 0 },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPromoted: { type: Boolean, default: false },
  promotionExpiry: { type: Date },
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
  },
  capacity: {
    type: Number,
    min: 1,
    default: 1
  }
},
 {
    timestamps: true // Auto-add `createdAt` and `updatedAt`
  });



module.exports = mongoose.model('Property', PropertySchema);