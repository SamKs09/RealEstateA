const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const SupportMessage = require('../models/SupportMessageModel');

// ============================================
// USER ROUTES (Mobile App)
// ============================================

/**
 * @route   POST /api/support/conversation
 * @desc    Create or get user's conversation
 * @access  Private (User)
 */
router.post('/conversation', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { subject, category } = req.body;

    // Check if user has an open conversation
    let conversation = await Conversation.findOne({
      'participants.userId': userId,
      'participants.role': 'user',
      status: { $in: ['open', 'active'] }
    }).populate('participants.userId', 'firstName lastName avatar');

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [
          { userId, role: 'user', unreadCount: 0 },
          { userId: null, role: 'support', unreadCount: 0 }
        ],
        subject: subject || 'Support Request',
        category: category || 'general',
        status: 'open'
      });

      await conversation.save();
      await conversation.populate('participants.userId', 'firstName lastName avatar');
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/support/my-conversation
 * @desc    Get user's conversation with messages
 * @access  Private (User)
 */
router.get('/my-conversation', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      'participants.userId': userId,
      'participants.role': 'user'
    }).populate('participants.userId', 'firstName lastName avatar');

    if (!conversation) {
      return res.json({
        success: true,
        data: null
      });
    }

    const messages = await SupportMessage.find({ conversationId: conversation._id })
      .populate('senderId', 'firstName lastName avatar')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        conversation,
        messages
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/support/conversation/:conversationId/message
 * @desc    Send message to support
 * @access  Private (User)
 */
router.post('/conversation/:conversationId/message', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, attachments } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify user is participant
    const userParticipant = conversation.participants.find(
      p => p.userId && p.userId.toString() === userId.toString() && p.role === 'user'
    );

    if (!userParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get support participant
    const supportParticipant = conversation.participants.find(p => p.role === 'support');

    // Create message
    const message = new SupportMessage({
      conversationId,
      senderId: userId,
      receiverId: supportParticipant?.userId,
      text,
      isFromUser: true,
      status: 'sent',
      attachments: attachments || []
    });

    await message.save();
    await message.populate('senderId', 'firstName lastName avatar');

    // Update conversation
    conversation.status = 'active';
    conversation.lastMessage = {
      text,
      senderId: userId,
      timestamp: new Date(),
      isFromUser: true
    };

    // Increment support unread count
    if (supportParticipant) {
      supportParticipant.unreadCount += 1;
    }

    await conversation.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit('message:new', {
        conversationId,
        message
      });

      // Emit to support dashboard
      io.to('support:dashboard').emit('conversation:updated', {
        conversationId,
        conversation
      });

      // Notify support agent if assigned
      if (supportParticipant?.userId) {
        io.to(`user:${supportParticipant.userId}`).emit('message:received', {
          conversationId,
          message,
          conversation: {
            _id: conversation._id,
            lastMessage: conversation.lastMessage,
            unreadCount: supportParticipant.unreadCount
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/support/conversation/:conversationId/read
 * @desc    Mark messages as read
 * @access  Private (User)
 */
router.put('/conversation/:conversationId/read', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const userParticipant = conversation.participants.find(
      p => p.userId && p.userId.toString() === userId.toString()
    );

    if (!userParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Mark support messages as read
    await SupportMessage.updateMany(
      {
        conversationId,
        isFromUser: false,
        status: { $ne: 'read' }
      },
      {
        status: 'read',
        readAt: new Date()
      }
    );

    // Reset unread count
    userParticipant.unreadCount = 0;
    userParticipant.lastReadAt = new Date();
    await conversation.save();

    // Emit read receipt
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationId}`).emit('messages:read', {
        conversationId,
        userId,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
});

// ============================================
// SUPPORT DASHBOARD ROUTES
// ============================================

/**
 * @route   GET /api/support/conversations
 * @desc    Get all conversations (for support dashboard)
 * @access  Private (Support)
 */
router.get('/conversations', auth, async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const conversations = await Conversation.find(query)
      .populate('participants.userId', 'firstName lastName email avatar')
      .populate('assignedTo', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments(query);

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/support/conversations/:conversationId
 * @desc    Get conversation with messages
 * @access  Private (Support)
 */
router.get('/conversations/:conversationId', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants.userId', 'firstName lastName email avatar phoneNumber')
      .populate('assignedTo', 'firstName lastName email');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const messages = await SupportMessage.find({ conversationId })
      .populate('senderId', 'firstName lastName avatar')
      .sort({ createdAt: 1 });

    // Mark user messages as read
    const userParticipant = conversation.participants.find(p => p.role === 'user');
    if (userParticipant) {
      userParticipant.unreadCount = 0;
      await conversation.save();
    }

    await SupportMessage.updateMany(
      { conversationId, isFromUser: true, status: { $ne: 'read' } },
      { status: 'read', readAt: new Date() }
    );

    res.json({
      success: true,
      data: {
        conversation,
        messages
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/support/conversations/:conversationId/assign
 * @desc    Assign conversation to support agent
 * @access  Private (Support Admin)
 */
router.put('/conversations/:conversationId/assign', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { supportId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    conversation.assignedTo = supportId;

    // Update support participant
    const supportParticipant = conversation.participants.find(p => p.role === 'support');
    if (supportParticipant) {
      supportParticipant.userId = supportId;
    }

    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign conversation',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/support/conversations/:conversationId/close
 * @desc    Close conversation
 * @access  Private (Support)
 */
router.put('/conversations/:conversationId/close', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    conversation.status = 'closed';
    conversation.closedAt = new Date();
    await conversation.save();

    // Emit event
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationId}`).emit('conversation:closed', {
        conversationId
      });
    }

    res.json({
      success: true,
      message: 'Conversation closed'
    });
  } catch (error) {
    console.error('Error closing conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close conversation',
      error: error.message
    });
  }
});

module.exports = router;
