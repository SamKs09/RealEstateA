import api from './api';

/**
 * Seller Profile Types
 */
export interface SellerProfile {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  coverPhoto: string | null;
  location: string;
  statistics: {
    followers: number;
    rating: number;
    soldRent: number;
    totalReviews: number;
  };
  role: string;
}

export interface SellerListing {
  id: string;
  title: string;
  type: 'property' | 'vehicle';
  listingType: 'sale' | 'rent';
  image: string | null;
  pricing: {
    amount: number;
    currency: string;
  };
  details: {
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    make?: string;
    model?: string;
    year?: number;
  };
  location: any;
}

export interface SellerListingsResponse {
  listings: SellerListing[];
  totalListings: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Review {
  id: string;
  reviewer: {
    id: string;
    name: string;
    avatar: string | null;
  };
  item: {
    id: string;
    title: string;
    type: string;
    image: string | null;
  };
  rating: number;
  comment: string;
  createdAt: string;
  relativeDate: string;
  isVerified: boolean;
  isFlagged: boolean;
  reply: { text: string; createdAt: string } | null;
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    totalReviews: number;
    totalPages: number;
    currentPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface RatingResponse {
  averageRating: number;
  totalReviews: number;
  formattedRating: string;
}

export interface ReviewableItem {
  id: string;
  title: string;
  type: 'property' | 'vehicle';
  image: string | null;
}

export interface FollowStatusResponse {
  isFollowing: boolean;
  followerCount: number;
}

export interface FollowStatsResponse {
  followers: number;
  following: number;
}

export interface CreateReviewRequest {
  sellerId: string;
  itemId: string;
  itemType: 'Property' | 'Vehicle';
  rating: number;
  comment: string;
}

export interface FollowerUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export interface FollowersListResponse {
  followers: FollowerUser[];
  totalFollowers: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Seller Service
 */
class SellerService {
  /**
   * Get seller profile data
   */
  async getSellerProfile(sellerId: string): Promise<SellerProfile> {
    try {
      const response = await api.get(`/seller/${sellerId}/profile`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch seller profile');
    } catch (error: any) {
      console.error('Error fetching seller profile:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch seller profile');
    }
  }

  /**
   * Get seller's active listings
   */
  async getSellerListings(sellerId: string, page: number = 1, limit: number = 20): Promise<SellerListingsResponse> {
    try {
      const response = await api.get(`/seller/${sellerId}/listings`, {
        params: { page, limit }
      });
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch seller listings');
    } catch (error: any) {
      console.error('Error fetching seller listings:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch seller listings');
    }
  }

  /**
   * Get seller's reviews
   */
  async getSellerReviews(sellerId: string, page: number = 1, limit: number = 20): Promise<ReviewsResponse> {
    try {
      const response = await api.get(`/seller/${sellerId}/reviews`, {
        params: { page, limit }
      });
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch seller reviews');
    } catch (error: any) {
      console.error('Error fetching seller reviews:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch seller reviews');
    }
  }

  /**
   * Get seller's rating statistics
   */
  async getSellerRating(sellerId: string): Promise<RatingResponse> {
    try {
      const response = await api.get(`/seller/${sellerId}/rating`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch seller rating');
    } catch (error: any) {
      console.error('Error fetching seller rating:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch seller rating');
    }
  }

  /**
   * Get reviewable items for a seller
   */
  async getReviewableItems(sellerId: string): Promise<ReviewableItem[]> {
    try {
      const response = await api.get(`/seller/${sellerId}/reviewable-items`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch reviewable items');
    } catch (error: any) {
      console.error('Error fetching reviewable items:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch reviewable items');
    }
  }

  /**
   * Follow a user
   */
  async followUser(userId: string): Promise<FollowStatusResponse> {
    try {
      const response = await api.post(`/seller/users/${userId}/follow`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to follow user');
    } catch (error: any) {
      console.error('Error following user:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to follow user');
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string): Promise<FollowStatusResponse> {
    try {
      const response = await api.delete(`/seller/users/${userId}/follow`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to unfollow user');
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to unfollow user');
    }
  }

  /**
   * Get follow status between current user and target user
   */
  async getFollowStatus(userId: string): Promise<FollowStatusResponse> {
    try {
      const response = await api.get(`/seller/users/${userId}/follow-status`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch follow status');
    } catch (error: any) {
      console.error('Error fetching follow status:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch follow status');
    }
  }

  /**
   * Get follow statistics
   */
  async getFollowStats(userId: string): Promise<FollowStatsResponse> {
    try {
      const response = await api.get(`/seller/users/${userId}/follow-stats`);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to fetch follow stats');
    } catch (error: any) {
      console.error('Error fetching follow stats:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch follow stats');
    }
  }

  /**
   * Create a review
   */
  async createReview(reviewData: CreateReviewRequest): Promise<Review> {
    try {
      const response = await api.post('/seller/reviews', reviewData);
      
      if (response.success) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create review');
    } catch (error: any) {
      console.error('Error creating review:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create review');
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<void> {
    try {
      const response = await api.delete(`/seller/reviews/${reviewId}`);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete review');
      }
    } catch (error: any) {
      console.error('Error deleting review:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete review');
    }
  }

  /**
   * Update a review (within 30 days)
   */
  async updateReview(reviewId: string, rating: number, comment: string): Promise<void> {
    try {
      const response = await api.put(`/seller/reviews/${reviewId}`, { rating, comment });
      if (!response.success) {
        throw new Error(response.message || 'Failed to update review');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update review');
    }
  }

  /**
   * Reply to a review (seller only)
   */
  async replyToReview(reviewId: string, replyText: string): Promise<void> {
    try {
      const response = await api.post(`/seller/reviews/${reviewId}/reply`, { replyText });
      if (!response.success) {
        throw new Error(response.message || 'Failed to post reply');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to post reply');
    }
  }

  /**
   * Report a review
   */
  async reportReview(reviewId: string, reason: string): Promise<void> {
    try {
      const response = await api.post(`/seller/reviews/${reviewId}/report`, { reason });
      if (!response.success) {
        throw new Error(response.message || 'Failed to report review');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to report review');
    }
  }

  /**
   * Get paginated list of followers for a user
   */
  async getFollowersList(userId: string, page: number = 1, limit: number = 20): Promise<FollowersListResponse> {
    try {
      const response = await api.get(`/seller/users/${userId}/followers`, { params: { page, limit } });
      if (response.success) return response.data;
      throw new Error(response.message || 'Failed to fetch followers');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch followers');
    }
  }

  /**
   * Get paginated list of users a user is following
   */
  async getFollowingList(userId: string, page: number = 1, limit: number = 20): Promise<FollowersListResponse> {
    try {
      const response = await api.get(`/seller/users/${userId}/following`, { params: { page, limit } });
      if (response.success) return response.data;
      throw new Error(response.message || 'Failed to fetch following');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch following');
    }
  }
}

export default new SellerService();