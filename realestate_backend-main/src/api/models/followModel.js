const mongoose = require('mongoose');
const { Schema } = mongoose;

const followSchema = new Schema({
  follower: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound index for efficient queries and to prevent duplicate follows
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Index for getting followers of a user
followSchema.index({ following: 1 });

// Index for getting users that a user is following
followSchema.index({ follower: 1 });

// Pre-save middleware to prevent self-following
followSchema.pre('save', function(next) {
  if (this.follower.equals(this.following)) {
    return next(new Error('Users cannot follow themselves'));
  }
  next();
});

// Static method to get follower count for a user
followSchema.statics.getFollowerCount = async function(userId) {
  return await this.countDocuments({ following: userId });
};

// Static method to get following count for a user
followSchema.statics.getFollowingCount = async function(userId) {
  return await this.countDocuments({ follower: userId });
};

// Static method to check if user A follows user B
followSchema.statics.isFollowing = async function(followerId, followingId) {
  const follow = await this.findOne({ follower: followerId, following: followingId });
  return !!follow;
};

module.exports = mongoose.model('Follow', followSchema);