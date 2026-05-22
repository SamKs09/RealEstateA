const ChatThread = require("../models/chatThreadModel");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Analytics = require("../models/analyticsModel");
const logger = require("../utils/logger");

/**
 * Message Service
 * Business logic for messaging system
 */
class MessageService {
  /**
   * Create a new chat thread
   */
  async createThread(data) {
    try {
      const {
        participants,
        type = "user_to_support",
        subject,
        category,
        priority,
        metadata,
      } = data;

      // Validate participants exist
      for (const participant of participants) {
        const user = await User.findById(participant.userId);
        if (!user) {
          throw new Error(`User ${participant.userId} not found`);
        }
      }

      // Check if thread already exists for user-to-user
      if (type === "user_to_user" && participants.length === 2) {
        const listingId = metadata?.listingId ? metadata.listingId.toString() : null;
        const listingType = metadata?.listingType || null;
        const existingThread = await ChatThread.findOne({
          type: "user_to_user",
          "participants.userId": {
            $all: [participants[0].userId, participants[1].userId],
          },
          isDeleted: false,
          ...(listingId && listingType
            ? {
                "metadata.listingId": metadata.listingId,
                "metadata.listingType": listingType,
              }
            : {}),
        });
        if (existingThread) {
          return existingThread;
        }
      }

      // Initialize unreadCount map
      const unreadCount = {};
      participants.forEach((p) => {
        unreadCount[p.userId.toString()] = 0;
      });

      // Create thread
      const thread = await ChatThread.create({
        participants,
        type,
        subject,
        category,
        priority,
        metadata,
        unreadCount,
        status: "active",
      });

      // Populate participants
      await thread.populate("participants.userId", "fullName firstName lastName avatar email");

      logger.info(`Chat thread created: ${thread._id}`);
      return thread;
    } catch (error) {
      logger.error(`Error creating thread: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get or create support thread for user
   */
  async getOrCreateSupportThread(userId, category = "general") {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const thread = await ChatThread.findOrCreateSupportThread(
        userId,
        category
      );

      await thread.populate("participants.userId", "fullName firstName lastName avatar email");
      await thread.populate("assignedTo", "fullName firstName lastName avatar email");

      return thread;
    } catch (error) {
      logger.error(`Error getting/creating support thread: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's chat threads
   */
  async getUserThreads(userId, options = {}) {
    try {
      const {
        type,
        status = ["active", "closed"],
        limit = 20,
        skip = 0,
        sortBy = "updatedAt",
        sortOrder = -1,
      } = options;

      const query = {
        "participants.userId": userId,
        status: { $in: Array.isArray(status) ? status : [status] },
        isDeleted: false,
      };

      if (type) {
        query.type = type;
      }

      const threads = await ChatThread.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate("participants.userId", "fullName firstName lastName avatar email")
        .populate("lastMessage.senderId", "fullName firstName lastName avatar")
        .populate("assignedTo", "fullName firstName lastName avatar email")
        .lean();

      // Add unread count for current user
      const threadsWithUnread = threads.map((thread) => ({
        ...thread,
        unreadCount: thread.unreadCount?.[userId.toString()] || 0,
      }));

      const total = await ChatThread.countDocuments(query);

      return {
        threads: threadsWithUnread,
        total,
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error(`Error getting user threads: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get thread by ID with validation
   */
  async getThreadById(threadId, userId) {
    try {
      const thread = await ChatThread.findOne({
        _id: threadId,
        isDeleted: false,
      })
        .populate("participants.userId", "fullName firstName lastName avatar email role")
        .populate("assignedTo", "fullName firstName lastName avatar email")
        .lean();

      if (!thread) {
        throw new Error("Thread not found");
      }

      // Check if user is participant
      const isParticipant = thread.participants.some(
        (p) => p.userId._id.toString() === userId.toString()
      );

      if (!isParticipant) {
        throw new Error("Access denied: Not a participant of this thread");
      }

      // Add unread count for current user
      thread.unreadCount = thread.unreadCount?.[userId.toString()] || 0;

      return thread;
    } catch (error) {
      logger.error(`Error getting thread: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a message
   */
  async sendMessage(data) {
    try {
      const { threadId, senderId, type, content, replyTo, metadata } = data;

      // Get thread and validate
      const thread = await ChatThread.findById(threadId);
      if (!thread) {
        throw new Error("Thread not found");
      }

      // Validate sender is participant
      if (!thread.isParticipant(senderId)) {
        throw new Error("Sender is not a participant of this thread");
      }

      // Get sender info
      const sender = await User.findById(senderId);
      if (!sender) {
        throw new Error("Sender not found");
      }

      // Determine sender role
      const senderRole = sender.role?.includes("admin")
        ? "admin"
        : thread.participants.find(
          (p) => p.userId.toString() === senderId.toString()
        )?.role || "user";
      const shouldRecordInquiry =
        senderRole === "user" &&
        thread.messageCount === 0 &&
        !!thread.metadata?.listingId &&
        !!thread.metadata?.listingType;

      // Create message
      const message = await Message.create({
        threadId,
        sender: {
          userId: senderId,
          role: senderRole,
        },
        type,
        content,
        replyTo,
        metadata,
        status: "sent",
      });

      // Update thread
      thread.lastMessage = {
        content: content.text || "Media message",
        senderId,
        timestamp: message.createdAt,
        type,
      };

      thread.incrementMessageCount();
      thread.incrementUnreadForOthers(senderId);
      thread.updatedAt = new Date();

      await thread.save();

      if (shouldRecordInquiry) {
        try {
          const sellerParticipant = thread.participants.find(
            (participant) => participant.role === "owner"
          );

          if (sellerParticipant) {
            const analytics = await Analytics.getOrCreate(
              thread.metadata.listingId,
              thread.metadata.listingType === "property" ? "Property" : "Vehicle",
              sellerParticipant.userId
            );

            await analytics.recordInquiry(
              senderId,
              content?.text || "Initial buyer message"
            );
          }
        } catch (analyticsError) {
          logger.warn(`Failed to record inquiry analytics from first message: ${analyticsError.message}`);
        }
      }

      // Trigger notifications for other participants
      const { sendNotification } = require("../utils/notificationHelper");
      const { getTemplate } = require("../utils/notificationTemplates");
      const otherParticipants = thread.participants.filter(
        (p) => p.userId.toString() !== senderId.toString()
      );

      for (const participant of otherParticipants) {
        let notificationType = "message";
        let tpl;

        if (
          thread.type === "user_to_support" &&
          (senderRole === "support" || senderRole === "admin")
        ) {
          notificationType = "support_reply";
          tpl = getTemplate("support_reply", sender.firstName || sender.email);
        } else {
          tpl = getTemplate("message", sender.firstName || sender.email);
        }

        await sendNotification(
          participant.userId,
          notificationType,
          tpl.title,
          tpl.body,
          {
            deepLink: `/chat/${threadId}`,
            relatedId: threadId,
            senderId: senderId,
          }
        );
      }

      // Populate message
      await message.populate("sender.userId", "fullName firstName lastName avatar");
      if (replyTo) {
        await message.populate("replyTo", "content.text sender");
      }

      logger.info(`Message sent in thread ${threadId} by user ${senderId}`);
      return { message, thread };
    } catch (error) {
      logger.error(`Error sending message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get messages in a thread
   */
  async getThreadMessages(threadId, userId, options = {}) {
    try {
      const { limit = 50, before, after } = options;

      // Validate thread and user access
      const thread = await ChatThread.findById(threadId);
      if (!thread) {
        throw new Error("Thread not found");
      }

      if (!thread.isParticipant(userId)) {
        throw new Error("Access denied");
      }

      // Get messages
      const messages = await Message.getThreadMessages(threadId, {
        limit,
        before,
        after,
      });

      // If no cursor specified, we got latest messages, so reverse for chronological order
      if (!before && !after) {
        messages.reverse();
      }

      return {
        messages,
        hasMore: messages.length === limit,
        threadId,
      };
    } catch (error) {
      logger.error(`Error getting thread messages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark thread as read for user
   */
  async markThreadAsRead(threadId, userId) {
    try {
      const thread = await ChatThread.findById(threadId);
      if (!thread) {
        throw new Error("Thread not found");
      }

      if (!thread.isParticipant(userId)) {
        throw new Error("Access denied");
      }

      thread.markAsReadForUser(userId);
      await thread.save();

      // Mark messages as read
      const unreadMessages = await Message.find({
        threadId,
        "sender.userId": { $ne: userId },
        isDeleted: false,
        status: { $ne: "read" },
      });

      for (const message of unreadMessages) {
        message.markAsReadBy(userId);
        await message.save();
      }

      logger.info(`Thread ${threadId} marked as read by user ${userId}`);
      return { success: true, unreadCount: 0 };
    } catch (error) {
      logger.error(`Error marking thread as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update thread status
   */
  async updateThreadStatus(threadId, userId, status, reason = null) {
    try {
      const thread = await ChatThread.findById(threadId);
      if (!thread) {
        throw new Error("Thread not found");
      }

      // Only support/admin can change status
      const user = await User.findById(userId);
      const participant = thread.participants.find(
        (p) => p.userId.toString() === userId.toString()
      );

      if (
        !user.role?.includes("admin") &&
        participant?.role !== "support" &&
        participant?.role !== "admin"
      ) {
        throw new Error("Only support/admin can change thread status");
      }

      thread.status = status;

      if (status === "closed") {
        thread.closedAt = new Date();
        thread.closedBy = userId;
        thread.closedReason = reason;

        // Create system message
        await Message.create({
          threadId,
          sender: {
            userId,
            role: participant?.role || "admin",
          },
          type: "system",
          content: {
            text: `Thread closed${reason ? `: ${reason}` : ""}`,
            systemMessageType: "thread_closed",
          },
          status: "sent",
        });
      }

      await thread.save();
      logger.info(`Thread ${threadId} status updated to ${status}`);
      return thread;
    } catch (error) {
      logger.error(`Error updating thread status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign thread to support agent
   */
  async assignThread(threadId, agentId, assignedBy) {
    try {
      const thread = await ChatThread.findById(threadId);
      if (!thread) {
        throw new Error("Thread not found");
      }

      if (thread.type !== "user_to_support") {
        throw new Error("Only support threads can be assigned");
      }

      const agent = await User.findById(agentId);
      if (!agent) {
        throw new Error("Agent not found");
      }

      thread.assignedTo = agentId;

      // Add agent to participants if not already there
      const isParticipant = thread.participants.some(
        (p) => p.userId.toString() === agentId.toString()
      );

      if (!isParticipant) {
        thread.participants.push({
          userId: agentId,
          role: "support",
        });
        thread.unreadCount.set(agentId.toString(), thread.messageCount);
      }

      await thread.save();

      // Create system message
      await Message.create({
        threadId,
        sender: {
          userId: assignedBy,
          role: "admin",
        },
        type: "system",
        content: {
          text: `Thread assigned to ${agent.fullName || agent.email}`,
          systemMessageType: "assigned",
        },
        status: "sent",
      });

      logger.info(`Thread ${threadId} assigned to agent ${agentId}`);
      return thread;
    } catch (error) {
      logger.error(`Error assigning thread: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get support dashboard statistics
   */
  async getSupportStats(agentId = null) {
    try {
      const query = {
        type: "user_to_support",
        isDeleted: false,
      };

      if (agentId) {
        query.assignedTo = agentId;
      }

      const [
        activeCount,
        closedCount,
        unassignedCount,
        highPriorityCount,
        totalMessages,
      ] = await Promise.all([
        ChatThread.countDocuments({ ...query, status: "active" }),
        ChatThread.countDocuments({ ...query, status: "closed" }),
        ChatThread.countDocuments({
          ...query,
          status: "active",
          assignedTo: null,
        }),
        ChatThread.countDocuments({
          ...query,
          status: "active",
          priority: { $in: ["high", "urgent"] },
        }),
        Message.countDocuments({
          threadId: {
            $in: await ChatThread.find(query).distinct("_id"),
          },
        }),
      ]);

      return {
        active: activeCount,
        closed: closedCount,
        unassigned: unassignedCount,
        highPriority: highPriorityCount,
        totalMessages,
      };
    } catch (error) {
      logger.error(`Error getting support stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search messages
   */
  async searchMessages(userId, searchText, options = {}) {
    try {
      const { limit = 20, skip = 0 } = options;

      // Get user's threads
      const threads = await ChatThread.find({
        "participants.userId": userId,
        isDeleted: false,
      }).distinct("_id");

      // Search messages
      const messages = await Message.find({
        threadId: { $in: threads },
        "content.text": { $regex: searchText, $options: "i" },
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender.userId", "fullName firstName lastName avatar")
        .populate("threadId", "subject type participants")
        .lean();

      const total = await Message.countDocuments({
        threadId: { $in: threads },
        "content.text": { $regex: searchText, $options: "i" },
        isDeleted: false,
      });

      return {
        messages,
        total,
        hasMore: skip + limit < total,
      };
    } catch (error) {
      logger.error(`Error searching messages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(messageId, userId) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      // Only sender can delete
      if (message.sender.userId.toString() !== userId.toString()) {
        throw new Error("Only sender can delete message");
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      message.deletedBy = userId;

      await message.save();

      logger.info(`Message ${messageId} deleted by user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Edit message
   */
  async editMessage(messageId, userId, newContent) {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      // Only sender can edit
      if (message.sender.userId.toString() !== userId.toString()) {
        throw new Error("Only sender can edit message");
      }

      // Can only edit text messages
      if (message.type !== "text") {
        throw new Error("Can only edit text messages");
      }

      message.editContent(newContent);
      await message.save();

      logger.info(`Message ${messageId} edited by user ${userId}`);
      return message;
    } catch (error) {
      logger.error(`Error editing message: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new MessageService();
