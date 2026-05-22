const Follow = require('../models/followModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const { sendNotification } = require('../utils/notificationHelper');
const { getTemplate } = require('../utils/notificationTemplates');

class FollowService {
  /**
   * Follow a user
   * @param {string} followerId - ID of the user who wants to follow
   * @param {string} followingId - ID of the user to be followed
   * @returns {Object} Follow operation result
   */
  async followUser(followerId, followingId) {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(followerId) || !mongoose.Types.ObjectId.isValid(followingId)) {
        throw new Error('Invalid user ID');
      }

      // Check if users exist
      const [follower, following] = await Promise.all([
        User.findById(followerId).select('_id'),
        User.findById(followingId).select('_id')
      ]);

      if (!follower) {
        throw new Error('Follower user not found');
      }

      if (!following) {
        throw new Error('User to follow not found');
      }

      // Prevent self-following
      if (followerId === followingId) {
        throw new Error('Users cannot follow themselves');
      }

      // Check if already following
      const existingFollow = await Follow.findOne({
        follower: followerId,
        following: followingId
      });

      if (existingFollow) {
        throw new Error('Already following this user');
      }

      // Create follow relationship
      const follow = new Follow({
        follower: followerId,
        following: followingId
      });

      await follow.save();

      // Get updated follower count
      const followerCount = await Follow.getFollowerCount(followingId);

      // Notify the followed user
      try {
        const followerUser = await User.findById(followerId).select('firstName lastName fullName').lean();
        const followerName = followerUser?.fullName || `${followerUser?.firstName || ''} ${followerUser?.lastName || ''}`.trim() || 'Someone';
        const tpl = getTemplate('new_follower', followerName);
        await sendNotification(followingId, 'new_follower', tpl.title, tpl.body, { followerId: followerId.toString(), deepLink: `/seller-profile/${followerId}` });
      } catch (notifErr) {
        // Notification failure must not break the follow action
      }

      return {
        success: true,
        message: 'Successfully followed user',
        followerCount: followerCount,
        isFollowing: true
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Already following this user');
      }
      throw new Error(`Failed to follow user: ${error.message}`);
    }
  }

  /**
   * Unfollow a user
   * @param {string} followerId - ID of the user who wants to unfollow
   * @param {string} followingId - ID of the user to be unfollowed
   * @returns {Object} Unfollow operation result
   */
  async unfollowUser(followerId, followingId) {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(followerId) || !mongoose.Types.ObjectId.isValid(followingId)) {
        throw new Error('Invalid user ID');
      }

      // Find and remove follow relationship
      const follow = await Follow.findOneAndDelete({
        follower: followerId,
        following: followingId
      });

      if (!follow) {
        throw new Error('Not following this user');
      }

      // Get updated follower count
      const followerCount = await Follow.getFollowerCount(followingId);

      return {
        success: true,
        message: 'Successfully unfollowed user',
        followerCount: followerCount,
        isFollowing: false
      };
    } catch (error) {
      throw new Error(`Failed to unfollow user: ${error.message}`);
    }
  }

  /**
   * Check if user A follows user B
   * @param {string} followerId - ID of the potential follower
   * @param {string} followingId - ID of the potential following
   * @returns {Object} Follow status
   */
  async getFollowStatus(followerId, followingId) {
    try {
      // Validate IDs
      if (!mongoose.Types.ObjectId.isValid(followerId) || !mongoose.Types.ObjectId.isValid(followingId)) {
        throw new Error('Invalid user ID');
      }

      const isFollowing = await Follow.isFollowing(followerId, followingId);
      const followerCount = await Follow.getFollowerCount(followingId);

      return {
        isFollowing: isFollowing,
        followerCount: followerCount
      };
    } catch (error) {
      throw new Error(`Failed to get follow status: ${error.message}`);
    }
  }

  /**
   * Get followers of a user
   * @param {string} userId - ID of the user
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of items per page
   * @returns {Object} Followers list with pagination
   */
  async getFollowers(userId, page = 1, limit = 20) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      const skip = (page - 1) * limit;

      const followers = await Follow.find({ following: userId })
        .populate('follower', 'firstName lastName fullName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalFollowers = await Follow.countDocuments({ following: userId });

      return {
        followers: followers.map(f => f.follower),
        totalFollowers,
        totalPages: Math.ceil(totalFollowers / limit),
        currentPage: page,
        hasNext: skip + followers.length < totalFollowers,
        hasPrev: page > 1
      };
    } catch (error) {
      throw new Error(`Failed to get followers: ${error.message}`);
    }
  }

  /**
   * Get users that a user is following
   * @param {string} userId - ID of the user
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of items per page
   * @returns {Object} Following list with pagination
   */
  async getFollowing(userId, page = 1, limit = 20) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      const skip = (page - 1) * limit;

      const following = await Follow.find({ follower: userId })
        .populate('following', 'firstName lastName fullName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalFollowing = await Follow.countDocuments({ follower: userId });

      return {
        following: following.map(f => f.following),
        totalFollowing,
        totalPages: Math.ceil(totalFollowing / limit),
        currentPage: page,
        hasNext: skip + following.length < totalFollowing,
        hasPrev: page > 1
      };
    } catch (error) {
      throw new Error(`Failed to get following: ${error.message}`);
    }
  }

  /**
   * Get follow statistics for a user
   * @param {string} userId - ID of the user
   * @returns {Object} Follow statistics
   */
  async getFollowStats(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      const [followerCount, followingCount] = await Promise.all([
        Follow.getFollowerCount(userId),
        Follow.getFollowingCount(userId)
      ]);

      return {
        followers: followerCount,
        following: followingCount
      };
    } catch (error) {
      throw new Error(`Failed to get follow stats: ${error.message}`);
    }
  }
}

module.exports = new FollowService();