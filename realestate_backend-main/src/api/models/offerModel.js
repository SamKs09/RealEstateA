const mongoose = require('mongoose');
const { Schema } = mongoose;

const offerSchema = new Schema(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
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
    type: {
      type: String,
      enum: ['property', 'car'],
      required: true
    },
    message: {
      type: String,
      default: 'Ready to negotiate price'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    price: {
      type: Number // Optional: if buyers can propose a specific price
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Ensure either property or vehicle is provided based on type
offerSchema.pre('validate', function(next) {
  if (this.type === 'property' && !this.property) {
    next(new Error('Property ID is required for property offers'));
  } else if (this.type === 'car' && !this.vehicle) {
    next(new Error('Vehicle ID is required for car offers'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Offer', offerSchema);
