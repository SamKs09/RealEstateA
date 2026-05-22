import { apiService, ApiResponse } from './api';
import type { Property } from './propertyService';
import type { Vehicle } from './vehicleService';

// User Types
export interface UserProfile {
  _id: string;
  pack?: 'freemium' | 'bronze' | 'silver' | 'gold' | 'platinum';
  listingConfig?: {
    status: boolean;
    number: number;
  };
  boost?: {
    status: boolean;
    number: number;
  };
  trial?: {
    isUsed?: boolean;
    startDate?: string;
    endDate?: string;
    status?: 'none' | 'active' | 'expired';
  } | null;
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  userType: 'buyer' | 'seller';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profileImage?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  preferences?: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      showEmail: boolean;
      showPhone: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  preferences?: {
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    privacy?: {
      showEmail?: boolean;
      showPhone?: boolean;
    };
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateEmailRequest {
  newEmail: string;
  password: string;
}

export interface UpdatePhoneRequest {
  newPhoneNumber: string;
  password: string;
}

export type PackType = 'freemium' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface PurchasePackResponse {
  user: UserProfile;
  benefits: {
    listings: number;
    boosts: number;
  };
}

export interface PaymentTransactionSummary {
  transactionId: string;
  kind: 'pack_purchase' | 'property_boost' | 'vehicle_boost';
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';
  amount: number;
  currency: string;
  description?: string;
  pack?: Exclude<PackType, 'freemium'> | null;
  boostPlan?: '1day' | '3day' | '7day' | null;
  checkoutUrl?: string | null;
  flouciPaymentId?: string | null;
  processedAt?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  user?: UserProfile;
  property?: {
    _id?: string;
    title?: string;
    isPromoted?: boolean;
    promotionExpiry?: string;
    boostPlan?: string;
    status?: string;
  };
  vehicle?: {
    _id?: string;
    title?: string;
    isPromoted?: boolean;
    promotionExpiry?: string;
    boostPlan?: string;
    status?: string;
  };
}

export type FavoriteListingType = 'property' | 'vehicle';
export type FavoriteListing = Property | Vehicle;

class UserService {
  // Get current user profile
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await apiService.get<UserProfile>('/user/profile');
      // If the backend returns 'user' instead of 'data', normalize it
      if (response.success && !response.data && (response as any).user) {
        response.data = (response as any).user;
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID (Public profile)
  async getUserById(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await apiService.get<UserProfile>(`/user/profile/${userId}`);
      // If the backend returns 'user' instead of 'data', normalize it
      if (response.success && !response.data && (response as any).user) {
        response.data = (response as any).user;
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  async updateProfile(updates: UpdateUserProfileRequest | FormData): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await apiService.put<UserProfile>('/user/profile', updates);
      // If the backend returns 'user' instead of 'data', normalize it
      if (response.success && !response.data && (response as any).user) {
        response.data = (response as any).user;
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Upload profile image
  async uploadProfileImage(imageFile: FormData): Promise<ApiResponse<{ profileImage: string }>> {
    try {
      return await apiService.post<{ profileImage: string }>('/user/profile/image', imageFile);
    } catch (error) {
      throw error;
    }
  }

  // Delete profile image
  async deleteProfileImage(): Promise<ApiResponse<any>> {
    try {
      return await apiService.delete('/user/profile/image');
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<any>> {
    try {
      return await apiService.put('/user/change-password', passwordData);
    } catch (error) {
      throw error;
    }
  }

  // Update email (requires verification)
  async updateEmail(emailData: UpdateEmailRequest): Promise<ApiResponse<any>> {
    try {
      return await apiService.put('/user/update-email', emailData);
    } catch (error) {
      throw error;
    }
  }

  // Update phone number (requires verification)
  async updatePhoneNumber(phoneData: UpdatePhoneRequest): Promise<ApiResponse<any>> {
    try {
      return await apiService.put('/user/update-phone', phoneData);
    } catch (error) {
      throw error;
    }
  }

  // Verify new email
  async verifyNewEmail(token: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get(`/user/verify-new-email?token=${token}`);
    } catch (error) {
      throw error;
    }
  }

  // Verify new phone number
  async verifyNewPhoneNumber(phoneNumber: string, otp: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post('/user/verify-new-phone', { phoneNumber, otp });
    } catch (error) {
      throw error;
    }
  }

  // Delete user account
  async deleteAccount(password: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.delete('/user/account', {
        'Content-Type': 'application/json',
      });
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics (for sellers)
  async getUserStatistics(): Promise<ApiResponse<{
    totalProperties: number;
    totalViews: number;
    totalInquiries: number;
    soldProperties: number;
    rentedProperties: number;
  }>> {
    try {
      return await apiService.get('/user/statistics');
    } catch (error) {
      throw error;
    }
  }

  // Get user activity log
  async getUserActivity(page?: number, limit?: number): Promise<ApiResponse<{
    activities: {
      _id: string;
      action: string;
      details: string;
      timestamp: string;
    }[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page.toString());
      if (limit) queryParams.append('limit', limit.toString());

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/user/activity?${queryString}` : '/user/activity';

      return await apiService.get(endpoint);
    } catch (error) {
      throw error;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  }): Promise<ApiResponse<UserProfile>> {
    try {
      return await apiService.put('/user/notification-preferences', { notifications: preferences });
    } catch (error) {
      throw error;
    }
  }

  // Update privacy preferences
  async updatePrivacyPreferences(preferences: {
    showEmail?: boolean;
    showPhone?: boolean;
  }): Promise<ApiResponse<UserProfile>> {
    try {
      return await apiService.put('/user/privacy-preferences', { privacy: preferences });
    } catch (error) {
      throw error;
    }
  }

  // Block/Unblock user
  async blockUser(userId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`/user/block/${userId}`);
    } catch (error) {
      throw error;
    }
  }

  async unblockUser(userId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post(`/user/unblock/${userId}`);
    } catch (error) {
      throw error;
    }
  }

  // Report user
  async reportUser(userId: string, reason: string, details?: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.post('/user/report', {
        reportedUserId: userId,
        reason,
        details,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get user's own offers/bookings (Buyer action)
  async getMyOffers(): Promise<ApiResponse<any[]>> {
    try {
      return await apiService.get<any[]>('/seller/my-offers');
    } catch (error) {
      throw error;
    }
  }

  async getFavoriteListingIds(listingType: FavoriteListingType): Promise<string[]> {
    try {
      const endpoint = listingType === 'property'
        ? '/user/favorites/properties?limit=1000'
        : '/user/favorites/vehicles?limit=1000';
      const response = await apiService.get(endpoint);
      const rawResponse = response as any;
      const favorites = rawResponse.favorites || rawResponse.data?.favorites || [];

      return favorites
        .map((favorite: any) => {
          if (typeof favorite === 'string') {
            return favorite;
          }
          return favorite?._id || favorite?.id || null;
        })
        .filter(Boolean);
    } catch (error) {
      throw error;
    }
  }

  async getFavoriteListings(listingType: FavoriteListingType): Promise<FavoriteListing[]> {
    try {
      const endpoint = listingType === 'property'
        ? '/user/favorites/properties?limit=1000'
        : '/user/favorites/vehicles?limit=1000';
      const response = await apiService.get(endpoint);
      const rawResponse = response as any;

      if (!response.success) {
        throw new Error(response.message || 'Failed to load favorites');
      }

      return (rawResponse.favorites || rawResponse.data?.favorites || []) as FavoriteListing[];
    } catch (error) {
      throw error;
    }
  }

  async addFavoriteListing(listingId: string, listingType: FavoriteListingType): Promise<void> {
    try {
      const endpoint = listingType === 'property'
        ? `/user/favorites/properties/${listingId}`
        : `/user/favorites/vehicles/${listingId}`;
      const response = await apiService.post(endpoint);
      if (!response.success) {
        throw new Error(response.message || 'Failed to add favorite');
      }
    } catch (error) {
      throw error;
    }
  }

  async removeFavoriteListing(listingId: string, listingType: FavoriteListingType): Promise<void> {
    try {
      const endpoint = listingType === 'property'
        ? `/user/favorites/properties/${listingId}`
        : `/user/favorites/vehicles/${listingId}`;
      const response = await apiService.delete(endpoint);
      if (!response.success) {
        throw new Error(response.message || 'Failed to remove favorite');
      }
    } catch (error) {
      throw error;
    }
  }

  async purchasePack(pack: PackType): Promise<ApiResponse<PurchasePackResponse>> {
    try {
      const response = await apiService.post<PurchasePackResponse>('/user/purchase-pack', { pack });
      if (response.success && !response.data && (response as any).user) {
        response.data = {
          user: (response as any).user,
          benefits: (response as any).benefits,
        };
      }
      return response;
    } catch (error) {
      throw error;
    }
  }

  async initiatePackPayment(pack: Exclude<PackType, 'freemium'>): Promise<ApiResponse<PaymentTransactionSummary>> {
    try {
      return await apiService.post<PaymentTransactionSummary>('/payments/initiate-pack', { pack });
    } catch (error) {
      throw error;
    }
  }

  async getPaymentTransaction(transactionId: string): Promise<ApiResponse<PaymentTransactionSummary>> {
    try {
      return await apiService.get<PaymentTransactionSummary>(`/payments/transactions/${transactionId}`);
    } catch (error) {
      throw error;
    }
  }

  async getPaymentHistory(): Promise<ApiResponse<PaymentTransactionSummary[]>> {
    try {
      return await apiService.get<PaymentTransactionSummary[]>('/payments/transactions');
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;