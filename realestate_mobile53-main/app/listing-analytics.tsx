import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../hooks/useTranslation";
import { getListingAnalytics, formatTimeAgo, AnalyticsData } from "../services/analyticsService";

const { width } = Dimensions.get("window");

export default function ListingAnalyticsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  
  const listingId = params.id as string;
  const listingTitle = params.title as string || "Property";
  const listingType = (params.type as string || "property") as "property" | "vehicle";
  
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [listingId]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getListingAnalytics(listingId, listingType);
      setAnalytics(data);
    } catch (err: any) {
      console.error("Error fetching analytics:", err);
      setError(err.message || "Failed to load analytics");
      Alert.alert("Error", "Failed to load analytics data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getMaxViewCount = () => {
    if (!analytics || analytics.weeklyViews.length === 0) return 1;
    return Math.max(...analytics.weeklyViews, 1);
  };

  const renderBarChart = () => {
    if (!analytics) return null;
    
    const maxHeight = 120;
    const maxValue = getMaxViewCount();
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
      <View style={styles.chartContainer}>
        <View style={styles.barsContainer}>
          {analytics.weeklyViews.map((value, index) => {
            const barHeight = maxValue > 0 ? (value / maxValue) * maxHeight : 0;
            const isHighest = value === maxValue && value > 0;
            
            return (
              <View key={index} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 4), // Minimum height for visibility
                      backgroundColor: isHighest ? "#FF6B35" : index % 2 === 0 ? "#FF6B35" : "#FFB399",
                    },
                  ]}
                />
                <Text style={styles.dayLabel}>{days[index]}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderInquiryItem = (inquiry: any) => {
    const avatarLetter = inquiry.name.charAt(0).toUpperCase();
    const timeAgo = formatTimeAgo(inquiry.time);
    
    return (
      <TouchableOpacity key={inquiry.id} style={styles.inquiryItem}>
        <View style={[styles.avatar, { backgroundColor: avatarLetter === "A" ? "#FF6B35" : "#FF9800" }]}>
          <Text style={styles.avatarText}>{avatarLetter}</Text>
        </View>
        
        <View style={styles.inquiryContent}>
          <View style={styles.inquiryHeader}>
            <Text style={styles.inquiryName}>{inquiry.name}</Text>
            <Text style={styles.inquiryTime}>{timeAgo}</Text>
          </View>
          <Text style={styles.inquiryMessage} numberOfLines={1}>
            {inquiry.message}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Listing Analytics</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  if (error || !analytics) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Listing Analytics</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B35" />
          <Text style={styles.errorTitle}>Unable to Load Analytics</Text>
          <Text style={styles.errorMessage}>{error || "Please try again later"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAnalytics}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listing Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Property Title */}
        <Text style={styles.propertyTitle}>{listingTitle}</Text>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.totalViews}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.saved}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.inquiries}</Text>
            <Text style={styles.statLabel}>Inquiries</Text>
          </View>
        </View>

        {/* Views Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Views this week</Text>
          {renderBarChart()}
        </View>

        {/* Recent Inquiries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Inquiries</Text>
          <View style={styles.inquiriesList}>
            {analytics.recentInquiries.map((inquiry) => renderInquiryItem(inquiry))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    fontFamily: "raleway-600SemiBold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
    fontFamily: "raleway-400Regular",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    fontFamily: "raleway-600SemiBold",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#8A8A8A",
    fontFamily: "raleway-400Regular",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
  },
  scrollView: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    fontFamily: "raleway-600SemiBold",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF5F0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FF6B35",
    fontFamily: "raleway-700Bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8A8A8A",
    fontFamily: "raleway-400Regular",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    fontFamily: "raleway-600SemiBold",
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 16,
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 140,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: 32,
    borderRadius: 6,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 11,
    color: "#8A8A8A",
    fontFamily: "raleway-400Regular",
    marginTop: 4,
  },
  inquiriesList: {
    gap: 12,
  },
  inquiryItem: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "raleway-600SemiBold",
  },
  inquiryContent: {
    flex: 1,
  },
  inquiryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  inquiryName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    fontFamily: "raleway-600SemiBold",
  },
  inquiryTime: {
    fontSize: 12,
    color: "#8A8A8A",
    fontFamily: "raleway-400Regular",
  },
  inquiryMessage: {
    fontSize: 14,
    color: "#666666",
    fontFamily: "raleway-400Regular",
  },
});
