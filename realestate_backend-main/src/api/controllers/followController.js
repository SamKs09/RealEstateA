const followService = require('../services/followService');
const logger = require('../utils/logger');

/**
 * Follow a user
 */
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const result = await followService.followUser(followerId, userId);

    res.json({
      success: true,
      message: result.message,
      data: {
        isFollowing: result.isFollowing,
        followerCount: result.followerCount
      }
    });
  } catch (error) {
    logger.error(`Follow user error: ${error.message}`);
    
    if (error.message.includes('Invalid user ID') || 
        error.message.includes('not found') ||
        error.message.includes('cannot follow themselves') ||
        error.message.includes('Already following')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Unfollow a user
 */
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const result = await followService.unfollowUser(followerId, userId);

    res.json({
      success: true,
      message: result.message,
      data: {
        isFollowing: result.isFollowing,
        followerCount: result.followerCount
      }
    });
  } catch (error) {
    logger.error(`Unfollow user error: ${error.message}`);
    
    if (error.message.includes('Invalid user ID') || 
        error.message.includes('Not following')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get follow status between current user and target user
 */
exports.getFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const result = await followService.getFollowStatus(followerId, userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Get follow status error: ${error.message}`);
    
    if (error.message.includes('Invalid user ID')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get followers of a user
 */
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await followService.getFollowers(userId, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Get followers error: ${error.message}`);
    
    if (error.message.includes('Invalid user ID')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get users that a user is following
 */
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await followService.getFollowing(userId, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Get following error: ${error.message}`);
    
    if (error.message.includes('Invalid user ID')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get follow statistics for a user
 */
exports.getFollowStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await followService.getFollowStats(userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Get follow stats error: ${error.message}`);
    
    if (error.message.includes('Invalid user ID')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};