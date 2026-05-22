const mongoose = require("mongoose");

/**
 * ListingMetricsDaily Schema
 * Stores aggregated daily metrics for each listing
 */
const listingMetricsDailySchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Listing ID is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: [0, "Views count cannot be negative"],
    },
    savesCount: {
      type: Number,
      default: 0,
      min: [0, "Saves count cannot be negative"],
    },
    inquiriesCount: {
      type: Number,
      default: 0,
      min: [0, "Inquiries count cannot be negative"],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Unique compound index for upsert operations (listingId + date)
listingMetricsDailySchema.index(
  { listingId: 1, date: 1 },
  { unique: true, name: "listing_date_unique_index" }
);

// Index for date range queries
listingMetricsDailySchema.index(
  { date: 1 },
  { name: "date_index" }
);

// Index for listing-specific queries with date sorting
listingMetricsDailySchema.index(
  { listingId: 1, date: -1 },
  { name: "listing_date_sort_index" }
);

/**
 * Helper method to get or create a metrics document for today
 */
listingMetricsDailySchema.statics.getOrCreateToday = async function (listingId) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
  
  const metrics = await this.findOneAndUpdate(
    { listingId, date: today },
    {
      $setOnInsert: {
        listingId,
        date: today,
        viewsCount: 0,
        savesCount: 0,
        inquiriesCount: 0,
      },
    },
    { upsert: true, new: true }
  );
  
  return metrics;
};

/**
 * Helper method to increment a counter atomically
 */
listingMetricsDailySchema.statics.incrementCounter = async function (
  listingId,
  eventType,
  date = null
) {
  // Use provided date or today
  const targetDate = date || new Date();
  targetDate.setUTCHours(0, 0, 0, 0); // Set to midnight UTC
  
  // Map event type to counter field
  const counterField = {
    view: "viewsCount",
    save: "savesCount",
    inquiry: "inquiriesCount",
  }[eventType];
  
  if (!counterField) {
    throw new Error(`Invalid event type: ${eventType}`);
  }
  
  // Upsert with atomic increment
  const metrics = await this.findOneAndUpdate(
    { listingId, date: targetDate },
    {
      $inc: { [counterField]: 1 },
      $setOnInsert: {
        listingId,
        date: targetDate,
        viewsCount: eventType === "view" ? 1 : 0,
        savesCount: eventType === "save" ? 1 : 0,
        inquiriesCount: eventType === "inquiry" ? 1 : 0,
      },
    },
    { upsert: true, new: true }
  );
  
  return metrics;
};

const ListingMetricsDaily = mongoose.model(
  "ListingMetricsDaily",
  listingMetricsDailySchema
);

module.exports = ListingMetricsDaily;
