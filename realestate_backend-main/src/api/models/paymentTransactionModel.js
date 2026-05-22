const mongoose = require('mongoose');

const { Schema } = mongoose;

const paymentTransactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['pack_purchase', 'property_boost', 'vehicle_boost', 'property_booking'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    pack: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
    },
    boostPlan: {
      type: String,
      enum: ['1day', '3day', '7day'],
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'TND',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    flouciPaymentId: {
      type: String,
      default: null,
      index: true,
    },
    checkoutUrl: {
      type: String,
      default: null,
    },
    lastGatewayStatus: {
      type: String,
      default: null,
    },
    gatewayRequest: {
      type: Schema.Types.Mixed,
      default: null,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);