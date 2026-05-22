const SellerReview = require('../models/sellerReviewModel');
const Property = require('../models/propertyModel');
const Vehicle = require('../models/vehicleModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const { sendNotification } = require('../utils/notificationHelper');
const { getTemplate } = require('../utils/notificationTemplates');

class ReviewService {
  /**
   * Create a new review for a seller's item
   * @param {Object} reviewData - Review data
   * @returns {Object} Created review
   */
  async createReview(reviewData) {
    try {
      const { reviewerId, sellerId, itemId, itemType, rating, comment } = reviewData;

      // Validate required fields
      if (!reviewerId || !sellerId || !itemId || !itemType || !rating || !comment) {
        throw new Error('All fields are required');
      }

      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(reviewerId) || 
          !mongoose.Types.ObjectId.isValid(sellerId) || 
          !mongoose.Types.ObjectId.isValid(itemId)) {
        throw new Error('Invalid ID format');
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Validate comment length
      if (comment.trim().length < 10 || comment.trim().length > 500) {
        throw new Error('Comment must be between 10 and 500 characters');
      }

      // Validate item type
      if (!['Property', 'Vehicle'].includes(itemType)) {
        throw new Error('Invalid item type');
      }

      // Check if users exist
      const [reviewer, seller] = await Promise.all([
        User.findById(reviewerId).select('_id'),
        User.findById(sellerId).select('_id')
      ]);

      if (!reviewer) {
        throw new Error('Reviewer not found');
      }

      if (!seller) {
        throw new Error('Seller not found');
      }

      // Verify the item exists and belongs to the seller
      const ItemModel = itemType === 'Property' ? Property : Vehicle;
      const item = await ItemModel.findById(itemId).select('owner');

      if (!item) {
        throw new Error(`${itemType} not found`);
      }

      if (item.owner.toString() !== sellerId) {
        throw new Error(`${itemType} does not belong to the specified seller`);
      }

      // Check for duplicate review
      const existingReview = await SellerReview.findOne({
        reviewer: reviewerId,
        itemId: itemId
      });

      if (existingReview) {
        throw new Error('You have already reviewed this item');
      }

      // Create the review
      const review = new SellerReview({
        reviewer: reviewerId,
        seller: sellerId,
        itemId: itemId,
        itemType: itemType,
        rating: rating,
        comment: comment.trim()
      });

      await review.save();

      // Notify the seller about the new review
      try {
        const reviewerUser = await User.findById(reviewerId).select('firstName lastName fullName').lean();
        const reviewerName = reviewerUser?.fullName || `${reviewerUser?.firstName || ''} ${reviewerUser?.lastName || ''}`.trim() || 'Someone';
        const ItemModel = itemType === 'Property' ? Property : Vehicle;
        const itemDoc = await ItemModel.findById(itemId).select('title').lean();
        const tpl = getTemplate('new_review', reviewerName, itemDoc?.title);
        await sendNotification(sellerId, 'new_review', tpl.title, tpl.body, { reviewId: review._id.toString(), deepLink: `/seller-profile/${sellerId}` });
      } catch (_) {}

      // Populate the review before returning
      const populatedReview = await SellerReview.findById(review._id)
        .populate('reviewer', 'firstName lastName fullName avatar')
        .populate('seller', 'firstName lastName fullName')
        .populate('itemId', 'title media')
        .lean();

      return {
        success: true,
        message: 'Review created successfully',
        review: populatedReview
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('You have already reviewed this item');
      }
      throw new Error(`Failed to create review: ${error.message}`);
    }
  }

  /**
   * Get reviews for a seller with pagination
   * @param {string} sellerId - Seller's user ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Object} Reviews with pagination info
   */
  async getSellerReviews(sellerId, page = 1, limit = 20) {
    try {
      if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        throw new Error('Invalid seller ID');
      }

      const result = await SellerReview.getSellerReviews(sellerId, page, limit);

      // Format reviews for response
      const formattedReviews = result.reviews.map(review => ({
        id: review._id,
        reviewer: {
          id: review.reviewer._id,
          name: review.reviewer.fullName || `${review.reviewer.firstName} ${review.reviewer.lastName}`.trim(),
          avatar: review.reviewer.avatar
        },
        item: {
          id: review.itemId._id,
          title: review.itemId.title,
          type: review.itemType.toLowerCase(),
          image: review.itemId.media?.images?.[0] || null
        },
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        relativeDate: this.getRelativeDate(review.createdAt),
        isVerified: review.isVerified || false,
        isFlagged: review.isFlagged || false,
        reply: review.reply?.text ? { text: review.reply.text, createdAt: review.reply.createdAt } : null
      }));

      return {
        reviews: formattedReviews,
        pagination: {
          totalReviews: result.totalReviews,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev
        }
      };
    } catch (error) {
      throw new Error(`Failed to get seller reviews: ${error.message}`);
    }
  }

  /**
   * Get seller's rating statistics
   * @param {string} sellerId - Seller's user ID
   * @returns {Object} Rating statistics
   */
  async getSellerRating(sellerId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        throw new Error('Invalid seller ID');
      }

      const { averageRating, totalReviews } = await SellerReview.getSellerRating(sellerId);

      return {
        averageRating,
        totalReviews,
        formattedRating: totalReviews > 0 ? `${averageRating} (${totalReviews} reviews)` : 'No reviews yet'
      };
    } catch (error) {
      throw new Error(`Failed to get seller rating: ${error.message}`);
    }
  }

  /**
   * Get active items for a seller that can be reviewed
   * @param {string} sellerId - Seller's user ID
   * @returns {Array} List of reviewable items
   */
  async getReviewableItems(sellerId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        throw new Error('Invalid seller ID');
      }

      // Get active properties
      const properties = await Property.find({
        owner: sellerId,
        status: 'active',
        'availability.isAvailable': true
      })
        .select('title media')
        .lean();

      // Get active vehicles
      const vehicles = await Vehicle.find({
        owner: sellerId,
        status: 'active',
        'availability.isAvailable': true
      })
        .select('title media')
        .lean();

      // Format items
      const items = [
        ...properties.map(p => ({
          id: p._id,
          title: p.title,
          type: 'property',
          image: p.media?.images?.[0] || null
        })),
        ...vehicles.map(v => ({
          id: v._id,
          title: v.title,
          type: 'vehicle',
          image: v.media?.images?.[0] || null
        }))
      ];

      return items;
    } catch (error) {
      throw new Error(`Failed to get reviewable items: ${error.message}`);
    }
  }

  /**
   * Delete a review (by reviewer only)
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID (must be the reviewer)
   * @returns {Object} Deletion result
   */
  async deleteReview(reviewId, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(reviewId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid ID format');
      }

      const review = await SellerReview.findById(reviewId);

      if (!review) {
        throw new Error('Review not found');
      }

      if (review.reviewer.toString() !== userId) {
        throw new Error('You can only delete your own reviews');
      }

      await SellerReview.findByIdAndDelete(reviewId);

      return {
        success: true,
        message: 'Review deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  }

  /**
   * Update a review (reviewer only, within 30 days)
   */
  async updateReview(reviewId, userId, { rating, comment }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(reviewId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid ID format');
      }

      const review = await SellerReview.findById(reviewId);
      if (!review) throw new Error('Review not found');
      if (review.reviewer.toString() !== userId) throw new Error('You can only edit your own reviews');

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (review.createdAt < thirtyDaysAgo) throw new Error('Reviews can only be edited within 30 days of posting');

      if (rating !== undefined) review.rating = rating;
      if (comment !== undefined) review.comment = comment.trim();
      review.editedAt = new Date();
      await review.save();

      return { success: true, message: 'Review updated successfully' };
    } catch (error) {
      throw new Error(`Failed to update review: ${error.message}`);
    }
  }

  /**
   * Reply to a review (seller only, one reply per review)
   */
  async replyToReview(reviewId, sellerId, replyText) {
    try {
      if (!mongoose.Types.ObjectId.isValid(reviewId) || !mongoose.Types.ObjectId.isValid(sellerId)) {
        throw new Error('Invalid ID format');
      }
      if (!replyText || replyText.trim().length < 2) throw new Error('Reply text is required');
      if (replyText.trim().length > 500) throw new Error('Reply cannot exceed 500 characters');

      const review = await SellerReview.findById(reviewId);
      if (!review) throw new Error('Review not found');
      if (review.seller.toString() !== sellerId) throw new Error('Only the seller can reply to this review');

      review.reply = { text: replyText.trim(), createdAt: new Date() };
      await review.save();

      // Notify the reviewer that the seller replied
      try {
        const sellerUser = await User.findById(sellerId).select('firstName lastName fullName').lean();
        const sellerName = sellerUser?.fullName || `${sellerUser?.firstName || ''} ${sellerUser?.lastName || ''}`.trim() || 'The seller';
        const tpl = getTemplate('review_reply', sellerName);
        await sendNotification(review.reviewer, 'review_reply', tpl.title, tpl.body, { reviewId: reviewId.toString(), deepLink: `/seller-profile/${sellerId}` });
      } catch (_) {}

      return { success: true, message: 'Reply posted successfully' };
    } catch (error) {
      throw new Error(`Failed to reply to review: ${error.message}`);
    }
  }

  /**
   * Report/flag a review for admin attention
   */
  async reportReview(reviewId, userId, reason) {
    try {
      if (!mongoose.Types.ObjectId.isValid(reviewId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid ID format');
      }

      const review = await SellerReview.findById(reviewId);
      if (!review) throw new Error('Review not found');
      if (review.reviewer.toString() === userId) throw new Error('You cannot report your own review');

      review.isFlagged = true;
      review.flagReason = reason ? reason.trim().slice(0, 300) : 'Reported by user';
      await review.save();

      return { success: true, message: 'Review reported successfully' };
    } catch (error) {
      throw new Error(`Failed to report review: ${error.message}`);
    }
  }

  /**
   * Get relative date string
   * @param {Date} date - Date to format
   * @returns {string} Relative date string
   */
  getRelativeDate(date) {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInWeeks === 1) {
      return '1 week ago';
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks} weeks ago`;
    } else if (diffInMonths === 1) {
      return '1 month ago';
    } else {
      return `${diffInMonths} months ago`;
    }
  }
}

module.exports = new ReviewService();