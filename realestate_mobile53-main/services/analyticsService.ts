import api from "./api";

export interface AnalyticsData {
  totalViews: number;
  uniqueViews: number;
  saved: number;
  inquiries: number;
  weeklyViews: number[];
  recentInquiries: Array<{
    id: string;
    name: string;
    message: string;
    time: string;
    avatar: string | null;
    status: string;
  }>;
}

export interface SellerAnalyticsSummary {
  totalListings: number;
  totalViews: number;
  totalSaves: number;
  totalInquiries: number;
  listings: Array<{
    listingId: string;
    listingType: string;
    totalViews: number;
    saved: number;
    inquiries: number;
  }>;
}

export type ListingType = "property" | "vehicle";

/**
 * Get analytics for a specific listing
 */
export const getListingAnalytics = async (
  listingId: string,
  listingType: ListingType
): Promise<AnalyticsData> => {
  try {
    const response = await api.get(`/analytics/listing/${listingId}?listingType=${listingType}`);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to fetch analytics");
  } catch (error: any) {
    console.error("Error fetching listing analytics:", error);
    throw error;
  }
};

/**
 * Record a view for a listing
 */
export const recordView = async (
  listingId: string,
  listingType: ListingType
): Promise<void> => {
  try {
    await api.post(`/analytics/listing/${listingId}/view`, {
      listingType,
    });
  } catch (error: any) {
    console.error("Error recording view:", error);
    // Don't throw error - view tracking should be silent
  }
};

/**
 * Record a save/favorite for a listing
 */
export const recordSave = async (
  listingId: string,
  listingType: ListingType
): Promise<void> => {
  try {
    const response = await api.post(`/analytics/listing/${listingId}/save`, {
      listingType,
    });
    
    if (!response.success) {
      throw new Error(response.message || "Failed to record save");
    }
  } catch (error: any) {
    console.error("Error recording save:", error);
    throw error;
  }
};

/**
 * Remove a save/favorite for a listing
 */
export const removeSave = async (
  listingId: string,
  listingType: ListingType
): Promise<void> => {
  try {
    const response = await api.delete(`/analytics/listing/${listingId}/save`, {
      listingType,
    });
    
    if (!response.success) {
      throw new Error(response.message || "Failed to remove save");
    }
  } catch (error: any) {
    console.error("Error removing save:", error);
    throw error;
  }
};

/**
 * Record an inquiry for a listing
 */
export const recordInquiry = async (
  listingId: string,
  listingType: ListingType,
  message: string
): Promise<void> => {
  try {
    const response = await api.post(`/analytics/listing/${listingId}/inquiry`, {
      listingType,
      message,
    });
    
    if (!response.success) {
      throw new Error(response.message || "Failed to record inquiry");
    }
  } catch (error: any) {
    console.error("Error recording inquiry:", error);
    throw error;
  }
};

/**
 * Get seller's analytics summary
 */
export const getSellerAnalyticsSummary = async (): Promise<SellerAnalyticsSummary> => {
  try {
    const response = await api.get("/analytics/seller/summary");
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to fetch seller analytics");
  } catch (error: any) {
    console.error("Error fetching seller analytics:", error);
    throw error;
  }
};

/**
 * Format time ago string
 */
export const formatTimeAgo = (timestamp: string | Date): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "just now";
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
};
