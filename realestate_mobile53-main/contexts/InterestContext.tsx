import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type InterestType = "property" | "cars" | "both";
type UserRole = "buyer" | "seller";
// When interest is "both", the user can toggle which view they're browsing
export type ActiveView = "property" | "cars";

interface InterestContextType {
  userInterest: InterestType;
  userRole: UserRole;
  // The currently active view — for "both" users this is toggled on Explore
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  setUserInterest: (interest: InterestType) => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
  setUserPreferences: (interest: InterestType, role: UserRole) => Promise<void>;
  clearPreferences: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
  isLoading: boolean;
  // Helper flags
  isSeller: boolean;
  isBuyer: boolean;
  isPropertyMode: boolean;
  isCarsMode: boolean;
  isBothMode: boolean;
}

const InterestContext = createContext<InterestContextType | undefined>(
  undefined
);

export const InterestProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userInterest, setUserInterestState] =
    useState<InterestType>("property");
  const [userRole, setUserRoleState] = useState<UserRole>("buyer");
  const [activeView, setActiveViewState] = useState<ActiveView>("property");
  const [isLoading, setIsLoading] = useState(true);

  // Load interest and role from AsyncStorage on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [interest, role, view] = await Promise.all([
          AsyncStorage.getItem("userInterest"),
          AsyncStorage.getItem("userRole"),
          AsyncStorage.getItem("activeView"),
        ]);

        if (interest === "cars" || interest === "property" || interest === "both") {
          setUserInterestState(interest);
          // Default activeView based on interest
          if (interest === "cars") {
            setActiveViewState("cars");
          } else {
            setActiveViewState("property");
          }
        }

        // Restore saved activeView for "both" users
        if (view === "property" || view === "cars") {
          setActiveViewState(view);
        }

        if (role === "buyer" || role === "seller") {
          setUserRoleState(role);
        } else if (role === "landlord") {
          setUserRoleState("seller");
          await AsyncStorage.setItem("userRole", "seller");
        } else if (role === "renter") {
          setUserRoleState("buyer");
          await AsyncStorage.setItem("userRole", "buyer");
        }
      } catch (error) {
        console.error("Error loading user preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPreferences();
  }, []);

  // Toggle the active view (for "both" users on Explore)
  const setActiveView = (view: ActiveView) => {
    setActiveViewState(view);
    AsyncStorage.setItem("activeView", view).catch(() => {});
  };

  // Update interest and save to AsyncStorage
  const setUserInterest = async (interest: InterestType) => {
    try {
      await AsyncStorage.setItem("userInterest", interest);
      setUserInterestState(interest);
      // Sync activeView with single-mode interests
      if (interest === "cars") {
        setActiveView("cars");
      } else if (interest === "property") {
        setActiveView("property");
      }
    } catch (error) {
      console.error("Error saving user interest:", error);
    }
  };

  // Update role and save to AsyncStorage
  const setUserRole = async (role: UserRole) => {
    try {
      await AsyncStorage.setItem("userRole", role);
      setUserRoleState(role);
    } catch (error) {
      console.error("Error saving user role:", error);
    }
  };

  // Set both interest and role at once (useful during signup)
  const setUserPreferences = async (interest: InterestType, role: UserRole) => {
    try {
      await Promise.all([
        AsyncStorage.setItem("userInterest", interest),
        AsyncStorage.setItem("userRole", role),
      ]);
      setUserInterestState(interest);
      setUserRoleState(role);
      if (interest === "cars") {
        setActiveView("cars");
      } else {
        setActiveView("property");
      }
    } catch (error) {
      console.error("Error saving user preferences:", error);
    }
  };

  // Clear all preferences (useful during logout)
  const clearPreferences = async () => {
    try {
      console.log("🧹 Clearing user preferences and session data...");
      await AsyncStorage.multiRemove(["userInterest", "userRole", "activeView"]);
      setUserInterestState("property");
      setUserRoleState("buyer");
      setActiveViewState("property");
      console.log("✅ Preferences cleared successfully");
    } catch (error) {
      console.error("Error clearing user preferences:", error);
    }
  };

  // Refresh preferences from AsyncStorage (useful after login)
  const refreshPreferences = async () => {
    try {
      console.log("🔄 Refreshing user preferences from storage...");
      const [interest, role, view] = await Promise.all([
        AsyncStorage.getItem("userInterest"),
        AsyncStorage.getItem("userRole"),
        AsyncStorage.getItem("activeView"),
      ]);

      if (interest === "cars" || interest === "property" || interest === "both") {
        setUserInterestState(interest);
        console.log(`✅ Interest refreshed: ${interest}`);
        if (interest === "cars") setActiveViewState("cars");
        else if (interest === "property") setActiveViewState("property");
      }

      if (view === "property" || view === "cars") {
        setActiveViewState(view);
      }

      if (role === "buyer" || role === "seller") {
        setUserRoleState(role);
        console.log(`✅ Role refreshed: ${role}`);
      }
    } catch (error) {
      console.error("Error refreshing user preferences:", error);
    }
  };

  // Helper computed values
  const isSeller = userRole === "seller";
  const isBuyer = userRole === "buyer";
  const isPropertyMode = activeView === "property";
  const isCarsMode = activeView === "cars";
  const isBothMode = userInterest === "both";

  return (
    <InterestContext.Provider
      value={{
        userInterest,
        userRole,
        activeView,
        setActiveView,
        setUserInterest,
        setUserRole,
        setUserPreferences,
        clearPreferences,
        refreshPreferences,
        isLoading,
        isSeller,
        isBuyer,
        isPropertyMode,
        isCarsMode,
        isBothMode,
      }}
    >
      {children}
    </InterestContext.Provider>
  );
};

export const useInterest = (): InterestContextType => {
  const context = useContext(InterestContext);
  if (context === undefined) {
    throw new Error("useInterest must be used within an InterestProvider");
  }
  return context;
};
