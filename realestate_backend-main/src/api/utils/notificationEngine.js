/**
 * Notification Engine
 * ──────────────────
 * Handles the full delivery pipeline:
 *  1. Check user channel preferences
 *  2. Send Expo push notifications (with chunking + ticketing)
 *  3. Automatically remove invalid/expired push tokens
 */

const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const logger = require("./logger");
const receiptChecker = require("./notificationReceiptChecker");

// Lazily-loaded ESM singleton (expo-server-sdk is pure ESM)
let _expoClient = null;
let _ExpoClass = null;
async function getExpoClient() {
    if (!_expoClient) {
        const mod = await import("expo-server-sdk");
        _ExpoClass = mod.Expo;
        _expoClient = new _ExpoClass();
    }
    return { expo: _expoClient, Expo: _ExpoClass };
}

/**
 * Send push notifications to a user's registered devices.
 *
 * @param {string|object} userId   - MongoDB ObjectId (string or object)
 * @param {string}        title    - Notification title
 * @param {string}        body     - Notification body text
 * @param {object}        data     - Arbitrary data payload (for deep linking)
 * @param {number}        [badge]  - Badge count override (defaults to 1)
 * @returns {Promise<Array>} Expo delivery tickets
 */
async function sendPushNotifications(userId, title, body, data = {}, badge = 1) {
    try {
        const { expo, Expo } = await getExpoClient();
        const user = await User.findById(userId).select("pushTokens preferences");

        if (!user) {
            logger.warn(`[NotificationEngine] User ${userId} not found – skipping push`);
            return [];
        }

        // ── Preference gate ──────────────────────────────────────────────────
        const pushEnabled = user.preferences?.notifications?.push !== false; // default true
        if (!pushEnabled) {
            logger.info(`[NotificationEngine] Push disabled for user ${userId} – skipping`);
            return [];
        }

        // ── Filter valid Expo tokens ─────────────────────────────────────────
        const validEntries = (user.pushTokens || []).filter((t) =>
            Expo.isExpoPushToken(t.token)
        );

        if (validEntries.length === 0) {
            logger.info(`[NotificationEngine] No valid push tokens for user ${userId}`);
            return [];
        }

        // ── Build messages ───────────────────────────────────────────────────
        const messages = validEntries.map((entry) => ({
            to: entry.token,
            sound: "default",
            title,
            body,
            data,
            badge,
            priority: "high",
        }));

        // ── Chunk and send ───────────────────────────────────────────────────
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
                logger.info(
                    `[NotificationEngine] Sent chunk of ${ticketChunk.length} push notifications to user ${userId}`
                );
            } catch (chunkError) {
                logger.error(
                    `[NotificationEngine] Chunk send error for user ${userId}:`,
                    chunkError
                );
            }
        }

        // ── Handle tickets – clean up invalid tokens ─────────────────────────
        const tokensToRemove = [];
        for (let i = 0; i < tickets.length; i++) {
            const ticket = tickets[i];
            if (ticket.status === "error") {
                logger.error(
                    `[NotificationEngine] Push ticket error: ${ticket.message}`,
                    ticket.details
                );
                if (
                    ticket.details?.error === "DeviceNotRegistered" ||
                    ticket.details?.error === "InvalidCredentials"
                ) {
                    // validEntries[i] maps 1-to-1 with messages/tickets
                    if (validEntries[i]) {
                        tokensToRemove.push(validEntries[i].token);
                    }
                }
            }
        }

        if (tokensToRemove.length > 0) {
            await User.updateOne(
                { _id: userId },
                { $pull: { pushTokens: { token: { $in: tokensToRemove } } } }
            );
            logger.info(
                `[NotificationEngine] Removed ${tokensToRemove.length} invalid push token(s) for user ${userId}`
            );
        }

        // Queue tickets for Expo receipt checking (~15 min later)
        receiptChecker.queueTickets(userId, validEntries, tickets);

        return tickets;
    } catch (error) {
        logger.error(
            `[NotificationEngine] Unexpected error sending push to user ${userId}:`,
            error
        );
        return [];
    }
}

/**
 * Fetch unread notification count for a user (used for badge sync).
 *
 * @param {string|object} userId
 * @returns {Promise<number>}
 */
async function getUnreadCount(userId) {
    try {
        return await Notification.countDocuments({ userId, read: false });
    } catch (error) {
        logger.error(`[NotificationEngine] Error getting unread count:`, error);
        return 0;
    }
}

module.exports = { sendPushNotifications, getUnreadCount };
