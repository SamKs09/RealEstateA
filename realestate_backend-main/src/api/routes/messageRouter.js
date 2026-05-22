const express = require("express");
const router = express.Router();
const messagingController = require("../controllers/messagingController");
const { auth } = require("../middleware/auth");

// Get all threads with filtering
router.get("/threads", auth, messagingController.getThreads);

// Get thread stats
router.get("/threads/stats", auth, messagingController.getThreadStats);

// Get single thread with messages
router.get("/threads/:threadId", auth, messagingController.getThreadById);

// Send message in thread
router.post("/threads/:threadId/messages", auth, messagingController.sendMessage);

// Assign thread to support agent
router.patch("/threads/:threadId/assign", auth, messagingController.assignThread);

// Update thread status
router.patch("/threads/:threadId/status", auth, messagingController.updateThreadStatus);

// Create thread from support ticket
router.post("/threads/from-ticket", auth, messagingController.createThreadFromTicket);

module.exports = router;
