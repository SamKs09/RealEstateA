// routes/reviews.js
const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const { auth: authenticate } = require('../middleware/auth');
const { validateReview, validateReviewUpdate } = require('../middleware/validation');

const reviewController = new ReviewController();

// Get reviews for a specific listing
router.get('/listing/:listingId', reviewController.getListingReviews);

// Get reviews for a specific user
router.get('/user/:userId', reviewController.getUserReviews);

// Create a new review (requires authentication)
router.post('/', authenticate, validateReview, reviewController.createReview);

// Update a review (requires authentication)
router.put('/:id', authenticate, validateReviewUpdate, reviewController.updateReview);

// Delete a review (requires authentication)
router.delete('/:id', authenticate, reviewController.deleteReview);

module.exports = router;