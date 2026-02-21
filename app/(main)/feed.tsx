import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  getFeed,
  toggleLike,
  addPost,
  getProfile,
  type FeedPost,
  timeAgo,
  formatDistance,
  formatPace,
} from "@/lib/storage";

function PostTypeIcon({ type }: { type: FeedPost["type"] }) {
  const config: Record<string, { icon: string; color: string }> = {
    run: { icon: "run-fast", color: Colors.primary },
    milestone: { icon: "trophy", color: Colors.xp },
    highlight: { icon: "star", color: Colors.accentOrange },
    meme: { icon: "emoticon-happy", color: "#7C6FFF" },
  };
  const { icon, color } = config[type] || config.run;
  return (
    <View style={[styles.typeBadge, { backgroundColor: color + "20" }]}>
      <MaterialCommunityIcons name={icon as any} size={12} color={color} />
      <Text style={[styles.typeText, { color }]}>{type.toUpperCase()}</Text>
    </View>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </LinearGradient>
  );
}

function FeedItem({ post, onLike }: { post: FeedPost; onLike: (id: string) => void }) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Avatar initials={post.userAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.postUserName}>{post.userName}</Text>
          <Text style={styles.postTime}>{timeAgo(post.timestamp)}</Text>
        </View>
        <PostTypeIcon type={post.type} />
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      {post.runData && (
        <View style={styles.runDataCard}>
          <View style={styles.runDataItem}>
            <Text style={styles.runDataValue}>{formatDistance(post.runData.distance)}</Text>
            <Text style={styles.runDataLabel}>km</Text>
          </View>
          <View style={styles.runDataDivider} />
          <View style={styles.runDataItem}>
            <Text style={styles.runDataValue}>{formatPace(post.runData.pace)}</Text>
            <Text style={styles.runDataLabel}>min/km</Text>
          </View>
          <View style={styles.runDataDivider} />
          <View style={styles.runDataItem}>
            <Text style={styles.runDataValue}>{Math.floor(post.runData.duration / 60)}</Text>
            <Text style={styles.runDataLabel}>min</Text>
          </View>
        </View>
      )}
      <View style={styles.postActions}>
        <Pressable
          onPress={() => onLike(post.id)}
          style={styles.actionBtn}
          hitSlop={8}
        >
          <Ionicons
            name={post.liked ? "heart" : "heart-outline"}
            size={22}
            color={post.liked ? Colors.accent : Colors.textSecondary}
          />
          <Text style={[styles.actionText, post.liked && { color: Colors.accent }]}>
            {post.likes}
          </Text>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostText, setNewPostText] = useState("");

  const loadData = useCallback(async () => {
    const feed = await getFeed();
    setPosts(feed);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  async function handleLike(postId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleLike(postId);
    await loadData();
  }

  async function handleCreatePost() {
    if (!newPostText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const profile = await getProfile();
    await addPost({
      userId: profile.id,
      userName: profile.name,
      userAvatar: profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
      type: "highlight",
      content: newPostText.trim(),
      likes: 0,
      comments: 0,
      liked: false,
      timestamp: new Date().toISOString(),
    });
    setNewPostText("");
    setShowNewPost(false);
    await loadData();
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.background, Colors.backgroundLight]} style={StyleSheet.absoluteFill} />
      <View style={[styles.screenHeader, { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 8 }]}>
        <Text style={styles.screenTitle}>Feed</Text>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowNewPost(true); }}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </Pressable>
      </View>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <FeedItem post={item} onLike={handleLike} />}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 84 + 34 : 100, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
          </View>
        }
      />

      <Modal visible={showNewPost} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowNewPost(false)}>
                <Feather name="x" size={24} color={Colors.text} />
              </Pressable>
              <Text style={styles.modalTitle}>New Post</Text>
              <Pressable onPress={handleCreatePost}>
                <Text style={[styles.postBtn, !newPostText.trim() && { opacity: 0.4 }]}>Post</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.postInput}
              placeholder="Share your running journey..."
              placeholderTextColor={Colors.textMuted}
              value={newPostText}
              onChangeText={setNewPostText}
              multiline
              autoFocus
              textAlignVertical="top"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  screenHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  postCard: { marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  avatarText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFF" },
  postUserName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  postTime: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  postContent: { fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.text, lineHeight: 22, marginBottom: 12 },
  runDataCard: { flexDirection: "row", backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 12, justifyContent: "space-around" },
  runDataItem: { alignItems: "center" },
  runDataValue: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.primary },
  runDataLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  runDataDivider: { width: 1, backgroundColor: Colors.border },
  postActions: { flexDirection: "row", gap: 20 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textSecondary },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: 300 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.text },
  postBtn: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.primary },
  postInput: { fontFamily: "Inter_400Regular", fontSize: 16, color: Colors.text, flex: 1, lineHeight: 24 },
});
