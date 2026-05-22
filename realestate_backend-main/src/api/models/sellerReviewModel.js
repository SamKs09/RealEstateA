const mongoose = require('mongoose');
const { Schema } = mongoose;

const sellerReviewSchema = new Schema({
  reviewer: {
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
  itemId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'itemType'
  },
  itemType: {
    type: String,
    required: true,
    enum: ['Property', 'Vehicle']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    minlength: [10, 'Review comment must be at least 10 characters long'],
    maxlength: [500, 'Review comment cannot exceed 500 characters']
  },
  // Seller reply to the review
  reply: {
    text: { type: String, trim: true, maxlength: [500, 'Reply cannot exceed 500 characters'] },
    createdAt: { type: Date }
  },
  // True when the review is linked to a verified completed booking
  isVerified: {
    type: Boolean,
    default: false
  },
  // Flagged for admin attention
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    trim: true,
    maxlength: [300, 'Flag reason cannot exceed 300 characters']
  },
  // Tracks last edit timestamp
  editedAt: {
    type: Date
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound index to prevent duplicate reviews by same reviewer on same item
sellerReviewSchema.index({ reviewer: 1, itemId: 1 }, { unique: true });

// Index for getting reviews for a seller
sellerReviewSchema.index({ seller: 1, createdAt: -1 });

// Index for getting reviews by a reviewer
sellerReviewSchema.index({ reviewer: 1, createdAt: -1 });

// Index for getting reviews for a specific item
sellerReviewSchema.index({ itemId: 1, createdAt: -1 });

// Pre-save middleware to validate that reviewer and seller are different
sellerReviewSchema.pre('save', function(next) {
  if (this.reviewer.equals(this.seller)) {
    return next(new Error('Users cannot review themselves'));
  }
  next();
});

// Static method to calculate average rating for a seller
sellerReviewSchema.statics.getSellerRating = async function(sellerId) {
  const result = await this.aggregate([
    { $match: { seller: sellerId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  if (result.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }
  
  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews
  };
};

// Static method to get reviews for a seller with pagination
sellerReviewSchema.statics.getSellerReviews = async function(sellerId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const reviews = await this.find({ seller: sellerId })
    .populate('reviewer', 'firstName lastName fullName avatar')
    .populate('itemId', 'title media')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
  const totalReviews = await this.countDocuments({ seller: sellerId });
  
  return {
    reviews,
    totalReviews,
    totalPages: Math.ceil(totalReviews / limit),
    currentPage: page,
    hasNext: skip + reviews.length < totalReviews,
    hasPrev: page > 1
  };
};

module.exports = mongoose.model('SellerReview', sellerReviewSchema);