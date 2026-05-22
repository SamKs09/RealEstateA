const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { auth } = require("../middleware/auth");

// Get notifications
router.get("/", auth, notificationController.getNotifications);

// Get unread count
router.get("/unread-count", auth, notificationController.getUnreadCount);

// Mark as read
router.put("/:notificationId/read", auth, notificationController.markAsRead);

// Mark all as read
router.put("/read-all", auth, notificationController.markAllAsRead);

// Delete all notifications
router.delete("/", auth, notificationController.deleteAllNotifications);

// Sync missing booking notifications (call at login)
router.post("/sync-bookings", auth, notificationController.syncBookingNotifications);

// Register push token
router.post("/register-token", auth, notificationController.registerPushToken);


// Get preferences
router.get("/preferences", auth, notificationController.getPreferences);
// Update preferences
router.put("/preferences", auth, notificationController.updatePreferences);

module.exports = router;
