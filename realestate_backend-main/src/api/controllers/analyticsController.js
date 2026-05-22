const Analytics = require("../models/analyticsModel");
const Property = require("../models/propertyModel");
const Vehicle = require("../models/vehicleModel");

// Get analytics for a specific listing
exports.getListingAnalytics = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { listingType } = req.query; // 'property' or 'vehicle'
    
    console.log(`📊 Analytics request - ListingID: ${listingId}, Type: ${listingType}`);
    
    if (!listingType || !["property", "vehicle"].includes(listingType.toLowerCase())) {
      console.error("❌ Invalid listingType:", listingType);
      return res.status(400).json({
        success: false,
        message: "Invalid or missing listingType. Must be 'property' or 'vehicle'",
      });
    }
    
    const modelType = listingType.toLowerCase() === "property" ? "Property" : "Vehicle";
    
    // Get listing to find seller
    let listing;
    if (modelType === "Property") {
      listing = await Property.findById(listingId);
    } else {
      listing = await Vehicle.findById(listingId);
    }
    
    if (!listing) {
      console.error(`❌ Listing not found: ${listingId}`);
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }
    
    console.log(`✅ Listing found - Owner: ${listing.owner}`);
    
    // Use the static method to get or create analytics
    const analytics = await Analytics.getOrCreate(
      listingId,
      modelType,
      listing.owner
    );
    
    console.log(`✅ Analytics retrieved/created - ID: ${analytics._id}`);
    
    // Get weekly views
    const weeklyViews = analytics.getWeeklyViews();
    
    // Get recent inquiries with user details
    const recentInquiries = await analytics.getRecentInquiries(10);
    
    const responseData = {
      totalViews: analytics.totalViews || 0,
      uniqueViews: analytics.uniqueViews || 0,
      saved: analytics.totalSaves || 0,
      inquiries: analytics.totalInquiries || 0,
      weeklyViews: weeklyViews || [0, 0, 0, 0, 0, 0, 0],
      recentInquiries: recentInquiries || [],
    };
    
    console.log(`✅ Sending response:`, responseData);
    
    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("❌ Error fetching listing analytics:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message,
    });
  }
};

// Record a view
exports.recordView = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { listingType } = req.body; // 'property' or 'vehicle'
    const userId = req.user?._id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];
    
    if (!listingType || !["property", "vehicle"].includes(listingType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing listingType",
      });
    }
    
    const modelType = listingType.toLowerCase() === "property" ? "Property" : "Vehicle";
    
    // Get listing to find seller
    let listing;
    if (modelType === "Property") {
      listing = await Property.findById(listingId);
    } else {
      listing = await Vehicle.findById(listingId);
    }
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }
    
    // Get or create analytics
    const analytics = await Analytics.getOrCreate(
      listingId,
      modelType,
      listing.owner || listing.userId || listing.sellerId
    );
    
    // Record the view
    await analytics.recordView(userId, ipAddress, userAgent);
    
    res.status(200).json({
      success: true,
      message: "View recorded successfully",
      data: {
        totalViews: analytics.totalViews,
        uniqueViews: analytics.uniqueViews,
      },
    });
  } catch (error) {
    console.error("Error recording view:", error);
    res.status(500).json({
      success: false,
      message: "Error recording view",
      error: error.message,
    });
  }
};

// Record a save/favorite
exports.recordSave = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { listingType } = req.body;
    const userId = req.user._id;
    
    if (!listingType || !["property", "vehicle"].includes(listingType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing listingType",
      });
    }
    
    const modelType = listingType.toLowerCase() === "property" ? "Property" : "Vehicle";
    
    // Get listing to find seller
    let listing;
    if (modelType === "Property") {
      listing = await Property.findById(listingId);
    } else {
      listing = await Vehicle.findById(listingId);
    }
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }
    
    // Get or create analytics
    const analytics = await Analytics.getOrCreate(
      listingId,
      modelType,
      listing.owner || listing.userId || listing.sellerId
    );
    
    // Record the save
    await analytics.recordSave(userId);
    
    res.status(200).json({
      success: true,
      message: "Save recorded successfully",
      data: {
        totalSaves: analytics.totalSaves,
      },
    });
  } catch (error) {
    console.error("Error recording save:", error);
    res.status(500).json({
      success: false,
      message: "Error recording save",
      error: error.message,
    });
  }
};

// Remove a save/favorite
exports.removeSave = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { listingType } = req.body;
    const userId = req.user._id;
    
    if (!listingType || !["property", "vehicle"].includes(listingType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing listingType",
      });
    }
    
    const modelType = listingType.toLowerCase() === "property" ? "Property" : "Vehicle";
    
    // Find analytics
    const analytics = await Analytics.findOne({
      listingId,
      listingType: modelType,
    });
    
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: "Analytics not found",
      });
    }
    
    // Remove the save
    await analytics.removeSave(userId);
    
    res.status(200).json({
      success: true,
      message: "Save removed successfully",
      data: {
        totalSaves: analytics.totalSaves,
      },
    });
  } catch (error) {
    console.error("Error removing save:", error);
    res.status(500).json({
      success: false,
      message: "Error removing save",
      error: error.message,
    });
  }
};

// Record an inquiry
exports.recordInquiry = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { listingType, message } = req.body;
    const userId = req.user._id;
    
    if (!listingType || !["property", "vehicle"].includes(listingType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing listingType",
      });
    }
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }
    
    const modelType = listingType.toLowerCase() === "property" ? "Property" : "Vehicle";
    
    // Get listing to find seller
    let listing;
    if (modelType === "Property") {
      listing = await Property.findById(listingId);
    } else {
      listing = await Vehicle.findById(listingId);
    }
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }
    
    // Get or create analytics
    const analytics = await Analytics.getOrCreate(
      listingId,
      modelType,
      listing.owner || listing.userId || listing.sellerId
    );
    
    // Record the inquiry
    await analytics.recordInquiry(userId, message);
    
    res.status(200).json({
      success: true,
      message: "Inquiry recorded successfully",
      data: {
        totalInquiries: analytics.totalInquiries,
      },
    });
  } catch (error) {
    console.error("Error recording inquiry:", error);
    res.status(500).json({
      success: false,
      message: "Error recording inquiry",
      error: error.message,
    });
  }
};

// Get all analytics for seller's listings
exports.getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    const analytics = await Analytics.find({ sellerId });
    
    const summary = {
      totalListings: analytics.length,
      totalViews: analytics.reduce((sum, a) => sum + a.totalViews, 0),
      totalSaves: analytics.reduce((sum, a) => sum + a.totalSaves, 0),
      totalInquiries: analytics.reduce((sum, a) => sum + a.totalInquiries, 0),
      listings: analytics.map((a) => ({
        listingId: a.listingId,
        listingType: a.listingType,
        totalViews: a.totalViews,
        saved: a.totalSaves,
        inquiries: a.totalInquiries,
      })),
    };
    
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching seller analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching seller analytics",
      error: error.message,
    });
  }
};
