import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authService, User } from "../services/authService";
import { userService } from "../services/userService";
import { API_CONFIG } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

function isAndroidExpoGoRuntime() {
  return (
    Platform.OS === "android" &&
    (Constants.appOwnership === "expo" ||
      Constants.executionEnvironment === "storeClient")
  );
}

/**
 * Run post-login side effects: register the Expo push token with the backend
 * and establish the socket connection so real-time notifications work immediately.
 * Errors are swallowed – they must never block the login flow.
 */
async function runPostLoginSetup(): Promise<void> {
  if (!isAndroidExpoGoRuntime()) {
    try {
      const { notificationService } = await import("../services/notificationService");
      await notificationService.syncPushToken();
      // Retroactively create DB notifications for any pending bookings the seller
      // owns that were created before the notification pipeline was fixed.
      await notificationService.syncBookingNotifications();
      // Refresh badge + trigger re-fetch on all mounted screens.
      await notificationService.refresh();
    } catch (e) {
      console.warn("⚠️ Post-login notification setup failed:", e);
    }
  }

  try {
    const { chatService } = await import("../services/chatService");
    await chatService.initialize();
  } catch (e) {
    console.warn("⚠️ Post-login socket setup failed:", e);
  }
}

// Auth State Types
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth Actions
type AuthAction =
  | { type: "AUTH_LOADING" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "CLEAR_ERROR" };

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_LOADING":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: sanitizeUserProfile(action.payload),
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_ERROR":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Auth Context
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginPhone: (phoneNumber: string, password: string) => Promise<void>;
  registerEmail: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
    userType?: "buyer" | "seller";
  }) => Promise<void>;
  registerPhone: (data: {
    phoneNumber: string;
    email: string; // Required for verification when SMS is not available
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
    userType?: "buyer" | "seller";
    interest?: "property" | "cars";
  }) => Promise<{
    needsVerification: boolean;
    verificationType: "email" | "sms";
  }>;
  verifyOTP: (phoneNumber: string, otp: string) => Promise<void>;
  resendOTP: (phoneNumber: string) => Promise<void>;
  forgotPasswordEmail: (email: string) => Promise<void>;
  forgotPasswordPhone: (phoneNumber: string) => Promise<void>;
  resetPasswordEmail: (
    token: string,
    password: string,
    confirmPassword: string,
  ) => Promise<void>;
  resetPasswordPhone: (
    phoneNumber: string,
    otp: string,
    password: string,
    confirmPassword: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: any) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeImageUrl = (value?: string | null): string | undefined => {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("file://") ||
    trimmed.startsWith("content://")
  ) {
    return trimmed;
  }
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/api\/?$/, "");
  if (trimmed.startsWith("/")) {
    return `${baseUrl}${trimmed}`;
  }
  return `${baseUrl}/${trimmed}`;
};

const sanitizeUserProfile = (user: any) => {
  if (!user) return user;
  const sanitized = { ...user } as any;

  if (sanitized.avatar === "") delete sanitized.avatar;
  if (sanitized.profileImage === "") delete sanitized.profileImage;

  if (!sanitized.avatar && sanitized.profileImage) {
    sanitized.avatar = sanitized.profileImage;
  }

  const normalizedAvatar = normalizeImageUrl(sanitized.avatar);
  if (normalizedAvatar) {
    sanitized.avatar = normalizedAvatar;
    sanitized.profileImage = normalizedAvatar;
  }

  return sanitized;
};

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: "AUTH_LOADING" });
        const user = await authService.initializeAuth();

        if (user) {
          dispatch({ type: "AUTH_SUCCESS", payload: user });
          runPostLoginSetup();
        } else {
          dispatch({ type: "AUTH_LOGOUT" });
        }
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        dispatch({
          type: "AUTH_ERROR",
          payload: error.message || "Failed to initialize authentication",
        });
      }
    };

    initializeAuth();
  }, []);

  // Login with email
  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      console.log("🔄 AuthContext: Starting login request...", { email });

      const response = await authService.login({ email, password });
      console.log("📡 AuthContext: Got response from authService:", response);

      if (response.success) {
        // Handle the actual backend response format
        if (response.data) {
          // Standard format: { success: true, data: { user, token } }
          console.log(
            "✅ AuthContext: Login successful (standard format), updating state with user:",
            response.data.user,
          );
          dispatch({ type: "AUTH_SUCCESS", payload: response.data.user });
          runPostLoginSetup();
        } else if (response.access_token) {
          // Your backend format: { success: true, access_token: "...", user: {...} }
          console.log(
            "✅ AuthContext: Login successful (backend format), access_token received",
          );

          // Save user interest and role if available
          const backendResponse = response as any; // Backend returns extra fields
          if (backendResponse.user) {
            const user = backendResponse.user;

            // Save interest to AsyncStorage if available
            if (user.interest) {
              await AsyncStorage.setItem("userInterest", user.interest);
            } else {
              // Default to property if not specified
              await AsyncStorage.setItem("userInterest", "property");
            }

            // Save role to AsyncStorage if available
            const roleValue = Array.isArray(user.role) ? user.role[0] : user.role;
            if (roleValue) {
              await AsyncStorage.setItem("userRole", roleValue === 'client' ? 'buyer' : roleValue);
            }

            dispatch({ type: "AUTH_SUCCESS", payload: user });
            runPostLoginSetup();
          } else {
            // Fallback for old response format
            const tempUser = {
              pack: "freemium",
              listingConfig: { status: true, number: 1 },
              boost: { status: false, number: 0 },
              trial: null,
              _id: "temp-id",
              email: email,
              userType: "buyer" as const,
              isEmailVerified: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            dispatch({ type: "AUTH_SUCCESS", payload: tempUser });
          }
        } else {
          console.error(
            "❌ AuthContext: Login failed - success=true but no data or access_token:",
            response,
          );
          throw new Error("Login response missing required data");
        }
      } else {
        console.error(
          "❌ AuthContext: Login failed - success=false:",
          response,
        );
        throw new Error(response.message || "Login failed");
      }
    } catch (error: any) {
      console.error("❌ AuthContext: Login error:", error);
      dispatch({
        type: "AUTH_ERROR",
        payload: error.message || "Login failed",
      });
      throw error;
    }
  };

  // Login with phone
  const loginPhone = async (
    phoneNumber: string,
    password: string,
  ): Promise<void> => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const response = await authService.loginPhone({ phoneNumber, password });

      if (response.success && response.data) {
        const user = response.data.user;

        // Save interest to AsyncStorage if available
        if (user.interest) {
          await AsyncStorage.setItem("userInterest", user.interest);
        } else {
          await AsyncStorage.setItem("userInterest", "property");
        }

        // Save role to AsyncStorage if available
        const roleValue = Array.isArray(user.role) ? user.role[0] : user.role;
        if (roleValue) {
          await AsyncStorage.setItem("userRole", roleValue === 'client' ? 'buyer' : roleValue);
        }

        dispatch({ type: "AUTH_SUCCESS", payload: user });
        runPostLoginSetup();
      } else {
        throw new Error(response.message || "Phone login failed");
      }
    } catch (error: any) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.message || "Phone login failed",
      });
      throw error;
    }
  };

  // Register with email
  const registerEmail = async (data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
    userType?: "buyer" | "seller";
  }): Promise<void> => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const response = await authService.registerEmail(data);

      if (response.success && response.data) {
        dispatch({ type: "AUTH_SUCCESS", payload: response.data.user });
      } else {
        throw new Error(response.message || "Email registration failed");
      }
    } catch (error: any) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.message || "Email registration failed",
      });
      throw error;
    }
  };

  // Register with phone
  const registerPhone = async (data: {
    phoneNumber: string;
    email: string; // Required for verification when SMS is not available
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
    userType?: "buyer" | "seller";
    interest?: "property" | "cars";
  }): Promise<{
    needsVerification: boolean;
    verificationType: "email" | "sms";
  }> => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const response = await authService.registerPhone(data);

      if (response.success) {
        // Phone registration usually requires verification
        dispatch({ type: "AUTH_LOGOUT" }); // Clear loading state

        // Since SMS is not configured, verification will be via email
        return {
          needsVerification: true,
          verificationType: "email", // Always email when SMS is not available
        };
      } else {
        throw new Error(response.message || "Phone registration failed");
      }
    } catch (error: any) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.message || "Phone registration failed",
      });
      throw error;
    }
  };

  // Verify OTP
  const verifyOTP = async (phoneNumber: string, otp: string): Promise<void> => {
    try {
      dispatch({ type: "AUTH_LOADING" });
      const response = await authService.verifyOTP({ phoneNumber, otp });

      if (response.success && response.data) {
        dispatch({ type: "AUTH_SUCCESS", payload: response.data.user });
      } else {
        throw new Error(response.message || "OTP verification failed");
      }
    } catch (error: any) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.message || "OTP verification failed",
      });
      throw error;
    }
  };

  // Resend OTP
  const resendOTP = async (phoneNumber: string): Promise<void> => {
    try {
      const response = await authService.resendOTP(phoneNumber);

      if (!response.success) {
        throw new Error(response.message || "Failed to resend OTP");
      }
    } catch (error: any) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.message || "Failed to resend OTP",
      });
      throw error;
    }
  };

  // Forgot password via email
  const forgotPasswordEmail = async (email: string): Promise<void> => {
    try {
      const response = await authService.forgotPasswordEmail({ email });

      if (!response.success) {
        throw new Error(
          response.message || "Failed to send password reset email",
        );
      }
    } catch (error: any) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.message || "Failed to send password reset email",
      });
      throw error;
    }
  };

  // Forgot password via phone
  const forgotPasswordPhone = async (phoneNumber: string): Promise<void> => {
    try {
      const response = await authService.forgotPasswordPhone({ phoneNumber });

      if (!response.success) {
        throw new Error(
          response.message || "Failed to send password reset SMS",
        );
      }
    } catch (error: any) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.message || "Failed to send password reset SMS",
      });
      throw error;
    }
  };

  // Reset password via email
  const resetPasswordEmail = async (
    token: string,
    password: string,
    confirmPassword: string,
  ): Promise<void> => {
    try {
      const response = await authService.resetPasswordEmail({
        email: "", // We might need to pass email here if backend requires it, or token might be enough
        otp: token,
        newPassword: password,
        confirmPassword,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to reset password");
      }
    } catch (error: any) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.message || "Failed to reset password",
      });
      throw error;
    }
  };

  // Reset password via phone
  const resetPasswordPhone = async (
    phoneNumber: string,
    otp: string,
    password: string,
    confirmPassword: string,
  ): Promise<void> => {
    try {
      const response = await authService.resetPasswordPhone({
        phoneNumber,
        code: otp,
        newPassword: password,
        confirmPassword,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to reset password");
      }
    } catch (error: any) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.message || "Failed to reset password",
      });
      throw error;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      console.log("🚪 Starting logout process...");

      // Call backend logout endpoint (may fail with invalid token, which is OK)
      await authService.logout();

      // Clear all session data from AsyncStorage
      console.log(
        "🧹 Clearing all session data: userInterest, userRole, auth_token, user_data",
      );
      await AsyncStorage.multiRemove([
        "userInterest",
        "userRole",
        "auth_token",
        "user_data",
      ]);

      // Update auth state
      dispatch({ type: "AUTH_LOGOUT" });

      console.log("✅ Logout successful - all session data cleared");
      console.log(
        "📊 Session cleared: authentication token, user data, role, and personalized preferences",
      );
    } catch {
      // Even if logout API fails, clear local data
      // This is expected if token is expired/invalid
      console.log(
        "⚠️ Backend logout failed (expected if token expired), clearing local data anyway",
      );
      await AsyncStorage.multiRemove([
        "userInterest",
        "userRole",
        "auth_token",
        "user_data",
      ]);
      dispatch({ type: "AUTH_LOGOUT" });
      console.log("✅ Local session data cleared");
    }
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const updateUser = useCallback(async (newUser: any) => {
    try {
      console.log("🔄 AuthContext: Updating user data...", newUser);

      // Merge with existing user data to avoid losing fields like 'credits'
      // that might not be in the profile update response
      const normalizedNewUser = sanitizeUserProfile(newUser);
      const updatedUser = state.user
        ? sanitizeUserProfile({ ...state.user, ...normalizedNewUser })
        : normalizedNewUser;

      // 1. Update In-Memory State
      dispatch({ type: "AUTH_SUCCESS", payload: updatedUser });

      // 2. Persist to AsyncStorage
      await AsyncStorage.setItem("user_data", JSON.stringify(updatedUser));
      console.log("✅ AuthContext: User data merged and persisted to storage");
    } catch (error) {
      console.error("❌ AuthContext: Error persisting user data:", error);
    }
  }, [state.user]);

  const refreshProfile = useCallback(async () => {
    try {
      console.log("🔄 AuthContext: Refreshing user profile from backend...");
      const response = await userService.getUserProfile();
      if (response.success && response.data) {
        await updateUser(response.data);
      }
    } catch (error) {
      console.error("❌ AuthContext: Error refreshing profile:", error);
    }
  }, [updateUser]);

  const value: AuthContextType = {
    ...state,
    login,
    loginPhone,
    registerEmail,
    registerPhone,
    verifyOTP,
    resendOTP,
    forgotPasswordEmail,
    forgotPasswordPhone,
    resetPasswordEmail,
    resetPasswordPhone,
    logout,
    clearError,
    updateUser,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
