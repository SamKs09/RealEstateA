const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { auth, optionalAuth } = require("../middleware/auth");

// Get analytics for a specific listing
router.get("/listing/:listingId", auth, analyticsController.getListingAnalytics);

// Record a view (optional auth for anonymous views)
router.post("/listing/:listingId/view", optionalAuth, analyticsController.recordView);

// Record a save/favorite (requires auth)
router.post("/listing/:listingId/save", auth, analyticsController.recordSave);

// Remove a save/favorite (requires auth)
router.delete("/listing/:listingId/save", auth, analyticsController.removeSave);

// Record an inquiry (requires auth)
router.post("/listing/:listingId/inquiry", auth, analyticsController.recordInquiry);

// Get all analytics for seller's listings (requires auth)
router.get("/seller/summary", auth, analyticsController.getSellerAnalytics);

module.exports = router;
