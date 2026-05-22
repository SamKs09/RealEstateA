const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Message Model
 * Represents individual messages within a chat thread
 */
const messageSchema = new Schema(
  {
    // Reference to the chat thread
    threadId: {
      type: Schema.Types.ObjectId,
      ref: "ChatThread",
      required: true,
      index: true,
    },

    // Sender information
    sender: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
         enum: ["user", "owner", "support", "admin"],
        default: "user",
      },
    },

    // Message type
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
      required: true,
    },

    // Message content
    content: {
      text: {
        type: String,
        trim: true,
      },
      // For images and files
      mediaUrl: {
        type: String,
      },
      fileName: {
        type: String,
      },
      fileSize: {
        type: Number, // in bytes
      },
      mimeType: {
        type: String,
      },
      // For system messages
      systemMessageType: {
        type: String,
        enum: [
          "thread_created",
          "thread_closed",
          "thread_reopened",
          "user_joined",
          "user_left",
          "assigned",
          "priority_changed",
        ],
      },
    },

    // Message status
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
    },

    // Read receipts
    readBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Delivery receipts
    deliveredTo: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        deliveredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Reply/Thread
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // Reactions (optional feature)
    reactions: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Message editing
    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
      default: null,
    },

    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Metadata
    metadata: {
      clientInfo: {
        platform: String, // 'ios', 'android', 'web'
        version: String,
        deviceId: String,
      },
      ipAddress: String,
      userAgent: String,
    },

    // For failed messages
    failureReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for better query performance
messageSchema.index({ threadId: 1, createdAt: -1 });
messageSchema.index({ "sender.userId": 1, createdAt: -1 });
messageSchema.index({ threadId: 1, status: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ isDeleted: 1, threadId: 1 });

// Compound index for efficient pagination
messageSchema.index({ threadId: 1, _id: -1 });

// Method to mark message as read by user
messageSchema.methods.markAsReadBy = function (userId) {
  // Check if already marked as read
  const alreadyRead = this.readBy.some(
    (r) => r.userId.toString() === userId.toString()
  );

  if (!alreadyRead) {
    this.readBy.push({
      userId,
      readAt: new Date(),
    });
    this.status = "read";
  }
};

// Method to mark message as delivered to user
messageSchema.methods.markAsDeliveredTo = function (userId) {
  // Check if already marked as delivered
  const alreadyDelivered = this.deliveredTo.some(
    (d) => d.userId.toString() === userId.toString()
  );

  if (!alreadyDelivered) {
    this.deliveredTo.push({
      userId,
      deliveredAt: new Date(),
    });

    if (this.status === "sent") {
      this.status = "delivered";
    }
  }
};

// Method to add reaction
messageSchema.methods.addReaction = function (userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    (r) => r.userId.toString() !== userId.toString()
  );

  // Add new reaction
  this.reactions.push({
    userId,
    emoji,
    createdAt: new Date(),
  });
};

// Method to remove reaction
messageSchema.methods.removeReaction = function (userId) {
  this.reactions = this.reactions.filter(
    (r) => r.userId.toString() !== userId.toString()
  );
};

// Method to edit message
messageSchema.methods.editContent = function (newContent) {
  // Save old content to history
  if (this.content.text) {
    this.editHistory.push({
      content: this.content.text,
      editedAt: new Date(),
    });
  }

  // Update content
  this.content.text = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
};

// Virtual for checking if message is a media message
messageSchema.virtual("isMediaMessage").get(function () {
  return this.type === "image" || this.type === "file";
});

// Static method to get messages with pagination
messageSchema.statics.getThreadMessages = async function (
  threadId,
  options = {}
) {
  const { limit = 50, before = null, after = null } = options;

  let query = {
    threadId,
    isDeleted: false,
  };

  // Pagination using cursor-based approach
  if (before) {
    query._id = { $lt: before };
  } else if (after) {
    query._id = { $gt: after };
  }

  return this.find(query)
    .sort({ createdAt: after ? 1 : -1 })
    .limit(limit)
    .populate("sender.userId", "fullName firstName lastName avatar")
    .populate("replyTo", "content.text sender")
    .lean();
};

// Static method to count unread messages for user in thread
messageSchema.statics.countUnreadInThread = async function (threadId, userId) {
  const thread = await mongoose.model("ChatThread").findById(threadId);
  if (!thread) return 0;

  const participant = thread.participants.find(
    (p) => p.userId.toString() === userId.toString()
  );

  if (!participant || !participant.lastReadAt) {
    // If never read, count all messages not from this user
    return this.countDocuments({
      threadId,
      "sender.userId": { $ne: userId },
      isDeleted: false,
    });
  }

  // Count messages after last read time
  return this.countDocuments({
    threadId,
    "sender.userId": { $ne: userId },
    createdAt: { $gt: participant.lastReadAt },
    isDeleted: false,
  });
};

// Ensure virtuals are included in JSON
messageSchema.set("toJSON", { virtuals: true });
messageSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Message", messageSchema);
