/**
 * Expo Push Receipt Checker
 * ─────────────────────────
 * Expo's push delivery is a two-step process:
 *  1. Sending returns a "ticket" with a receiptId.
 *  2. ~15 minutes later you can fetch the receipt to confirm delivery.
 *
 * This module stores pending receiptIds in memory and runs a background
 * cron job every 15 minutes to check them.  Invalid tokens found during
 * receipt checking are automatically removed from the User document.
 *
 * Usage:
 *   const receiptChecker = require('./notificationReceiptChecker');
 *   receiptChecker.queueTickets(userId, tickets);  // call after sendPush…
 *   receiptChecker.startJob();                      // call once at server start
 */

const cron = require("node-cron");
const User = require("../models/userModel");
const logger = require("./logger");

// Lazily-loaded ESM singleton
let _expoClient = null;
async function getExpoClient() {
    if (!_expoClient) {
        const mod = await import("expo-server-sdk");
        _expoClient = new mod.Expo();
    }
    return _expoClient;
}

// In-memory queue: { receiptId -> { userId, token } }
const pendingReceipts = new Map();

/**
 * Queue delivery tickets for later receipt checking.
 *
 * @param {string}   userId  - Owner of the push tokens
 * @param {string[]} tokens  - Push tokens that were sent (parallel array with tickets)
 * @param {Array}    tickets - Ticket objects returned by expo.sendPushNotificationsAsync
 */
function queueTickets(userId, tokens, tickets) {
    if (!tickets || tickets.length === 0) return;

    for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === "ok" && ticket.id) {
            pendingReceipts.set(ticket.id, { userId: userId.toString(), token: tokens[i]?.token || null });
        }
    }

    logger.info(`[ReceiptChecker] Queued ${tickets.filter(t => t.status === "ok").length} receipts for user ${userId}`);
}

/**
 * Check all pending receipts and handle errors.
 */
async function checkReceipts() {
    if (pendingReceipts.size === 0) return;

    const expo = await getExpoClient();
    const receiptIds = [...pendingReceipts.keys()];
    logger.info(`[ReceiptChecker] Checking ${receiptIds.length} pending receipt(s)`);

    // Expo recommends batching receipt lookups
    const chunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    const tokensToRemove = {}; // userId -> Set of tokens

    for (const chunk of chunks) {
        try {
            const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

            for (const [receiptId, receipt] of Object.entries(receipts)) {
                const meta = pendingReceipts.get(receiptId);
                pendingReceipts.delete(receiptId);

                if (!meta) continue;

                if (receipt.status === "error") {
                    logger.error(
                        `[ReceiptChecker] Receipt error for user ${meta.userId}: ${receipt.message}`,
                        receipt.details
                    );

                    if (
                        receipt.details?.error === "DeviceNotRegistered" ||
                        receipt.details?.error === "InvalidCredentials"
                    ) {
                        if (meta.token) {
                            if (!tokensToRemove[meta.userId]) {
                                tokensToRemove[meta.userId] = new Set();
                            }
                            tokensToRemove[meta.userId].add(meta.token);
                        }
                    }
                }
            }
        } catch (err) {
            logger.error("[ReceiptChecker] Error fetching receipts:", err);
        }
    }

    // Remove invalid tokens in bulk
    for (const [userId, tokens] of Object.entries(tokensToRemove)) {
        const tokenArray = [...tokens];
        await User.updateOne(
            { _id: userId },
            { $pull: { pushTokens: { token: { $in: tokenArray } } } }
        );
        logger.info(`[ReceiptChecker] Removed ${tokenArray.length} invalid token(s) for user ${userId}`);
    }
}

/**
 * Start the background receipt-checking cron job (runs every 15 minutes).
 * Call this once when the server starts.
 */
function startJob() {
    cron.schedule("*/15 * * * *", async () => {
        try {
            await checkReceipts();
        } catch (err) {
            logger.error("[ReceiptChecker] Cron job error:", err);
        }
    });

    logger.info("[ReceiptChecker] Receipt checker cron job started (every 15 min)");
}

module.exports = { queueTickets, startJob };
