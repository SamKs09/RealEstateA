// Export all services
export { default as apiService } from './api';
export { default as authService } from './authService';
export { default as userService } from './userService';
export { default as propertyService } from './propertyService';
export * as vehicleService from './vehicleService';
export { default as sellerService } from './sellerService';

// Export types
export type { ApiResponse, ApiError } from './api';
export type {
  LoginRequest,
  RegisterEmailRequest,
  RegisterPhoneRequest,
  VerifyOTPRequest,
  ForgotPasswordEmailRequest,
  ForgotPasswordPhoneRequest,
  ResetPasswordEmailRequest,
  ResetPasswordPhoneRequest,
  User,
  AuthResponse,
} from './authService';

export type {
  UserProfile,
  UpdateUserProfileRequest,
  ChangePasswordRequest,
  UpdateEmailRequest,
  UpdatePhoneRequest,
} from './userService';

export type {
  Property,
  CreatePropertyData,
  PropertyLocation,
  PropertyDetails,
  PropertyPricing,
  PropertyAvailability,
  PropertyMedia,
  SearchPropertyParams,
} from './propertyService';

export type {
  Vehicle,
  CreateVehicleData,
  VehicleDetails,
  VehicleLocation,
  VehiclePricing,
} from './vehicleService';

export type {
  SellerProfile,
  SellerListing,
  SellerListingsResponse,
  Review,
  ReviewsResponse,
  RatingResponse,
  ReviewableItem,
  FollowStatusResponse,
  FollowStatsResponse,
  CreateReviewRequest,
} from './sellerService';