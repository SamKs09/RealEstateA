const mongoose = require("mongoose");

/**
 * ListingEvent Schema
 * Stores individual user interactions with listings (views, saves, inquiries)
 */
const listingEventSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Listing ID is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Null for anonymous views
    },
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: {
        values: ["view", "save", "inquiry"],
        message: "{VALUE} is not a valid event type. Must be view, save, or inquiry",
      },
      index: true,
    },
    metadata: {
      listingType: {
        type: String,
        enum: ["property", "vehicle"],
      },
      inquiryMessage: {
        type: String,
      },
      ipAddress: {
        type: String,
      },
      userAgent: {
        type: String,
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Compound index for deduplication queries (userId + listingId + eventType + createdAt)
listingEventSchema.index(
  { userId: 1, listingId: 1, eventType: 1, createdAt: -1 },
  { name: "deduplication_index" }
);

// Index for listing-specific queries
listingEventSchema.index(
  { listingId: 1, createdAt: -1 },
  { name: "listing_events_index" }
);

// Index for date range queries
listingEventSchema.index(
  { createdAt: 1 },
  { name: "created_at_index" }
);

// Index for event type filtering
listingEventSchema.index(
  { eventType: 1, createdAt: -1 },
  { name: "event_type_index" }
);

const ListingEvent = mongoose.model("ListingEvent", listingEventSchema);

module.exports = ListingEvent;
