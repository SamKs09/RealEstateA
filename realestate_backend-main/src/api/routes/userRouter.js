const router = require("express").Router();
const userCtrl = require("../controllers/userController");
const followCtrl = require("../controllers/followController");
const { auth } = require("../middleware/auth");
const { upload } = require("../utils/multer");
// Pack purchase/upgrade endpoint
router.post('/purchase-pack', auth, userCtrl.purchasePack);
router.post('/start-trial', auth, userCtrl.startTrial);

// Complete Profile Route (handles avatar + full info)
router.post(
  "/complete-profile",
  auth,
  upload.single("avatar"),
  userCtrl.completeProfile
);

// Profile management
router.get('/profile', auth, userCtrl.getProfile);          // GET own profile
router.get('/profile/:id', userCtrl.getPublicProfile);     // GET any user's public profile
router.put('/profile', auth, upload.single('avatar'), userCtrl.updateBasicProfile);  // Basic info + avatar
router.put('/change-password', auth, userCtrl.changePassword); // Change password
router.put('/preferences', auth, userCtrl.updatePreferences);  // Preferences only
router.post(
  '/upload-avatar',
  auth,
  upload.single('avatar'),
  userCtrl.uploadAvatar
);  // Avatar only

// Listings management - separated by type
router.get('/listings/properties', auth, userCtrl.getUserPropertyListings);
router.get('/listings/vehic  les', auth, userCtrl.getUserVehicleListings);

// Favorites system - separated by type
router.get('/favorites/properties', auth, userCtrl.getFavoriteProperties);
router.get('/favorites/vehicles', auth, userCtrl.getFavoriteVehicles);
router.get('/favorites', auth, userCtrl.getAllFavorites);

router.post('/favorites/properties/:propertyId', auth, userCtrl.addFavoriteProperty);
router.post('/favorites/vehicles/:vehicleId', auth, userCtrl.addFavoriteVehicle);

router.delete('/favorites/properties/:propertyId', auth, userCtrl.removeFavoriteProperty);
router.delete('/favorites/vehicles/:vehicleId', auth, userCtrl.removeFavoriteVehicle);

// Follow system
router.post('/:userId/follow', auth, followCtrl.followUser);
router.delete('/:userId/follow', auth, followCtrl.unfollowUser);
router.get('/:userId/follow-status', auth, followCtrl.getFollowStatus);

module.exports = router;