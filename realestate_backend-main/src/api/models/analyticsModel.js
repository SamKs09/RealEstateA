const mongoose = require("mongoose");

// Analytics Schema for tracking listing metrics
const analyticsSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "listingType",
    },
    listingType: {
      type: String,
      required: true,
      enum: ["Property", "Vehicle"],
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // View tracking
    totalViews: {
      type: Number,
      default: 0,
    },
    uniqueViews: {
      type: Number,
      default: 0,
    },
    viewHistory: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        ipAddress: String,
        userAgent: String,
      },
    ],
    
    // Save/Favorite tracking
    totalSaves: {
      type: Number,
      default: 0,
    },
    savedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        savedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // Inquiry tracking
    totalInquiries: {
      type: Number,
      default: 0,
    },
    inquiries: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["new", "read", "replied"],
          default: "new",
        },
      },
    ],
    
    // Weekly views for chart
    weeklyViews: {
      type: Map,
      of: Number,
      default: {},
    },
    
    // Monthly stats
    monthlyStats: {
      type: Map,
      of: {
        views: Number,
        saves: Number,
        inquiries: Number,
      },
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
analyticsSchema.index({ listingId: 1, listingType: 1 });
analyticsSchema.index({ sellerId: 1 });
analyticsSchema.index({ "viewHistory.timestamp": 1 });
analyticsSchema.index({ "inquiries.timestamp": 1 });

// Method to record a view
analyticsSchema.methods.recordView = async function (userId, ipAddress, userAgent) {
  this.totalViews += 1;
  
  // Check if this is a unique view (user hasn't viewed before)
  const hasViewed = this.viewHistory.some(
    (view) => view.userId && view.userId.toString() === userId?.toString()
  );
  
  if (!hasViewed && userId) {
    this.uniqueViews += 1;
  }
  
  // Add to view history
  this.viewHistory.push({
    userId,
    timestamp: new Date(),
    ipAddress,
    userAgent,
  });
  
  // Update weekly views
  const today = new Date().toISOString().split("T")[0];
  const currentViews = this.weeklyViews.get(today) || 0;
  this.weeklyViews.set(today, currentViews + 1);
  
  // Keep only last 30 days of view history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  this.viewHistory = this.viewHistory.filter(
    (view) => view.timestamp > thirtyDaysAgo
  );
  
  await this.save();
  return this;
};

// Method to record a save/favorite
analyticsSchema.methods.recordSave = async function (userId) {
  // Check if already saved
  const alreadySaved = this.savedBy.some(
    (save) => save.userId.toString() === userId.toString()
  );
  
  if (!alreadySaved) {
    this.totalSaves += 1;
    this.savedBy.push({
      userId,
      savedAt: new Date(),
    });
    await this.save();
  }
  
  return this;
};

// Method to remove a save/favorite
analyticsSchema.methods.removeSave = async function (userId) {
  const saveIndex = this.savedBy.findIndex(
    (save) => save.userId.toString() === userId.toString()
  );
  
  if (saveIndex !== -1) {
    this.totalSaves = Math.max(0, this.totalSaves - 1);
    this.savedBy.splice(saveIndex, 1);
    await this.save();
  }
  
  return this;
};

// Method to record an inquiry
analyticsSchema.methods.recordInquiry = async function (userId, message) {
  const alreadyInquired = this.inquiries.some(
    (inquiry) => inquiry.userId.toString() === userId.toString()
  );

  if (alreadyInquired) {
    return this;
  }

  this.totalInquiries += 1;
  this.inquiries.push({
    userId,
    message,
    timestamp: new Date(),
    status: "new",
  });
  
  // Keep only last 100 inquiries
  if (this.inquiries.length > 100) {
    this.inquiries = this.inquiries.slice(-100);
  }
  
  await this.save();
  return this;
};

// Method to get weekly views for chart
analyticsSchema.methods.getWeeklyViews = function () {
  const result = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    result.push(this.weeklyViews.get(dateStr) || 0);
  }
  
  return result;
};

// Method to get recent inquiries with user details
analyticsSchema.methods.getRecentInquiries = async function (limit = 10) {
  const recentInquiries = this.inquiries
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
  
  // Populate user details
  await this.populate({
    path: "inquiries.userId",
    select: "firstName lastName email profilePicture",
  });
  
  return recentInquiries.map((inquiry) => ({
    id: inquiry._id,
    name: inquiry.userId
      ? `${inquiry.userId.firstName} ${inquiry.userId.lastName}`
      : "Anonymous",
    message: inquiry.message,
    time: inquiry.timestamp,
    avatar: inquiry.userId?.profilePicture || null,
    status: inquiry.status,
  }));
};

// Static method to get or create analytics for a listing
analyticsSchema.statics.getOrCreate = async function (
  listingId,
  listingType,
  sellerId
) {
  let analytics = await this.findOne({ listingId, listingType });
  
  if (!analytics) {
    analytics = await this.create({
      listingId,
      listingType,
      sellerId,
    });
  }
  
  return analytics;
};

const Analytics = mongoose.model("Analytics", analyticsSchema);

module.exports = Analytics;
