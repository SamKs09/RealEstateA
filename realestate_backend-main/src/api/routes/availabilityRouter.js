const router = require("express").Router();

const availabilityCtrl = require("../controllers/availabilityController");
const { auth, optionalAuth } = require("../middleware/auth");

// Get availability for listing (public - no auth required)
router.get("/listing/:listingId", optionalAuth, availabilityCtrl.getAvailability);

// Check if date range is available (public - no auth required)
router.post("/listing/:listingId/check", optionalAuth, availabilityCtrl.checkDateRangeAvailable);

// Set availability ranges (requires auth - owner only)
router.post("/listing/:listingId", auth, availabilityCtrl.setAvailability);

// Update availability ranges (requires auth - owner only)
router.patch("/listing/:listingId", auth, availabilityCtrl.updateAvailability);

// Remove availability ranges (requires auth - owner only)
router.delete("/listing/:listingId", auth, availabilityCtrl.removeAvailability);

module.exports = router;
