import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import { useInterest } from "../../contexts/InterestContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshProfile } = useAuth();
  const { activeView, isBothMode, userInterest } = useInterest();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Refresh profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  // Load user role from AsyncStorage
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const role = await AsyncStorage.getItem("userRole");
        setUserRole(role);
      } catch (error) {
        console.error("Error loading user role:", error);
      }
    };
    loadUserRole();
  }, []);

  // Determine if user is a seller
  const isSeller = userRole === "seller" || user?.userType === "seller";

  const handleMenuPress = (item: string) => {
    // Handle menu item navigation
    console.log(`Pressed: ${item}`);
  };

  const handleViewFullProfile = () => {
    // Navigate to the main profile page - it will automatically show seller or buyer view
    router.push("/profile/profile");
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Logout successful");
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate to homepage even if logout API fails
      router.replace("/");
    }
  };

  // If seller, show seller-specific profile options
  if (isSeller) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.profileSection}
            onPress={handleViewFullProfile}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              {user?.avatar || (user as any)?.profileImage ? (
                <Image
                  key={user?.avatar || (user as any)?.profileImage}
                  source={{ uri: user?.avatar || (user as any)?.profileImage }}
                  style={styles.avatar}
                  contentFit="cover"
                  cachePolicy="none"
                />
              ) : (
                <Image
                  source={require("../../assets/sam b.png")}
                  style={styles.avatar}
                />
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split("@")[0] || "User"}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email || "No email available"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleViewFullProfile}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="person-outline" size={24} color="#666" />
              <Text style={styles.menuText}>View Full Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/my-listings")}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="home-outline" size={24} color="#666" />
              <Text style={styles.menuText}>My Listings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              const targetInterest = isBothMode ? activeView : userInterest;
              router.push(targetInterest === "cars" ? "/add-car" : "/add-house");
            }}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="add-circle-outline" size={24} color="#666" />
              <Text style={styles.menuText}>Add New Property</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress("Settings")}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="settings-outline" size={24} color="#666" />
              <Text style={styles.menuText}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress("Help Center")}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#666" />
              <Text style={styles.menuText}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Default buyer profile
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={handleViewFullProfile}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {user?.avatar || (user as any)?.profileImage ? (
              <Image
                key={user?.avatar || (user as any)?.profileImage}
                source={{ uri: user?.avatar || (user as any)?.profileImage }}
                style={styles.avatar}
                contentFit="cover"
                cachePolicy="none"
              />
            ) : (
              <Image
                source={require("../../assets/sam b.png")}
                style={styles.avatar}
                contentFit="cover"
              />
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email?.split("@")[0] || "User"}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || "No email available"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleViewFullProfile}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="person-outline" size={24} color="#666" />
            <Text style={styles.menuText}>View Full Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuPress("Settings")}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="settings-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuPress("Invite Friends")}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="people-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Invite Friends</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuPress("Help Center")}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.menuText}>Help Center</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0E0E0",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#666666",
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    fontSize: 16,
    color: "#1A1A1A",
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 16,
    color: "#FF4444",
    marginLeft: 12,
  },
});
