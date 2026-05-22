import api from "./api";

// TypeScript Interfaces
export interface BookingData {
  _id: string;
  guest: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profileImage?: string;
  };
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profileImage?: string;
  };
  listingType: 'property' | 'vehicle';
  property?: any;
  vehicle?: any;
  startDate: string;
  endDate: string;
  numberOfGuests: number;
  basePrice: number;
  proposedPrice: number;
  finalPrice?: number;
  currency: string;
  guestMessage?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'modification_requested';
  referenceNumber?: string;
  chatThreadId?: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  durationDays?: number;
}

export interface CreateBookingRequest {
  listingId: string;
  listingType: 'property' | 'vehicle';
  startDate: string;
  endDate: string;
  numberOfGuests: number;
  proposedPrice: number;
  guestMessage?: string;
  specialRequests?: string;
}

export interface CancelBookingRequest {
  reason: 'change_of_plans' | 'found_alternative' | 'price_concerns' | 'property_issues' | 'emergency' | 'other';
  comments?: string;
}

export interface AvailabilityData {
  _id: string;
  listingType: 'property' | 'vehicle';
  listingId: string;
  owner: string;
  availableRanges: Array<{
    startDate: string;
    endDate: string;
    notes?: string;
  }>;
  blockedRanges: Array<{
    startDate: string;
    endDate: string;
    reason?: string;
  }>;
  bookedRanges: Array<{
    startDate: string;
    endDate: string;
    bookingId: string;
  }>;
  defaultAvailable: boolean;
  minRentalDays?: number;
  maxRentalDays?: number;
}

export interface OfferData {
  pending: BookingData[];
  accepted: BookingData[];
  declined: BookingData[];
  cancelled: BookingData[];
  all: BookingData[];
}

export interface ReceiptData {
  referenceNumber: string;
  bookingId: string;
  status: string;
  startDate: string;
  endDate: string;
  duration: string;
  listingType: string;
  listingTitle: string;
  listingLocation: {
    address: string;
    city: string;
    country: string;
  };
  guest: {
    name: string;
    email: string;
    phoneNumber?: string;
    numberOfGuests: number;
  };
  owner: {
    name: string;
    email: string;
    phoneNumber?: string;
  };
  pricing: {
    basePrice: number;
    proposedPrice: number;
    finalPrice: number;
    currency: string;
    pricePerDay: string;
  };
  specialRequests?: string;
  cancellationPolicy?: string;
  bookedAt: string;
  acceptedAt: string;
}

/**
 * Booking Service
 * Handles all booking-related API calls
 */

/**
 * Create a new booking offer
 */
export const createBooking = async (bookingData: CreateBookingRequest): Promise<{ booking: BookingData; chatThreadId: string }> => {
  try {
    const response = await api.post("/bookings/create", bookingData);
    
    if (response.success) {
      return response.data as { booking: BookingData; chatThreadId: string };
    }
    
    throw new Error(response.message || "Failed to create booking");
  } catch (error: any) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (bookingId: string): Promise<BookingData> => {
  try {
    const response = await api.get(`/bookings/${bookingId}`);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to fetch booking");
  } catch (error: any) {
    console.error("Error fetching booking:", error);
    throw error;
  }
};

/**
 * Get guest's bookings
 */
export const getGuestBookings = async (guestId: string, status?: string): Promise<BookingData[]> => {
  try {
    const url = status 
      ? `/bookings/guest/${guestId}?status=${status}`
      : `/bookings/guest/${guestId}`;
    
    const response = await api.get(url);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to fetch bookings");
  } catch (error: any) {
    console.error("Error fetching guest bookings:", error);
    throw error;
  }
};

/**
 * Get owner's bookings
 */
export const getOwnerBookings = async (ownerId: string, status?: string): Promise<BookingData[]> => {
  try {
    const url = status 
      ? `/bookings/owner/${ownerId}?status=${status}`
      : `/bookings/owner/${ownerId}`;
    
    const response = await api.get(url);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to fetch bookings");
  } catch (error: any) {
    console.error("Error fetching owner bookings:", error);
    throw error;
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId: string, cancelData: CancelBookingRequest): Promise<BookingData> => {
  try {
    const response = await api.patch(`/bookings/${bookingId}/cancel`, cancelData);
    
    if (response.success) {
      return response.data.booking;
    }
    
    throw new Error(response.message || "Failed to cancel booking");
  } catch (error: any) {
    console.error("Error cancelling booking:", error);
    throw error;
  }
};

/**
 * Request booking modification
 */
export const requestModification = async (
  bookingId: string, 
  newStartDate?: string, 
  newEndDate?: string, 
  reason?: string
): Promise<BookingData> => {
  try {
    const response = await api.patch(`/bookings/${bookingId}/modify`, {
      newStartDate,
      newEndDate,
      reason
    });
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to request modification");
  } catch (error: any) {
    console.error("Error requesting modification:", error);
    throw error;
  }
};

/**
 * Get availability for a listing
 */
export const getAvailability = async (listingId: string, listingType: 'property' | 'vehicle'): Promise<AvailabilityData> => {
  try {
    const response = await api.get(`/availability/listing/${listingId}?listingType=${listingType}`);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to fetch availability");
  } catch (error: any) {
    console.error("Error fetching availability:", error);
    throw error;
  }
};

/**
 * Check if date range is available
 */
export const checkDateAvailability = async (
  listingId: string,
  listingType: 'property' | 'vehicle',
  startDate: string,
  endDate: string
): Promise<{ available: boolean; reason?: string }> => {
  try {
    const response = await api.post(`/availability/listing/${listingId}/check`, {
      startDate,
      endDate,
      listingType
    });
    
    if (response.success) {
      return {
        available: response.available,
        reason: response.reason
      };
    }
    
    throw new Error(response.message || "Failed to check availability");
  } catch (error: any) {
    console.error("Error checking availability:", error);
    throw error;
  }
};

/**
 * Get all offers for owner
 */
export const getOwnerOffers = async (ownerId: string, status?: string, listingType?: string): Promise<OfferData> => {
  try {
    let url = `/offers/owner/${ownerId}`;
    const params = [];
    if (status) params.push(`status=${status}`);
    if (listingType) params.push(`listingType=${listingType}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    const response = await api.get(url);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to fetch offers");
  } catch (error: any) {
    console.error("Error fetching owner offers:", error);
    throw error;
  }
};

/**
 * Accept an offer
 */
export const acceptOffer = async (offerId: string): Promise<BookingData> => {
  try {
    const response = await api.patch(`/offers/${offerId}/accept`);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to accept offer");
  } catch (error: any) {
    console.error("Error accepting offer:", error);
    throw error;
  }
};

/**
 * Decline an offer
 */
export const declineOffer = async (offerId: string, reason?: string): Promise<BookingData> => {
  try {
    const response = await api.patch(`/offers/${offerId}/decline`, { reason });
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to decline offer");
  } catch (error: any) {
    console.error("Error declining offer:", error);
    throw error;
  }
};

/**
 * Get offer details
 */
export const getOfferDetails = async (offerId: string): Promise<BookingData> => {
  try {
    const response = await api.get(`/offers/${offerId}`);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to fetch offer details");
  } catch (error: any) {
    console.error("Error fetching offer details:", error);
    throw error;
  }
};

/**
 * Get receipt data
 */
export const getReceipt = async (offerId: string): Promise<ReceiptData> => {
  try {
    const response = await api.get(`/offers/${offerId}/receipt`);
    
    if (response.success) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to fetch receipt");
  } catch (error: any) {
    console.error("Error fetching receipt:", error);
    throw error;
  }
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate duration between two dates
 */
export const calculateDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Accept a booking (owner only)
 */
export const acceptBooking = async (bookingId: string, finalPrice?: number): Promise<BookingData> => {
  try {
    const body = finalPrice !== undefined ? { finalPrice } : {};
    const response = await api.patch(`/bookings/${bookingId}/accept`, body);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to accept booking');
  } catch (error: any) {
    console.error('Error accepting booking:', error);
    throw error;
  }
};

/**
 * Decline a booking (owner only)
 */
export const declineBooking = async (bookingId: string, reason?: string): Promise<BookingData> => {
  try {
    const body = reason ? { reason } : {};
    const response = await api.patch(`/bookings/${bookingId}/decline`, body);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to decline booking');
  } catch (error: any) {
    console.error('Error declining booking:', error);
    throw error;
  }
};

/**
 * Save (create/replace) availability settings for a listing (owner only)
 * POST /api/availability/listing/:listingId
 */
export const setListingAvailability = async (
  listingId: string,
  data: {
    listingType: 'property' | 'vehicle';
    defaultAvailable?: boolean;
    availableRanges?: Array<{ startDate: string; endDate: string; notes?: string }>;
    blockedRanges?: Array<{ startDate: string; endDate: string; reason?: string }>;
    minRentalDays?: number;
    maxRentalDays?: number;
  }
): Promise<AvailabilityData> => {
  try {
    const response = await api.post(`/availability/listing/${listingId}`, data);
    if (response.success) return response.data;
    throw new Error(response.message || 'Failed to save availability');
  } catch (error: any) {
    console.error('Error saving availability:', error);
    throw error;
  }
};
