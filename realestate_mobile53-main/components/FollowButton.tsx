import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FollowButtonProps {
  isFollowing: boolean;
  onPress: () => Promise<void>;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
}

export default function FollowButton({
  isFollowing,
  onPress,
  size = "medium",
  style,
}: FollowButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onPress();
    } finally {
      setLoading(false);
    }
  };

  const sizeStyles = {
    small: { paddingHorizontal: 12, paddingVertical: 5, fontSize: 12, iconSize: 13 },
    medium: { paddingHorizontal: 18, paddingVertical: 8, fontSize: 14, iconSize: 15 },
    large: { paddingHorizontal: 24, paddingVertical: 11, fontSize: 16, iconSize: 17 },
  }[size];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isFollowing ? styles.following : styles.follow,
        { paddingHorizontal: sizeStyles.paddingHorizontal, paddingVertical: sizeStyles.paddingVertical },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isFollowing ? "#007AFF" : "#fff"} />
      ) : (
        <>
          <Ionicons
            name={isFollowing ? "person-remove-outline" : "person-add-outline"}
            size={sizeStyles.iconSize}
            color={isFollowing ? "#007AFF" : "#fff"}
            style={styles.icon}
          />
          <Text
            style={[
              styles.label,
              { fontSize: sizeStyles.fontSize },
              isFollowing ? styles.followingText : styles.followText,
            ]}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    gap: 5,
  },
  follow: {
    backgroundColor: "#007AFF",
  },
  following: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#007AFF",
  },
  icon: {},
  label: {
    fontWeight: "600",
  },
  followText: {
    color: "#fff",
  },
  followingText: {
    color: "#007AFF",
  },
});
