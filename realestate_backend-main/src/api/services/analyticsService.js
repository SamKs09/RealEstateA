const ListingEvent = require("../models/listingEventModel");
const ListingMetricsDaily = require("../models/listingMetricsDailyModel");
const Property = require("../models/propertyModel");
const Vehicle = require("../models/vehicleModel");

/**
 * Analytics Service
 * Handles business logic for analytics operations
 */

/**
 * Check if a view event is a duplicate within the 30-minute window
 * @param {ObjectId} userId - User ID (null for anonymous)
 * @param {ObjectId} listingId - Listing ID
 * @returns {Promise<{isDuplicate: boolean, lastViewAt: Date|null}>}
 */
async function checkViewDeduplication(userId, listingId) {
  // Skip deduplication for anonymous users
  if (!userId) {
    return { isDuplicate: false, lastViewAt: null };
  }
  
  try {
    // Calculate 30-minute window
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    // Query for recent view
    const recentView = await ListingEvent.findOne({
      userId: userId,
      listingId: listingId,
      eventType: "view",
      createdAt: { $gte: thirtyMinutesAgo },
    }).sort({ createdAt: -1 });
    
    if (recentView) {
      console.log(
        `🔄 Duplicate view detected - User: ${userId}, Listing: ${listingId}, Last view: ${recentView.createdAt}`
      );
      return {
        isDuplicate: true,
        lastViewAt: recentView.createdAt,
      };
    }
    
    return { isDuplicate: false, lastViewAt: null };
  } catch (error) {
    console.error("Error checking view deduplication:", error);
    // On error, allow the view to be recorded
    return { isDuplicate: false, lastViewAt: null };
  }
}

/**
 * Insert a new event into the ListingEvent collection
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} Created event
 */
async function insertEvent(eventData) {
  try {
    const event = await ListingEvent.create(eventData);
    console.log(
      `✅ Event recorded - Type: ${event.eventType}, Listing: ${event.listingId}, User: ${event.userId || "anonymous"}`
    );
    return event;
  } catch (error) {
    console.error("Error inserting event:", error);
    throw error;
  }
}

/**
 * Aggregate metrics by updating the daily metrics document
 * @param {ObjectId} listingId - Listing ID
 * @param {string} eventType - Event type (view, save, inquiry)
 * @param {Date} date - Date for the metrics (defaults to today)
 * @returns {Promise<Object>} Updated metrics document
 */
async function aggregateMetrics(listingId, eventType, date = null) {
  try {
    const metrics = await ListingMetricsDaily.incrementCounter(
      listingId,
      eventType,
      date
    );
    
    console.log(
      `📊 Metrics updated - Listing: ${listingId}, Type: ${eventType}, Date: ${metrics.date.toISOString().split("T")[0]}`
    );
    
    return metrics;
  } catch (error) {
    console.error("Error aggregating metrics:", error);
    throw error;
  }
}

/**
 * Calculate save rate and inquiry rate
 * @param {number} views - Total views
 * @param {number} saves - Total saves
 * @param {number} inquiries - Total inquiries
 * @returns {Object} Calculated rates
 */
function calculateRates(views, saves, inquiries) {
  const saveRate = views > 0 ? (saves / views) * 100 : 0;
  const inquiryRate = views > 0 ? (inquiries / views) * 100 : 0;
  
  return {
    saveRate: Math.round(saveRate * 10) / 10, // Round to 1 decimal
    inquiryRate: Math.round(inquiryRate * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Verify that a listing exists
 * @param {ObjectId} listingId - Listing ID
 * @param {string} listingType - Listing type (property or vehicle)
 * @returns {Promise<Object>} Listing document
 */
async function verifyListingExists(listingId, listingType) {
  try {
    let listing;
    
    if (listingType === "property") {
      listing = await Property.findById(listingId);
    } else if (listingType === "vehicle") {
      listing = await Vehicle.findById(listingId);
    } else {
      // Try both if type not specified
      listing = await Property.findById(listingId);
      if (!listing) {
        listing = await Vehicle.findById(listingId);
      }
    }
    
    if (!listing) {
      throw new Error("Listing not found");
    }
    
    return listing;
  } catch (error) {
    console.error("Error verifying listing:", error);
    throw error;
  }
}

/**
 * Get aggregated metrics for a listing within a date range
 * @param {ObjectId} listingId - Listing ID
 * @param {Date} fromDate - Start date
 * @param {Date} toDate - End date
 * @returns {Promise<Object>} Aggregated metrics
 */
async function getListingMetrics(listingId, fromDate, toDate) {
  try {
    const metrics = await ListingMetricsDaily.aggregate([
      {
        $match: {
          listingId: listingId,
          date: {
            $gte: fromDate,
            $lte: toDate,
          },
        },
      },
      {
        $group: {
          _id: "$listingId",
          totalViews: { $sum: "$viewsCount" },
          totalSaves: { $sum: "$savesCount" },
          totalInquiries: { $sum: "$inquiriesCount" },
        },
      },
    ]);
    
    if (metrics.length === 0) {
      return {
        views: 0,
        saves: 0,
        inquiries: 0,
        saveRate: 0,
        inquiryRate: 0,
      };
    }
    
    const { totalViews, totalSaves, totalInquiries } = metrics[0];
    const rates = calculateRates(totalViews, totalSaves, totalInquiries);
    
    return {
      views: totalViews,
      saves: totalSaves,
      inquiries: totalInquiries,
      ...rates,
    };
  } catch (error) {
    console.error("Error getting listing metrics:", error);
    throw error;
  }
}

/**
 * Get daily metrics for a listing within a date range
 * @param {ObjectId} listingId - Listing ID
 * @param {Date} fromDate - Start date
 * @param {Date} toDate - End date
 * @returns {Promise<Array>} Array of daily metrics
 */
async function getDailyMetrics(listingId, fromDate, toDate) {
  try {
    const metrics = await ListingMetricsDaily.find({
      listingId: listingId,
      date: {
        $gte: fromDate,
        $lte: toDate,
      },
    }).sort({ date: 1 });
    
    // Fill in missing days with zero counts
    const dailyMetrics = [];
    const currentDate = new Date(fromDate);
    
    while (currentDate <= toDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const metric = metrics.find(
        (m) => m.date.toISOString().split("T")[0] === dateStr
      );
      
      dailyMetrics.push({
        date: dateStr,
        views: metric ? metric.viewsCount : 0,
        saves: metric ? metric.savesCount : 0,
        inquiries: metric ? metric.inquiriesCount : 0,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dailyMetrics;
  } catch (error) {
    console.error("Error getting daily metrics:", error);
    throw error;
  }
}

module.exports = {
  checkViewDeduplication,
  insertEvent,
  aggregateMetrics,
  calculateRates,
  verifyListingExists,
  getListingMetrics,
  getDailyMetrics,
};
