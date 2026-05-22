const mongoose = require("mongoose");
const analyticsService = require("../services/analyticsService");
const Property = require("../models/propertyModel");
const Vehicle = require("../models/vehicleModel");

/**
 * Analytics Controller
 * Handles HTTP requests for analytics endpoints
 */

/**
 * Record an analytics event (view, save, inquiry)
 * POST /analytics/events
 */
exports.recordEvent = async (req, res) => {
  try {
    const { listingId, eventType, listingType, metadata } = req.body;
    const userId = req.user?._id || null; // Optional for anonymous views
    
    console.log(`📊 Event request - Type: ${eventType}, Listing: ${listingId}, User: ${userId || "anonymous"}`);
    
    // Validate required fields
    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ field: "listingId", message: "Listing ID is required" }],
      });
    }
    
    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ field: "eventType", message: "Event type is required" }],
      });
    }
    
    // Validate eventType
    if (!["view", "save", "inquiry"].includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field: "eventType",
            message: "Event type must be view, save, or inquiry",
          },
        ],
      });
    }
    
    // Validate listingId format
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ field: "listingId", message: "Invalid listing ID format" }],
      });
    }
    
    // Validate listingType if provided
    if (listingType && !["property", "vehicle"].includes(listingType)) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field: "listingType",
            message: "Listing type must be property or vehicle",
          },
        ],
      });
    }
    
    // Require authentication for save and inquiry events
    if ((eventType === "save" || eventType === "inquiry") && !userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for this event type",
      });
    }
    
    // Validate inquiry message
    if (eventType === "inquiry" && (!metadata?.inquiryMessage || metadata.inquiryMessage.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field: "metadata.inquiryMessage",
            message: "Inquiry message is required for inquiry events",
          },
        ],
      });
    }
    
    // Verify listing exists
    try {
      await analyticsService.verifyListingExists(listingId, listingType);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }
    
    // Check for duplicate view (30-minute window)
    let isDuplicate = false;
    if (eventType === "view") {
      const deduplicationResult = await analyticsService.checkViewDeduplication(
        userId,
        listingId
      );
      isDuplicate = deduplicationResult.isDuplicate;
      
      if (isDuplicate) {
        console.log(`🔄 Duplicate view ignored - User: ${userId}, Listing: ${listingId}`);
        return res.status(200).json({
          success: true,
          message: "Duplicate view ignored",
          data: {
            isDuplicate: true,
          },
        });
      }
    }
    
    // Insert event
    const event = await analyticsService.insertEvent({
      listingId,
      userId,
      eventType,
      metadata: {
        listingType,
        inquiryMessage: metadata?.inquiryMessage,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
      },
    });
    
    // Aggregate metrics
    await analyticsService.aggregateMetrics(listingId, eventType);
    
    return res.status(201).json({
      success: true,
      message: "Event recorded successfully",
      data: {
        eventId: event._id,
        isDuplicate: false,
      },
    });
  } catch (error) {
    console.error("❌ Error recording event:", error);
    return res.status(500).json({
      success: false,
      message: "Error recording event",
      error: error.message,
    });
  }
};

/**
 * Get analytics for all listings owned by a user
 * GET /analytics/listings?ownerId=xxx&from=xxx&to=xxx
 */
exports.getOwnerAnalytics = async (req, res) => {
  try {
    const { ownerId, from, to } = req.query;
    const authenticatedUserId = req.user._id;
    
    console.log(`📊 Owner analytics request - Owner: ${ownerId}, From: ${from}, To: ${to}`);
    
    // Validate ownerId
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ field: "ownerId", message: "Owner ID is required" }],
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ field: "ownerId", message: "Invalid owner ID format" }],
      });
    }
    
    // Authorization: user can only view their own analytics
    if (authenticatedUserId.toString() !== ownerId) {
      return res.status(403).json({
        success: false,
        message: "You can only view analytics for your own listings",
      });
    }
    
    // Parse date range (default to last 30 days)
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Validate dates
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ field: "date", message: "Invalid date format" }],
      });
    }
    
    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          { field: "date", message: "'from' date must be before 'to' date" },
        ],
      });
    }
    
    // Set dates to midnight UTC
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate.setUTCHours(23, 59, 59, 999);
    
    // Get all listings owned by the user
    const properties = await Property.find({ owner: ownerId }).select("_id title");
    const vehicles = await Vehicle.find({ owner: ownerId }).select("_id title");
    
    // Get metrics for each listing
    const listingsWithMetrics = [];
    
    for (const property of properties) {
      const metrics = await analyticsService.getListingMetrics(
        property._id,
        fromDate,
        toDate
      );
      
      listingsWithMetrics.push({
        listingId: property._id,
        listingType: "property",
        title: property.title,
        ...metrics,
      });
    }
    
    for (const vehicle of vehicles) {
      const metrics = await analyticsService.getListingMetrics(
        vehicle._id,
        fromDate,
        toDate
      );
      
      listingsWithMetrics.push({
        listingId: vehicle._id,
        listingType: "vehicle",
        title: vehicle.title,
        ...metrics,
      });
    }
    
    // Calculate totals
    const totals = listingsWithMetrics.reduce(
      (acc, listing) => ({
        views: acc.views + listing.views,
        saves: acc.saves + listing.saves,
        inquiries: acc.inquiries + listing.inquiries,
      }),
      { views: 0, saves: 0, inquiries: 0 }
    );
    
    const totalRates = analyticsService.calculateRates(
      totals.views,
      totals.saves,
      totals.inquiries
    );
    
    return res.status(200).json({
      success: true,
      data: {
        dateRange: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
        listings: listingsWithMetrics,
        totals: {
          ...totals,
          ...totalRates,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching owner analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message,
    });
  }
};

/**
 * Get daily analytics for a specific listing
 * GET /analytics/listings/:listingId?from=xxx&to=xxx
 */
exports.getListingAnalytics = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { from, to } = req.query;
    const authenticatedUserId = req.user._id;
    
    console.log(`📊 Listing analytics request - Listing: ${listingId}, From: ${from}, To: ${to}`);
    
    // Validate listingId
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ field: "listingId", message: "Invalid listing ID format" }],
      });
    }
    
    // Find the listing
    let listing = await Property.findById(listingId);
    let listingType = "property";
    
    if (!listing) {
      listing = await Vehicle.findById(listingId);
      listingType = "vehicle";
    }
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }
    
    // Authorization: user must own the listing
    if (listing.owner.toString() !== authenticatedUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view analytics for your own listings",
      });
    }
    
    // Parse date range (default to last 30 days)
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Validate dates
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{ field: "date", message: "Invalid date format" }],
      });
    }
    
    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          { field: "date", message: "'from' date must be before 'to' date" },
        ],
      });
    }
    
    // Set dates to midnight UTC
    fromDate.setUTCHours(0, 0, 0, 0);
    toDate.setUTCHours(23, 59, 59, 999);
    
    // Get daily metrics
    const dailyMetrics = await analyticsService.getDailyMetrics(
      listingId,
      fromDate,
      toDate
    );
    
    // Calculate totals
    const totals = dailyMetrics.reduce(
      (acc, day) => ({
        views: acc.views + day.views,
        saves: acc.saves + day.saves,
        inquiries: acc.inquiries + day.inquiries,
      }),
      { views: 0, saves: 0, inquiries: 0 }
    );
    
    return res.status(200).json({
      success: true,
      data: {
        listingId: listing._id,
        listingType,
        title: listing.title,
        dateRange: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
        dailyMetrics,
        totals,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching listing analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message,
    });
  }
};

module.exports = exports;
