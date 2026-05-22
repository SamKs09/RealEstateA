const router = require("express").Router();

const offerCtrl = require("../controllers/offerController");
const { auth } = require("../middleware/auth");

// All offer routes require authentication
router.use(auth);

// Get all offers for owner
router.get("/owner/:ownerId", offerCtrl.getOwnerOffers);

// Accept offer
router.patch("/:id/accept", offerCtrl.acceptOffer);

// Decline offer
router.patch("/:id/decline", offerCtrl.declineOffer);

// Get offer details
router.get("/:id", offerCtrl.getOfferDetails);

// Get receipt data
router.get("/:id/receipt", offerCtrl.getReceipt);

module.exports = router;
