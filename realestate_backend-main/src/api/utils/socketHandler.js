const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const messageService = require("../services/messageService");
const logger = require("../utils/logger");

const connectedUsers = new Map();
let ioInstance = null;

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET
      );

      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      logger.error(`Socket authentication error: ${error.message}`);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    logger.info(`User connected: ${userId} (Socket: ${socket.id})`);

    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }

    connectedUsers.get(userId).add(socket.id);

    socket.broadcast.emit("user:online", { userId });

    socket.on("thread:join", async (data) => {
      try {
        const { threadId } = data;

        await messageService.getThreadById(threadId, userId);

        socket.join(`thread:${threadId}`);
        socket.currentThread = threadId;

        logger.info(`User ${userId} joined thread ${threadId}`);

        socket.emit("thread:joined", {
          success: true,
          threadId,
        });
      } catch (error) {
        logger.error(`Join thread error: ${error.message}`);
        socket.emit("error", {
          event: "thread:join",
          message: error.message,
        });
      }
    });

    socket.on("thread:leave", (data) => {
      try {
        const { threadId } = data;

        socket.leave(`thread:${threadId}`);

        if (socket.currentThread === threadId) {
          socket.currentThread = null;
        }

        logger.info(`User ${userId} left thread ${threadId}`);

        socket.emit("thread:left", {
          success: true,
          threadId,
        });
      } catch (error) {
        logger.error(`Leave thread error: ${error.message}`);
      }
    });

    socket.on("message:send", async (data) => {
      try {
        const {
          threadId,
          type = "text",
          content,
          replyTo,
          metadata,
        } = data;

        const message = await messageService.sendMessage({
          threadId,
          senderId: userId,
          type,
          content,
          replyTo,
          metadata,
        });

        io.to(`thread:${threadId}`).emit("message:new", {
          message,
          threadId,
        });

        socket.emit("message:sent", {
          success: true,
          message,
          tempId: data.tempId,
        });

        await notifyThreadParticipants(io, threadId, userId, {
          type: "new_message",
          message,
        });

        logger.info(`Message sent in thread ${threadId} by user ${userId}`);
      } catch (error) {
        logger.error(`Send message error: ${error.message}`);
        socket.emit("message:error", {
          tempId: data.tempId,
          message: error.message,
        });
      }
    });

    socket.on("typing:start", (data) => {
      try {
        const { threadId } = data;

        socket.to(`thread:${threadId}`).emit("typing:user", {
          userId,
          threadId,
          isTyping: true,
        });
      } catch (error) {
        logger.error(`Typing start error: ${error.message}`);
      }
    });

    socket.on("typing:stop", (data) => {
      try {
        const { threadId } = data;

        socket.to(`thread:${threadId}`).emit("typing:user", {
          userId,
          threadId,
          isTyping: false,
        });
      } catch (error) {
        logger.error(`Typing stop error: ${error.message}`);
      }
    });

    socket.on("message:read", async (data) => {
      try {
        const { threadId } = data;

        await messageService.markThreadAsRead(threadId, userId);

        socket.to(`thread:${threadId}`).emit("messages:read", {
          threadId,
          userId,
          timestamp: new Date(),
        });

        socket.emit("message:read:confirmed", {
          success: true,
          threadId,
        });
      } catch (error) {
        logger.error(`Mark read error: ${error.message}`);
        socket.emit("error", {
          event: "message:read",
          message: error.message,
        });
      }
    });

    socket.on("message:edit", async (data) => {
      try {
        const { messageId, content } = data;

        const message = await messageService.editMessage(
          messageId,
          userId,
          content
        );

        io.to(`thread:${message.threadId}`).emit("message:edited", {
          message,
        });

        socket.emit("message:edit:confirmed", {
          success: true,
          message,
        });
      } catch (error) {
        logger.error(`Edit message error: ${error.message}`);
        socket.emit("error", {
          event: "message:edit",
          message: error.message,
        });
      }
    });

    socket.on("message:delete", async (data) => {
      try {
        const { messageId, threadId } = data;

        await messageService.deleteMessage(messageId, userId);

        io.to(`thread:${threadId}`).emit("message:deleted", {
          messageId,
          threadId,
        });

        socket.emit("message:delete:confirmed", {
          success: true,
          messageId,
        });
      } catch (error) {
        logger.error(`Delete message error: ${error.message}`);
        socket.emit("error", {
          event: "message:delete",
          message: error.message,
        });
      }
    });

    socket.on("thread:status", async (data) => {
      try {
        const { threadId, status, reason } = data;

        await messageService.updateThreadStatus(
          threadId,
          userId,
          status,
          reason
        );

        io.to(`thread:${threadId}`).emit("thread:status:changed", {
          threadId,
          status,
          reason,
          changedBy: userId,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error(`Update thread status error: ${error.message}`);
        socket.emit("error", {
          event: "thread:status",
          message: error.message,
        });
      }
    });

    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${userId} (Socket: ${socket.id})`);

      if (connectedUsers.has(userId)) {
        connectedUsers.get(userId).delete(socket.id);

        if (connectedUsers.get(userId).size === 0) {
          connectedUsers.delete(userId);
          socket.broadcast.emit("user:offline", { userId });
        }
      }
    });

    socket.on("error", (error) => {
      logger.error(`Socket error for user ${userId}: ${error.message}`);
    });
  });

  logger.info("Socket.io initialized successfully");
  return io;
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }

  return ioInstance;
}

async function notifyThreadParticipants(io, threadId, excludeUserId, data) {
  try {
    const ChatThread = require("../models/chatThreadModel");
    const thread = await ChatThread.findById(threadId);

    if (!thread) return;

    const participantIds = thread.participants
      .map((p) => p.userId.toString())
      .filter((id) => id !== excludeUserId.toString());

    for (const participantId of participantIds) {
      if (connectedUsers.has(participantId)) {
        const socketIds = connectedUsers.get(participantId);

        socketIds.forEach((socketId) => {
          io.to(socketId).emit("notification", {
            threadId,
            ...data,
          });
        });
      }
    }
  } catch (error) {
    logger.error(`Notify participants error: ${error.message}`);
  }
}

function isUserOnline(userId) {
  return connectedUsers.has(userId.toString());
}

function getOnlineUsers() {
  return Array.from(connectedUsers.keys());
}

function sendToUser(io, userId, event, data) {
  if (connectedUsers.has(userId.toString())) {
    const socketIds = connectedUsers.get(userId.toString());

    socketIds.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
  }
}

module.exports = {
  initializeSocket,
  getIO,
  isUserOnline,
  getOnlineUsers,
  sendToUser,
};