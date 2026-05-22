const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const Booking = require("../models/bookingModel");
const logger = require("../utils/logger");
const { getTemplate } = require("../utils/notificationTemplates");

const notificationController = {
    // Get preferences
    getPreferences: async (req, res) => {
        try {
            const user = await User.findById(req.user._id).select("preferences.notifications");
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            const notifPrefs = user.preferences?.notifications || {};
            res.json({
                success: true,
                data: {
                    pushEnabled: notifPrefs.push ?? true,
                    emailEnabled: notifPrefs.email ?? true,
                    smsEnabled: notifPrefs.sms ?? false,
                    types: {
                        questions: true,
                        message_booking: true,
                        messages: true,
                        alerts: true,
                    },
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to get notification preferences", error: error.message });
        }
    },
    // Get all notifications for the current user
    getNotifications: async (req, res) => {
        try {
            const { limit = 50, unreadOnly = false } = req.query;
            const query = { userId: req.user._id };

            if (unreadOnly === "true" || unreadOnly === true) {
                query.read = false;
            }

            const notifications = await Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit));

            return res.json({
                success: true,
                data: notifications,
            });
        } catch (error) {
            logger.error("Error fetching notifications:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch notifications",
            });
        }
    },

    // Get unread count
    getUnreadCount: async (req, res) => {
        try {
            const count = await Notification.countDocuments({
                userId: req.user._id,
                read: false,
            });

            return res.json({
                success: true,
                data: { count },
            });
        } catch (error) {
            logger.error("Error fetching unread count:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch unread count",
            });
        }
    },

    // Mark a notification as read
    markAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;
            await Notification.findOneAndUpdate(
                { _id: notificationId, userId: req.user._id },
                { read: true }
            );

            return res.json({
                success: true,
                message: "Notification marked as read",
            });
        } catch (error) {
            logger.error("Error marking notification as read:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to mark notification as read",
            });
        }
    },

    // Mark all as read
    markAllAsRead: async (req, res) => {
        try {
            await Notification.updateMany(
                { userId: req.user._id, read: false },
                { read: true }
            );

            return res.json({
                success: true,
                message: "All notifications marked as read",
            });
        } catch (error) {
            logger.error("Error marking all notifications as read:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to mark all notifications as read",
            });
        }
    },

    // Register push token
    registerPushToken: async (req, res) => {
        try {
            const { pushToken, platform } = req.body;

            if (!pushToken) {
                return res.status(400).json({
                    success: false,
                    message: "Push token is required",
                });
            }

            // Check if token already exists for this user
            const user = await User.findById(req.user._id);
            const tokenExists = user.pushTokens.find(t => t.token === pushToken);

            if (!tokenExists) {
                await User.findByIdAndUpdate(req.user._id, {
                    $push: {
                        pushTokens: {
                            token: pushToken,
                            platform: platform || "unknown",
                        }
                    }
                });
            }

            return res.json({
                success: true,
                message: "Push token registered successfully",
            });
        } catch (error) {
            logger.error("Error registering push token:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to register push token",
            });
        }
    },

    // Sync missing booking notifications for the current seller.
    // Creates a DB notification for every pending booking that doesn't already have one.
    // Also fixes any existing booking notifications that have an invalid deepLink.
    syncBookingNotifications: async (req, res) => {
        try {
            const ownerId = req.user._id;

            // Fix any existing booking notifications with a stale/broken deepLink
            await Notification.updateMany(
                {
                    userId: ownerId,
                    type: 'booking',
                    'data.deepLink': { $not: /^\/(tabs)\/Bookings$/ },
                },
                { $set: { 'data.deepLink': '/(tabs)/Bookings' } }
            );

            const pendingBookings = await Booking.find({ owner: ownerId, status: 'pending' })
                .populate('guest', 'firstName lastName')
                .populate('property', 'title')
                .populate('vehicle', 'title');

            let created = 0;
            for (const booking of pendingBookings) {
                // Skip if a notification already exists for this booking
                const exists = await Notification.findOne({
                    userId: ownerId,
                    type: 'booking',
                    'data.relatedId': booking._id.toString(),
                });
                if (exists) continue;

                const listing = booking.property || booking.vehicle;
                const listingTitle = listing?.title || booking.listingType;
                const guestName = [
                    booking.guest?.firstName || '',
                    booking.guest?.lastName || ''
                ].join(' ').trim() || 'A guest';

                const tpl = getTemplate('booking_new_request', guestName, listingTitle);
                await Notification.create({
                    userId: ownerId,
                    type: 'booking',
                    title: tpl.title,
                    body: tpl.body,
                    data: {
                        deepLink: '/(tabs)/Bookings',
                        relatedId: booking._id.toString(),
                    },
                });
                created++;
            }

            logger.info(`[NotificationSync] Created ${created} missing booking notification(s) for user ${ownerId}`);
            return res.json({ success: true, data: { synced: created } });
        } catch (error) {
            logger.error('Error syncing booking notifications:', error);
            return res.status(500).json({ success: false, message: 'Failed to sync notifications' });
        }
    },

    // Delete all notifications for the current user
    deleteAllNotifications: async (req, res) => {
        try {
            await Notification.deleteMany({ userId: req.user._id });
            return res.json({
                success: true,
                message: "All notifications cleared",
            });
        } catch (error) {
            logger.error("Error deleting all notifications:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to clear notifications",
            });
        }
    },

    // Update preferences
    updatePreferences: async (req, res) => {
        try {
            const { preferences } = req.body;

            // Map from client field names to user model field names
            const notifUpdate = {};
            if (preferences.pushEnabled !== undefined) notifUpdate['preferences.notifications.push'] = preferences.pushEnabled;
            if (preferences.emailEnabled !== undefined) notifUpdate['preferences.notifications.email'] = preferences.emailEnabled;
            if (preferences.smsEnabled !== undefined) notifUpdate['preferences.notifications.sms'] = preferences.smsEnabled;

            await User.findByIdAndUpdate(req.user._id, { $set: notifUpdate });

            return res.json({
                success: true,
                message: "Notification preferences updated",
            });
        } catch (error) {
            logger.error("Error updating notification preferences:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to update notification preferences",
            });
        }
    }
};

module.exports = notificationController;
