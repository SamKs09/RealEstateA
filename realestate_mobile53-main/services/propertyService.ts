import api from './api';

// Types matching backend schema
export interface PropertyLocation {
  address: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  landmark?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface PropertyDetails {
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  areaUnit?: 'sqft' | 'sqm';
  parking?: number;
  furnishing?: 'furnished' | 'semi-furnished' | 'unfurnished';
  amenities?: string[];
  age?: number;
  floor?: number;
  totalFloors?: number;
}

export interface PropertyPricing {
  salePrice?: number;
  rentPrice?: number;
  rentPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  deposit?: number;
  maintenanceCharges?: number;
  currency?: string;
  priceNegotiable?: boolean;
}

export interface PropertyAvailability {
  isAvailable: boolean;
  availableFrom?: string;
  availableTo?: string;
}

export interface PropertyMedia {
  images?: string[];
  videos?: string[];
}

export interface Property {
  _id?: string;
  id?: string; // Backend returns 'id' in formatPropertyResponse
  owner?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
  };
  title: string;
  description: string;
  type: 'apartment' | 'house' | 'villa' | 'hotel' | 'commercial' | 'land' | 'office';
  listingType: 'sale' | 'rent';
  propertyDetails?: PropertyDetails;
  location: PropertyLocation;
  pricing?: PropertyPricing;
  media?: PropertyMedia;
  availability?: PropertyAvailability;
  features?: string[];
  rules?: string[];
  status?: 'active' | 'inactive' | 'sold' | 'rented' | 'pending';
  views?: number;
  likes?: number;
  isPromoted?: boolean;
  promotionExpiry?: string;
  boostPlan?: '1day' | '3day' | '7day' | null;
  isLocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePropertyData {
  title: string;
  description: string;
  type: 'apartment' | 'house' | 'villa' | 'hotel' | 'commercial' | 'land' | 'office';
  listingType: 'sale' | 'rent';
  propertyDetails?: PropertyDetails;
  location: PropertyLocation;
  pricing?: PropertyPricing;
  availability?: PropertyAvailability;
  features?: string[];
  rules?: string[];
}

export interface SearchPropertyParams {
  page?: number;
  limit?: number;
  sort?: string;
  type?: string;
  listingType?: string;
  city?: string;
  state?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  status?: string;
  amenities?: string[];
  features?: string[];
  furnishing?: string;
  areaUnit?: string;
  search?: string;
}

// Property CRUD operations
export const createProperty = async (propertyData: CreatePropertyData): Promise<Property> => {
  const response = await api.post<Property>('/properties', propertyData);
  return response.data as Property;
};

export const updateProperty = async (propertyId: string, propertyData: Partial<CreatePropertyData>): Promise<Property> => {
  const response = await api.put<Property>(`/properties/${propertyId}`, propertyData);
  return response.data as Property;
};

export const deleteProperty = async (propertyId: string): Promise<void> => {
  await api.delete(`/properties/${propertyId}`);
};

export const archiveProperty = async (propertyId: string): Promise<void> => {
  await api.patch(`/properties/${propertyId}`, { status: 'archived' });
};

export const getProperty = async (propertyId: string): Promise<Property> => {
  const response = await api.get<Property>(`/properties/${propertyId}`);
  return response.data as Property;
};

export const getMyListings = async (): Promise<Property[]> => {
  const response = await api.get<{ listings: Property[] }>('/user/listings/properties');
  // Backend returns { success, listings, pagination } directly (not nested in data field)
  return (response as any).listings || [];
};

export const getPublicUserProperties = async (userId: string): Promise<Property[]> => {
  const response = await api.get<{ properties: Property[] }>(`/properties/user/${userId}`);
  return response.data?.properties || [];
};

export const searchProperties = async (params: SearchPropertyParams): Promise<{
  properties: Property[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProperties: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}> => {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const endpoint = queryString ? `/properties/search?${queryString}` : '/properties/search';
  const response = await api.get<{
    properties: Property[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalProperties: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>(endpoint);
  return response.data as any;
};

// Media operations
export const uploadPropertyMedia = async (
  propertyId: string,
  mediaData: FormData
): Promise<{
  property: Property;
  uploadedMedia: PropertyMedia;
}> => {
  const response = await api.post<{
    property: Property;
    uploadedMedia: PropertyMedia;
  }>(`/properties/${propertyId}/media`, mediaData);
  // Backend returns { success, message, data: { property, uploadedMedia } }
  return (response as any).data;
};

export const deletePropertyMedia = async (
  propertyId: string,
  mediaId: string
): Promise<void> => {
  await api.delete(`/properties/${propertyId}/media/${mediaId}?mediaType=images`);
};

export const bulkDeleteMedia = async (
  propertyId: string,
  mediaItems: { type: string; url: string }[]
): Promise<void> => {
  await api.delete(`/properties/${propertyId}/media-bulk`);
};

export const getMediaInfo = async (propertyId: string): Promise<{
  images: { count: number; urls: string[] };
  total: { count: number; maxAllowed: number; remaining: number };
}> => {
  const response = await api.get<{
    images: { count: number; urls: string[] };
    total: { count: number; maxAllowed: number; remaining: number };
  }>(`/properties/${propertyId}/media-info`);
  return response.data as any;
};

export const replaceMedia = async (
  propertyId: string,
  mediaId: string,
  newMediaFile: FormData
): Promise<Property> => {
  const response = await api.put<{ property: Property }>(
    `/properties/${propertyId}/media/${mediaId}?mediaType=images`,
    newMediaFile
  );
  return (response.data as any).property;
};

// Property interactions
export const likeProperty = async (propertyId: string): Promise<number> => {
  const response = await api.post<{ likes: number }>(`/properties/${propertyId}/like`);
  return (response.data as any).likes;
};

export const unlikeProperty = async (propertyId: string): Promise<number> => {
  const response = await api.delete<{ likes: number }>(`/properties/${propertyId}/like`);
  return (response.data as any).likes;
};

// Availability management
export const updateAvailability = async (
  propertyId: string,
  availability: PropertyAvailability
): Promise<PropertyAvailability> => {
  const response = await api.put<{ availability: PropertyAvailability }>(
    `/properties/${propertyId}/availability`,
    availability
  );
  return (response.data as any).availability;
};

// Helper function to create FormData with property data and media
export const createPropertyFormData = (
  propertyData: CreatePropertyData,
  mediaFiles?: {
    images?: { uri: string; type: string; name: string }[];
    videos?: { uri: string; type: string; name: string }[];
  }
): FormData => {
  const formData = new FormData();

  // Add property data as JSON strings
  formData.append('title', propertyData.title);
  formData.append('description', propertyData.description);
  formData.append('type', propertyData.type);
  formData.append('listingType', propertyData.listingType);

  if (propertyData.propertyDetails) {
    formData.append('propertyDetails', JSON.stringify(propertyData.propertyDetails));
  }

  if (propertyData.location) {
    formData.append('location', JSON.stringify(propertyData.location));
  }

  if (propertyData.pricing) {
    formData.append('pricing', JSON.stringify(propertyData.pricing));
  }

  if (propertyData.availability) {
    formData.append('availability', JSON.stringify(propertyData.availability));
  }

  if (propertyData.features && propertyData.features.length > 0) {
    formData.append('features', JSON.stringify(propertyData.features));
  }

  if (propertyData.rules && propertyData.rules.length > 0) {
    formData.append('rules', JSON.stringify(propertyData.rules));
  }

  // Add image files
  if (mediaFiles?.images) {
    mediaFiles.images.forEach((image) => {
      formData.append('images', {
        uri: image.uri,
        type: image.type,
        name: image.name,
      } as any);
    });
  }

  // Add video files
  if (mediaFiles?.videos) {
    mediaFiles.videos.forEach((video) => {
      formData.append('videos', {
        uri: video.uri,
        type: video.type,
        name: video.name,
      } as any);
    });
  }

  return formData;
};

// Create property with media in one request
export const createPropertyWithMedia = async (
  propertyData: CreatePropertyData,
  mediaFiles?: {
    images?: { uri: string; type: string; name: string }[];
    videos?: { uri: string; type: string; name: string }[];
  }
): Promise<Property> => {
  const formData = createPropertyFormData(propertyData, mediaFiles);

  const response = await api.post<Property>('/properties', formData);

  return response.data as Property;
};

export const boostProperty = async (
  propertyId: string,
  boostPlan: '1day' | '3day' | '7day'
): Promise<{ property: Property; boost: { plan: string; label: string; expiryDate: string; cost: number }; user?: any }> => {
  const response = await api.post<any>(`/properties/${propertyId}/boost`, { boostPlan });
  return response.data;
};

export const initiatePropertyBoostPayment = async (
  propertyId: string,
  boostPlan: '1day' | '3day' | '7day'
): Promise<{
  transactionId: string;
  kind: 'property_boost';
  status: string;
  amount: number;
  currency: string;
  boostPlan: string;
  checkoutUrl?: string | null;
}> => {
  const response = await api.post<any>(`/payments/properties/${propertyId}/initiate-boost`, { boostPlan });
  return response.data as any;
};

export default {
  createProperty,
  updateProperty,
  deleteProperty,
  getProperty,
  getMyListings,
  searchProperties,
  uploadPropertyMedia,
  deletePropertyMedia,
  bulkDeleteMedia,
  getMediaInfo,
  replaceMedia,
  likeProperty,
  unlikeProperty,
  updateAvailability,
  createPropertyFormData,
  createPropertyWithMedia,
  boostProperty,
  initiatePropertyBoostPayment,
};
