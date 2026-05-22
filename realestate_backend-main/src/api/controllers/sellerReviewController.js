const reviewService = require('../services/reviewService');
const logger = require('../utils/logger');

/**
 * Create a new review for a seller's item
 */
exports.createReview = async (req, res) => {
  try {
    const { sellerId, itemId, itemType, rating, comment } = req.body;
    const reviewerId = req.user._id;

    const result = await reviewService.createReview({
      reviewerId,
      sellerId,
      itemId,
      itemType,
      rating,
      comment
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.review
    });
  } catch (error) {
    logger.error(`Create review error: ${error.message}`);
    
    if (error.message.includes('All fields are required') ||
        error.message.includes('Invalid ID format') ||
        error.message.includes('Rating must be between') ||
        error.message.includes('Comment must be between') ||
        error.message.includes('Invalid item type') ||
        error.message.includes('not found') ||
        error.message.includes('does not belong to') ||
        error.message.includes('already reviewed')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get reviews for a seller
 */
exports.getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await reviewService.getSellerReviews(
      sellerId, 
      parseInt(page), 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Get seller reviews error: ${error.message}`);
    
    if (error.message.includes('Invalid seller ID')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get seller's rating statistics
 */
exports.getSellerRating = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const result = await reviewService.getSellerRating(sellerId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Get seller rating error: ${error.message}`);
    
    if (error.message.includes('Invalid seller ID')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get reviewable items for a seller
 */
exports.getReviewableItems = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const items = await reviewService.getReviewableItems(sellerId);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    logger.error(`Get reviewable items error: ${error.message}`);
    
    if (error.message.includes('Invalid seller ID')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Delete a review (by reviewer only)
 */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const result = await reviewService.deleteReview(reviewId, userId);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error(`Delete review error: ${error.message}`);
    
    if (error.message.includes('Invalid ID format') ||
        error.message.includes('Review not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    
    if (error.message.includes('You can only delete')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update a review (reviewer only, within 30 days)
 */
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const { rating, comment } = req.body;

    const result = await reviewService.updateReview(reviewId, userId.toString(), { rating, comment });

    res.json({ success: true, message: result.message });
  } catch (error) {
    logger.error(`Update review error: ${error.message}`);

    if (error.message.includes('Invalid ID') || error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('only edit') || error.message.includes('30 days')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Seller replies to a review
 */
exports.replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const sellerId = req.user._id;
    const { replyText } = req.body;

    const result = await reviewService.replyToReview(reviewId, sellerId.toString(), replyText);

    res.json({ success: true, message: result.message });
  } catch (error) {
    logger.error(`Reply to review error: ${error.message}`);

    if (error.message.includes('Invalid ID') || error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('Only the seller') || error.message.includes('Reply text')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Report / flag a review for admin attention
 */
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const { reason } = req.body;

    const result = await reviewService.reportReview(reviewId, userId.toString(), reason);

    res.json({ success: true, message: result.message });
  } catch (error) {
    logger.error(`Report review error: ${error.message}`);

    if (error.message.includes('Invalid ID') || error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('cannot report your own')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};