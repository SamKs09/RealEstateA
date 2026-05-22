const messageService = require("../services/messageService");
const logger = require("../utils/logger");
const path = require("path");
const fs = require("fs");

/**
 * Message Controllers
 * Handle HTTP requests for messaging system
 */

/**
 * Create a new chat thread
 * POST /api/messages/threads
 */
exports.createThread = async (req, res) => {
  try {
    const { participantIds, type, subject, category, priority, metadata } =
      req.body;
    const userId = req.user._id;

    // Format participants
    const participants = participantIds.map((id) => ({
      userId: id,
      role: id.toString() === userId.toString() ? "user" : "user",
    }));

    // Ensure current user is a participant
    if (!participants.some((p) => p.userId.toString() === userId.toString())) {
      participants.push({
        userId,
        role: "user",
      });
    }

    const thread = await messageService.createThread({
      participants,
      type,
      subject,
      category,
      priority,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: "Thread created successfully",
      data: thread,
    });
  } catch (error) {
    logger.error(`Create thread error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get or create support thread
 * POST /api/messages/support/thread
 */
exports.getSupportThread = async (req, res) => {
  try {
    const userId = req.user._id;
    const { category = "general" } = req.body;

    const thread = await messageService.getOrCreateSupportThread(
      userId,
      category
    );

    res.status(200).json({
      success: true,
      message: "Support thread retrieved",
      data: thread,
    });
  } catch (error) {
    logger.error(`Get support thread error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get or create chat thread with recipient
 * POST /api/client/messages/threads
 */
exports.getOrCreateThread = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { recipientId, listingId, listingType } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: "recipientId is required",
      });
    }

    // Check if thread already exists between these two users
    const existingThreadsResult = await messageService.getUserThreads(currentUserId, {
      type: "user_to_user",
      limit: 100,
    });
    const existingThreads = existingThreadsResult.threads || [];

    const existingThread = existingThreads.find((thread) => {
      const hasRecipient = thread.participants.some((p) => {
        const id = p.userId._id || p.userId;
        return id.toString() === recipientId.toString();
      });

      if (!hasRecipient) {
        return false;
      }

      if (listingId && listingType) {
        return (
          thread.metadata?.listingId?.toString() === listingId.toString() &&
          thread.metadata?.listingType === listingType
        );
      }

      return !thread.metadata?.listingId;
    });

    if (existingThread) {
      return res.status(200).json({
        success: true,
        message: "Thread found",
        data: existingThread,
      });
    }

    // Create new thread
    const participants = [
      { userId: currentUserId, role: "user" },
      { userId: recipientId, role: "owner" },
    ];

    const thread = await messageService.createThread({
      participants,
      type: "user_to_user",
      status: "active",
      category: listingType === "vehicle" ? "vehicle" : listingType === "property" ? "property" : "general",
      metadata: {
        listingId,
        listingType,
      },
    });

    res.status(201).json({
      success: true,
      message: "Thread created successfully",
      data: thread,
    });
  } catch (error) {
    logger.error(`Get or create thread error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user's chat threads
 * GET /api/messages/threads
 */
exports.getUserThreads = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      type,
      status,
      limit = 20,
      skip = 0,
      sortBy = "updatedAt",
      sortOrder = -1,
    } = req.query;

    const result = await messageService.getUserThreads(userId, {
      type,
      status: status ? status.split(",") : undefined,
      limit: parseInt(limit),
      skip: parseInt(skip),
      sortBy,
      sortOrder: parseInt(sortOrder),
    });

    res.status(200).json({
      success: true,
      message: "Threads retrieved successfully",
      data: result.threads,
      pagination: {
        total: result.total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    logger.error(`Get user threads error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get thread by ID
 * GET /api/messages/threads/:threadId
 */
exports.getThreadById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { threadId } = req.params;

    const thread = await messageService.getThreadById(threadId, userId);

    res.status(200).json({
      success: true,
      message: "Thread retrieved successfully",
      data: thread,
    });
  } catch (error) {
    logger.error(`Get thread error: ${error.message}`);
    res.status(error.message.includes("not found") ? 404 : 403).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Send a message
 * POST /api/messages/threads/:threadId/messages
 */
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { threadId } = req.params;
    const { type = "text", content, replyTo, metadata } = req.body;

    const { message, thread } = await messageService.sendMessage({
      threadId,
      senderId: userId,
      type,
      content,
      replyTo,
      metadata,
    });

    const io = req.app.get('io');
    if (io) {
      // Emit to thread room
      io.to(`thread:${threadId}`).emit('message:new', {
        threadId,
        message,
      });

      // Emit global thread update (for dashboard lists)
      io.emit('thread:updated', {
        threadId,
        lastMessage: thread.lastMessage,
        unreadCount: thread.unreadCount,
        lastActivityAt: thread.lastActivityAt,
      });
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    logger.error(`Send message error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Upload and send image message
 * POST /api/messages/threads/:threadId/messages/image
 */
exports.sendImageMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { threadId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Get file info
    const fileName = req.file.filename;
    const fileUrl = `/uploads/messages/${fileName}`;

    const { message, thread } = await messageService.sendMessage({
      threadId,
      senderId: userId,
      type: "image",
      content: {
        text: req.body.caption || "",
        mediaUrl: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
      metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`thread:${threadId}`).emit('message:new', {
        threadId,
        message,
      });

      io.emit('thread:updated', {
        threadId,
        lastMessage: thread.lastMessage,
        unreadCount: thread.unreadCount,
        lastActivityAt: thread.lastActivityAt,
      });
    }

    res.status(201).json({
      success: true,
      message: "Image sent successfully",
      data: message,
    });
  } catch (error) {
    logger.error(`Send image error: ${error.message}`);

    // Clean up uploaded file on error
    if (req.file) {
      const filePath = path.join(__dirname, "../uploads/messages", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get messages in a thread
 * GET /api/messages/threads/:threadId/messages
 */
exports.getThreadMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { threadId } = req.params;
    const { limit = 50, before, after } = req.query;

    const result = await messageService.getThreadMessages(threadId, userId, {
      limit: parseInt(limit),
      before,
      after,
    });

    res.status(200).json({
      success: true,
      message: "Messages retrieved successfully",
      data: result.messages,
      pagination: {
        hasMore: result.hasMore,
        threadId: result.threadId,
      },
    });
  } catch (error) {
    logger.error(`Get messages error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Mark thread as read
 * POST /api/messages/threads/:threadId/read
 */
exports.markThreadAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { threadId } = req.params;

    const result = await messageService.markThreadAsRead(threadId, userId);

    res.status(200).json({
      success: true,
      message: "Thread marked as read",
      data: result,
    });
  } catch (error) {
    logger.error(`Mark thread as read error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update thread status
 * PATCH /api/messages/threads/:threadId/status
 */
exports.updateThreadStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { threadId } = req.params;
    const { status, reason } = req.body;

    const thread = await messageService.updateThreadStatus(
      threadId,
      userId,
      status,
      reason
    );

    res.status(200).json({
      success: true,
      message: "Thread status updated",
      data: thread,
    });
  } catch (error) {
    logger.error(`Update thread status error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Assign thread to support agent
 * POST /api/messages/threads/:threadId/assign
 */
exports.assignThread = async (req, res) => {
  try {
    const userId = req.user._id;
    const { threadId } = req.params;
    const { agentId } = req.body;

    const thread = await messageService.assignThread(
      threadId,
      agentId,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Thread assigned successfully",
      data: thread,
    });
  } catch (error) {
    logger.error(`Assign thread error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get support dashboard statistics
 * GET /api/messages/support/stats
 */
exports.getSupportStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { agentId } = req.query;

    // If agentId not specified, use current user if they're support/admin
    const stats = await messageService.getSupportStats(
      agentId || (req.user.role?.includes("admin") ? null : userId)
    );

    res.status(200).json({
      success: true,
      message: "Statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    logger.error(`Get support stats error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Search messages
 * GET /api/messages/search
 */
exports.searchMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { q: searchText, limit = 20, skip = 0 } = req.query;

    if (!searchText || searchText.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search text must be at least 2 characters",
      });
    }

    const result = await messageService.searchMessages(
      userId,
      searchText.trim(),
      {
        limit: parseInt(limit),
        skip: parseInt(skip),
      }
    );

    res.status(200).json({
      success: true,
      message: "Search completed",
      data: result.messages,
      pagination: {
        total: result.total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    logger.error(`Search messages error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete message
 * DELETE /api/messages/:messageId
 */
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    const result = await messageService.deleteMessage(messageId, userId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      data: result,
    });
  } catch (error) {
    logger.error(`Delete message error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Edit message
 * PATCH /api/messages/:messageId
 */
exports.editMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const message = await messageService.editMessage(
      messageId,
      userId,
      content.trim()
    );

    res.status(200).json({
      success: true,
      message: "Message edited successfully",
      data: message,
    });
  } catch (error) {
    logger.error(`Edit message error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get unread messages count
 * GET /api/messages/unread/count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const ChatThread = require("../models/chatThreadModel");

    const threads = await ChatThread.find({
      "participants.userId": userId,
      status: { $in: ["active"] },
      isDeleted: false,
    });

    let totalUnread = 0;
    threads.forEach((thread) => {
      totalUnread += thread.getUnreadCount(userId);
    });

    res.status(200).json({
      success: true,
      message: "Unread count retrieved",
      data: {
        totalUnread,
        threadCount: threads.length,
      },
    });
  } catch (error) {
    logger.error(`Get unread count error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
