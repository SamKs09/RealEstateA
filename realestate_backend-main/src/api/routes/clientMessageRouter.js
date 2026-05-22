const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { auth } = require("../middleware/auth");
const { upload } = require("../utils/multer");

// Get or create support thread
router.post("/support/thread", auth, messageController.getSupportThread);

// Get or create thread with recipient (for client-to-owner messaging)
router.post("/threads", auth, messageController.getOrCreateThread);

// Get user threads
router.get("/threads", auth, messageController.getUserThreads);

// Get single thread
router.get("/threads/:threadId", auth, messageController.getThreadById);

// Get messages in thread
router.get("/threads/:threadId/messages", auth, messageController.getThreadMessages);

// Send message
router.post("/threads/:threadId/messages", auth, messageController.sendMessage);

// Send image message
router.post(
    "/threads/:threadId/messages/image",
    auth,
    upload.single("image"),
    messageController.sendImageMessage
);

// Mark thread as read
router.post("/threads/:threadId/read", auth, messageController.markThreadAsRead);

// Search messages
router.get("/search", auth, messageController.searchMessages);

// Edit message
router.patch("/:messageId", auth, messageController.editMessage);

// Delete message
router.delete("/:messageId", auth, messageController.deleteMessage);

// Get unread count
router.get("/unread/count", auth, messageController.getUnreadCount);

module.exports = router;
