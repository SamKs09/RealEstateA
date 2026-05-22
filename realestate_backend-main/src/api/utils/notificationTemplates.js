/**
 * Central notification template system
 * All notification titles and bodies should be generated from here.
 */

const templates = {
    // ─── Chat / Messaging ────────────────────────────────────────────────────
    message: (senderName) => ({
        title: `New message from ${senderName}`,
        body: "You have a new message. Tap to read it.",
    }),

    // ─── Support ─────────────────────────────────────────────────────────────
    support_reply: (agentName) => ({
        title: "Support Team Reply",
        body: agentName
            ? `${agentName} from our support team has replied to your ticket.`
            : "A support agent has replied to your ticket.",
    }),

    // ─── Bookings ────────────────────────────────────────────────────────────
    booking_new_request: (guestName, listingTitle) => ({
        title: "New Booking Request",
        body: `${guestName || "A guest"} has requested to book "${listingTitle || "your listing"}".`,
    }),

    booking_accepted: (listingTitle) => ({
        title: "Booking Accepted! 🎉",
        body: `Great news! Your booking for "${listingTitle || "the listing"}" has been accepted.`,
    }),

    booking_declined: (listingTitle) => ({
        title: "Booking Declined",
        body: `Your booking request for "${listingTitle || "the listing"}" was declined by the owner.`,
    }),

    booking_cancelled: (listingTitle) => ({
        title: "Booking Cancelled",
        body: `The booking for "${listingTitle || "the listing"}" has been cancelled.`,
    }),

    // ─── Property / Vehicle ──────────────────────────────────────────────────
    property_update: (listingTitle) => ({
        title: "Listing Updated",
        body: `The listing "${listingTitle || "a saved listing"}" has been updated.`,
    }),

    // ─── Follow / Social ─────────────────────────────────────────────────────
    new_follower: (followerName) => ({
        title: "New Follower",
        body: `${followerName || "Someone"} started following you.`,
    }),

    // ─── Reviews ─────────────────────────────────────────────────────────────
    new_review: (reviewerName, listingTitle) => ({
        title: "New Review Received",
        body: `${reviewerName || "Someone"} left a review on "${listingTitle || "your listing"}".`,
    }),

    review_reply: (sellerName) => ({
        title: "Seller Replied to Your Review",
        body: `${sellerName || "The seller"} replied to your review.`,
    }),

    // ─── System ──────────────────────────────────────────────────────────────
    system: (message) => ({
        title: "Notification",
        body: message || "You have a new notification.",
    }),
};

/**
 * Get a template for a given type and parameters.
 * Falls back to the system template if type is unknown.
 *
 * @param {string} type - Notification type key (matches templates above)
 * @param {...any} args - Arguments forwarded to the template function
 * @returns {{ title: string, body: string }}
 */
const getTemplate = (type, ...args) => {
    const tpl = templates[type];
    if (tpl) return tpl(...args);
    return templates.system(...args);
};

module.exports = { templates, getTemplate };
