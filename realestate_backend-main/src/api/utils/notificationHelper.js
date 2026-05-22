const Notification = require("../models/notificationModel");
const logger = require("./logger");
const { sendPushNotifications, getUnreadCount } = require("./notificationEngine");

/**
 * Send a notification to a specific user across all channels:
 *  1. Persist to database
 *  2. Real-time socket emit (in-app)
 *  3. Expo push notification (respects user preferences, handles token cleanup)
 *
 * @param {string} userId - ID of the user
 * @param {string} type   - 'message' | 'support_reply' | 'booking' | 'property_update' | 'system'
 * @param {string} title  - Notification title
 * @param {string} body   - Notification body
 * @param {object} data   - Extra data for deep linking (e.g. { deepLink: '/chat/123', relatedId: '...' })
 */
const sendNotification = async (userId, type, title, body, data = {}) => {
    try {
        // 1. Persist to database
        const notification = await Notification.create({
            userId,
            type,
            title,
            body,
            data,
        });

        // 2. Real-time socket emit for in-app notification
        try {
            const socketHandler = require("./socketHandler");
            const io = socketHandler.getIO();
            socketHandler.sendToUser(io, userId, "notification:received", notification);
        } catch (err) {
            logger.warn("[NotificationHelper] Socket.io not initialized, skipping real-time emit");
        }

        // 3. Expo push notification (preference-aware, with badge sync)
        const unreadCount = await getUnreadCount(userId);
        await sendPushNotifications(userId, title, body, data, unreadCount);

        logger.info(`[NotificationHelper] Notification dispatched to user ${userId}: "${title}"`);
        return notification;
    } catch (error) {
        logger.error(`[NotificationHelper] Error sending notification to user ${userId}:`, error);
        return null;
    }
};

module.exports = {
    sendNotification,
};
