const express = require('express');
const router = express.Router();
const sellerCtrl = require('../controllers/sellerController');
const followCtrl = require('../controllers/followController');
const sellerReviewCtrl = require('../controllers/sellerReviewController');
const { auth } = require('../middleware/auth');

/**
 * Seller Profile Routes
 */

// Get seller profile data (public endpoint)
router.get('/:sellerId/profile', sellerCtrl.getSellerProfile);

// Get seller's active listings (public endpoint)
router.get('/:sellerId/listings', sellerCtrl.getSellerListings);

// Get seller's reviews (public endpoint)
router.get('/:sellerId/reviews', sellerReviewCtrl.getSellerReviews);

// Get seller's rating statistics (public endpoint)
router.get('/:sellerId/rating', sellerReviewCtrl.getSellerRating);

// Get reviewable items for a seller (public endpoint)
router.get('/:sellerId/reviewable-items', sellerReviewCtrl.getReviewableItems);

/**
 * Follow/Unfollow Routes (require authentication)
 */

// Follow a user
router.post('/users/:userId/follow', auth, followCtrl.followUser);

// Unfollow a user
router.delete('/users/:userId/follow', auth, followCtrl.unfollowUser);

// Get follow status
router.get('/users/:userId/follow-status', auth, followCtrl.getFollowStatus);

// Get followers of a user
router.get('/users/:userId/followers', followCtrl.getFollowers);

// Get users that a user is following
router.get('/users/:userId/following', followCtrl.getFollowing);

// Get follow statistics
router.get('/users/:userId/follow-stats', followCtrl.getFollowStats);

/**
 * Review Routes (require authentication)
 */

// Create a review
router.post('/reviews', auth, sellerReviewCtrl.createReview);

// Update a review (reviewer only, 30-day window)
router.put('/reviews/:reviewId', auth, sellerReviewCtrl.updateReview);

// Delete a review
router.delete('/reviews/:reviewId', auth, sellerReviewCtrl.deleteReview);

// Reply to a review (seller only)
router.post('/reviews/:reviewId/reply', auth, sellerReviewCtrl.replyToReview);

// Report / flag a review
router.post('/reviews/:reviewId/report', auth, sellerReviewCtrl.reportReview);

/**
 * Seller Offers Routes
 */

// Get seller's offers grouped by item
router.get('/offers', auth, sellerCtrl.getSellerOffers);

// Accept an offer
router.put('/offers/:offerId/accept', auth, sellerCtrl.acceptOffer);

// Decline an offer
router.put('/offers/:offerId/decline', auth, sellerCtrl.declineOffer);

// Create a new offer (for buyers, but grouped under seller/offer logic here)
router.post('/offers', auth, sellerCtrl.createOffer);

// Get buyer's own offers
router.get('/my-offers', auth, sellerCtrl.getBuyerOffers);

module.exports = router;
