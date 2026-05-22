const router = require("express").Router();

const bookingCtrl = require("../controllers/bookingController");
const { auth } = require("../middleware/auth");

// All booking routes require authentication
router.use(auth);

// Create new booking offer
router.post("/create", bookingCtrl.createBooking);

// Get guest's bookings  (must be before /:id to avoid "guest" matching as an id)
router.get("/guest/:guestId", bookingCtrl.getGuestBookings);

// Get owner's bookings  (must be before /:id)
router.get("/owner/:ownerId", bookingCtrl.getOwnerBookings);

// Get booking by ID
router.get("/:id", bookingCtrl.getBookingById);

// Cancel booking
router.patch("/:id/cancel", bookingCtrl.cancelBooking);

// Accept booking (owner only)
router.patch("/:id/accept", bookingCtrl.acceptBooking);

// Decline booking (owner only)
router.patch("/:id/decline", bookingCtrl.declineBooking);

// Request modification
router.patch("/:id/modify", bookingCtrl.requestModification);

module.exports = router;
