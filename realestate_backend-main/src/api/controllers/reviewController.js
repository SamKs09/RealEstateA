// controllers/reviewController.js
const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const mongoose = require('mongoose');

// Dynamic model loading based on listingType
const getListingModel = (listingType) => {
  switch (listingType) {
    case 'Property':
      return require('../models/propertyModel');
    case 'Vehicle':
      return require('../models/vehicleModel');
    default:
      throw new Error(`Unknown listing type: ${listingType}`);
  }
};

class ReviewController {
  // Get reviews for a specific listing
  async getListingReviews(req, res) {
    try {
      const { listingId } = req.params;
      const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

      // Validate listingId
      if (!mongoose.Types.ObjectId.isValid(listingId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid listing ID'
        });
      }

      const skip = (page - 1) * limit;

      // Get reviews with populated reviewer information
      const reviews = await Review.find({ listingId })
        .populate('reviewer', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count for pagination
      const totalReviews = await Review.countDocuments({ listingId });

      // Calculate average rating and category ratings
      const ratingStats = await Review.aggregate([
        { $match: { listingId: new mongoose.Types.ObjectId(listingId) } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            averageCleanliness: { $avg: '$categories.cleanliness' },
            averageCommunication: { $avg: '$categories.communication' },
            averageAccuracy: { $avg: '$categories.accuracy' },
            averageValue: { $avg: '$categories.value' },
            totalReviews: { $sum: 1 },
            ratingDistribution: {
              $push: '$rating'
            }
          }
        }
      ]);

      // Calculate rating distribution
      let distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      if (ratingStats.length > 0 && ratingStats[0].ratingDistribution) {
        ratingStats[0].ratingDistribution.forEach(rating => {
          distribution[rating] = (distribution[rating] || 0) + 1;
        });
      }

      const stats = ratingStats.length > 0 ? {
        averageRating: Math.round(ratingStats[0].averageRating * 10) / 10,
        averageCleanliness: Math.round(ratingStats[0].averageCleanliness * 10) / 10,
        averageCommunication: Math.round(ratingStats[0].averageCommunication * 10) / 10,
        averageAccuracy: Math.round(ratingStats[0].averageAccuracy * 10) / 10,
        averageValue: Math.round(ratingStats[0].averageValue * 10) / 10,
        totalReviews: ratingStats[0].totalReviews,
        ratingDistribution: distribution
      } : {
        averageRating: 0,
        averageCleanliness: 0,
        averageCommunication: 0,
        averageAccuracy: 0,
        averageValue: 0,
        totalReviews: 0,
        ratingDistribution: distribution
      };

      res.status(200).json({
        success: true,
        data: {
          reviews,
          stats,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalReviews / limit),
            totalReviews,
            hasNext: skip + reviews.length < totalReviews,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Error fetching listing reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching reviews',
        error: error.message
      });
    }
  }

  // Get reviews for a specific user
  async getUserReviews(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, type = 'received' } = req.query;

      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const skip = (page - 1) * limit;
      const query = type === 'given' ? { reviewer: userId } : { reviewee: userId };

      // Get reviews with populated information
      const populateFields = type === 'given' 
        ? 'reviewee listingId bookingId'
        : 'reviewer listingId bookingId';

      const reviews = await Review.find(query)
        .populate('reviewer', 'name avatar')
        .populate('reviewee', 'name avatar')
        .populate('listingId', 'title images')
        .populate('bookingId', 'startDate endDate')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const totalReviews = await Review.countDocuments(query);

      // Calculate user's average rating (only for received reviews)
      let averageRating = 0;
      if (type === 'received' && totalReviews > 0) {
        const ratingStats = await Review.aggregate([
          { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' }
            }
          }
        ]);
        averageRating = ratingStats.length > 0 
          ? Math.round(ratingStats[0].averageRating * 10) / 10 
          : 0;
      }

      res.status(200).json({
        success: true,
        data: {
          reviews,
          averageRating,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalReviews / limit),
            totalReviews,
            hasNext: skip + reviews.length < totalReviews,
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user reviews',
        error: error.message
      });
    }
  }

  // Create a new review
  async createReview(req, res) {
    try {
      const { bookingId, rating, comment, categories } = req.body;
      const reviewerId = req.user.id;

      // Check if booking exists and is completed
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Get the listing based on listingType
      let listing;
      try {
        const ListingModel = getListingModel(booking.listingType);
        listing = await ListingModel.findById(booking.listingId);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid listing type'
        });
      }

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Listing not found'
        });
      }

      // Validate booking completion (should be past end date)
      if (new Date() < new Date(booking.endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot review before booking completion'
        });
      }

      // Validate booking status
      if (booking.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Can only review completed bookings'
        });
      }

      // Check if reviewer is the guest
      if (booking.guest.toString() !== reviewerId) {
        return res.status(403).json({
          success: false,
          message: 'Only the guest can review this booking'
        });
      }

      // Check if review already exists for this booking
      const existingReview = await Review.findOne({ bookingId });
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'Review already exists for this booking'
        });
      }

      // Get the listing owner (reviewee)
      const revieweeId = listing.owner;

      // Create the review
      const review = new Review({
        reviewer: reviewerId,
        reviewee: revieweeId,
        listingId: listing._id,
        listingType: booking.listingType, // Use listingType from booking
        bookingId,
        rating,
        comment,
        categories
      });

      await review.save();

      // Update user's average rating
      await this.updateUserRating(revieweeId);

      // Populate the review before returning
      const populatedReview = await Review.findById(review._id)
        .populate('reviewer', 'name avatar')
        .populate('reviewee', 'name avatar')
        .populate('listingId', 'title')
        .populate('bookingId', 'startDate endDate');

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: populatedReview
      });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating review',
        error: error.message
      });
    }
  }

  // Update a review
  async updateReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment, categories } = req.body;
      const userId = req.user.id;

      // Find the review
      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Validate ownership
      if (review.reviewer.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own reviews'
        });
      }

      // Check if review is within editable timeframe (e.g., 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (review.createdAt < thirtyDaysAgo) {
        return res.status(400).json({
          success: false,
          message: 'Review can only be updated within 30 days of creation'
        });
      }

      // Update the review
      const updateData = {};
      if (rating !== undefined) updateData.rating = rating;
      if (comment !== undefined) updateData.comment = comment;
      if (categories !== undefined) updateData.categories = categories;

      const updatedReview = await Review.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('reviewer', 'name avatar')
        .populate('reviewee', 'name avatar')
        .populate('listingId', 'title')
        .populate('bookingId', 'startDate endDate');

      // Recalculate reviewee's average rating
      await this.updateUserRating(review.reviewee);

      res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: updatedReview
      });
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating review',
        error: error.message
      });
    }
  }

  // Delete a review
  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Find the review
      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Validate ownership (allow both reviewer and reviewee to delete)
      const isReviewer = review.reviewer.toString() === userId;
      const isReviewee = review.reviewee.toString() === userId;

      if (!isReviewer && !isReviewee) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete reviews you wrote or received'
        });
      }

      // Store reviewee ID for rating recalculation
      const revieweeId = review.reviewee;

      // Delete the review
      await Review.findByIdAndDelete(id);

      // Recalculate reviewee's average rating
      await this.updateUserRating(revieweeId);

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting review',
        error: error.message
      });
    }
  }

  // Helper method to update user's average rating
  async updateUserRating(userId) {
    try {
      const ratingStats = await Review.aggregate([
        { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      const averageRating = ratingStats.length > 0 
        ? Math.round(ratingStats[0].averageRating * 10) / 10 
        : 0;
      
      const totalReviews = ratingStats.length > 0 
        ? ratingStats[0].totalReviews 
        : 0;

      // Update user document with new rating
      await User.findByIdAndUpdate(userId, {
        'rating.average': averageRating,
        'rating.count': totalReviews
      });
    } catch (error) {
      console.error('Error updating user rating:', error);
      // Don't throw error as this is a helper method
    }
  }
}

module.exports = ReviewController;