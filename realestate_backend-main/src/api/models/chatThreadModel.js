const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * ChatThread Model
 * Represents a conversation thread for support or user-to-user
 */
const chatThreadSchema = new Schema(
  {
    // Type of thread
    type: {
      type: String,
      enum: ["user_to_support", "user_to_user"],
      default: "user_to_support",
      required: true,
    },

    // Participants (Flexible array for any number of users/roles)
    participants: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["user", "owner", "support", "admin", "system"],
          default: "user",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Thread status
    status: {
      type: String,
      enum: ["active", "closed", "archived", "unassigned"],
      default: "active",
      index: true,
    },

    // Assigned agent (optional, for quick reference/querying)
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // Priority
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Subject/Title
    subject: {
      type: String,
      trim: true,
      default: "Support Request",
    },

    // Category
    category: {
      type: String,
      enum: ["general", "technical", "billing", "account", "property", "vehicle", "other"],
      default: "general",
    },

    // Last message info (for quick display)
    lastMessage: {
      content: String,
      senderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      timestamp: Date,
      type: {
        type: String,
        default: "text",
      },
    },

    // Unread count map (userId -> count)
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },

    // Metadata
    metadata: {
      userAgent: String,
      ipAddress: String,
      device: String,
      listingId: {
        type: Schema.Types.ObjectId,
      },
      listingType: {
        type: String,
        enum: ["property", "vehicle"],
      },
    },

    // Timestamps
    closedAt: Date,
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    closedReason: String,
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
chatThreadSchema.index({ "participants.userId": 1, status: 1 });
chatThreadSchema.index({ assignedTo: 1, status: 1 });
chatThreadSchema.index({ status: 1, lastActivityAt: -1 });

// Static method to find or create a support thread for a user
chatThreadSchema.statics.findOrCreateSupportThread = async function (userId, category = "general") {
  // Find active support thread for this user
  let thread = await this.findOne({
    "participants.userId": userId,
    type: "user_to_support",
    status: { $in: ["active", "unassigned"] },
  });

  if (!thread) {
    // Create new thread
    thread = await this.create({
      participants: [
        { userId, role: "user" },
      ],
      type: "user_to_support",
      category,
      status: "active",
      unreadCount: { [userId]: 0 },
      lastActivityAt: new Date(),
    });
  }

  return thread;
};

chatThreadSchema.statics.findThreadBetweenUsers = async function (user1Id, user2Id) {
  return this.findOne({
    type: "user_to_user",
    "participants.userId": { $all: [user1Id, user2Id] },
    isDeleted: false,
  });
};

// Method to check if user is participant
chatThreadSchema.methods.isParticipant = function (userId) {
  return this.participants.some((p) => p.userId.toString() === userId.toString());
};

// Method to increment unread count for others
chatThreadSchema.methods.incrementUnreadForOthers = function (senderId) {
  // Initialize map if needed
  if (!this.unreadCount) {
    this.unreadCount = new Map();
  }

  this.participants.forEach((p) => {
    if (p.userId.toString() !== senderId.toString()) {
      const current = this.unreadCount.get(p.userId.toString()) || 0;
      this.unreadCount.set(p.userId.toString(), current + 1);
    }
  });

  // If assigned agent is not in participants list (legacy), add them?
  // Our new logic puts them in participants, so loop above covers it.
  return this;
};

chatThreadSchema.methods.incrementMessageCount = function () {
  this.messageCount = (this.messageCount || 0) + 1;
  return this;
};

chatThreadSchema.methods.markAsReadForUser = function (userId) {
  if (!this.unreadCount) {
    this.unreadCount = new Map();
  }
  this.unreadCount.set(userId.toString(), 0);
};

chatThreadSchema.methods.getUnreadCount = function (userId) {
  return this.unreadCount ? (this.unreadCount.get(userId.toString()) || 0) : 0;
};

module.exports = mongoose.model("ChatThread", chatThreadSchema);
