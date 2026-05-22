import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import sellerService, { FollowerUser } from "../../services/sellerService";

export default function FollowersScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  const router = useRouter();

  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      try {
        const data = await sellerService.getFollowersList(userId, pageNum, 20);
        setUsers((prev) => (replace ? data.followers : [...prev, ...data.followers]));
        setHasNext(data.hasNext);
        setPage(pageNum);
      } catch (_) {}
    },
    [userId]
  );

  useEffect(() => {
    setLoading(true);
    loadPage(1, true).finally(() => setLoading(false));
  }, [loadPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPage(1, true).finally(() => setRefreshing(false));
  }, [loadPage]);

  const onEndReached = useCallback(async () => {
    if (!hasNext || loadingMore) return;
    setLoadingMore(true);
    await loadPage(page + 1, false);
    setLoadingMore(false);
  }, [hasNext, loadingMore, page, loadPage]);

  const renderItem = ({ item }: { item: FollowerUser }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push({ pathname: "/seller-profile/[id]", params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.avatar || "https://via.placeholder.com/50" }}
        style={styles.avatar}
        contentFit="cover"
      />
      <Text style={styles.name}>{item.name || `${item.firstName} ${item.lastName}`.trim()}</Text>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>{name ? `${name}'s Followers` : "Followers"}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} /> : null}
          ListEmptyComponent={
            <Text style={styles.empty}>No followers yet.</Text>
          }
          contentContainerStyle={users.length === 0 && styles.emptyContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  name: { flex: 1, fontSize: 15, fontWeight: "500", color: "#1a1a1a" },
  empty: { textAlign: "center", color: "#999", marginTop: 20, fontSize: 14 },
  emptyContainer: { flexGrow: 1, justifyContent: "center" },
});
