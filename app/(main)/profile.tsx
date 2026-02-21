import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  getProfile,
  saveProfile,
  getRuns,
  getPartners,
  savePartners,
  formatDistance,
  formatDuration,
  type UserProfile,
  type Partner,
  type RunRecord,
} from "@/lib/storage";

type ProfileTab = "stats" | "partners" | "badges";

function PartnerCard({ partner, onConnect }: { partner: Partner; onConnect: () => void }) {
  return (
    <View style={styles.partnerCard}>
      <View style={styles.partnerHeader}>
        <LinearGradient colors={[Colors.primary + "30", Colors.primary + "10"]} style={styles.partnerAvatar}>
          <Text style={styles.partnerInitials}>{partner.avatar}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.partnerName}>{partner.name}</Text>
          <Text style={styles.partnerInfo}>{partner.pace} | {partner.distance}</Text>
        </View>
        <View style={styles.compatBadge}>
          <Text style={styles.compatText}>{partner.compatibility}%</Text>
        </View>
      </View>
      <View style={styles.partnerGoals}>
        {partner.goals.map(g => (
          <View key={g} style={styles.goalTag}>
            <Text style={styles.goalTagText}>{g}</Text>
          </View>
        ))}
      </View>
      <View style={styles.partnerFooter}>
        <Text style={styles.partnerActive}>{partner.lastActive}</Text>
        {partner.status === "connected" ? (
          <View style={styles.connectedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.connectedText}>Connected</Text>
          </View>
        ) : partner.status === "pending" ? (
          <View style={styles.pendingBadge}>
            <Ionicons name="time" size={14} color={Colors.accentOrange} />
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        ) : (
          <Pressable onPress={onConnect} style={({ pressed }) => [styles.connectBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <Text style={styles.connectBtnText}>Connect</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function BadgeItem({ badge }: { badge: { id: string; name: string; icon: string; earned: boolean } }) {
  return (
    <View style={[styles.badgeItem, !badge.earned && styles.badgeItemLocked]}>
      <View style={[styles.badgeIcon, { backgroundColor: badge.earned ? Colors.primary + "20" : Colors.border + "30" }]}>
        <MaterialCommunityIcons
          name={badge.icon as any}
          size={24}
          color={badge.earned ? Colors.primary : Colors.textMuted}
        />
      </View>
      <Text style={[styles.badgeName, !badge.earned && { color: Colors.textMuted }]}>{badge.name}</Text>
      {!badge.earned && (
        <Ionicons name="lock-closed" size={12} color={Colors.textMuted} style={styles.lockIcon} />
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [tab, setTab] = useState<ProfileTab>("stats");
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  const loadData = useCallback(async () => {
    const [p, pt, r] = await Promise.all([getProfile(), getPartners(), getRuns()]);
    setProfile(p);
    setPartners(pt);
    setRuns(r);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  async function handleSaveProfile() {
    if (!profile) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated = { ...profile, name: editName || profile.name, bio: editBio || profile.bio };
    await saveProfile(updated);
    setProfile(updated);
    setEditing(false);
  }

  async function handleConnect(partnerId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = partners.map(p => p.id === partnerId ? { ...p, status: "pending" as const } : p);
    await savePartners(updated);
    setPartners(updated);
  }

  if (!profile) return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );

  const avgPace = runs.length > 0 ? runs.reduce((sum, r) => sum + r.pace, 0) / runs.length : 0;
  const totalCalories = runs.reduce((sum, r) => sum + r.calories, 0);
  const initials = profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.background, Colors.backgroundLight]} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={{ paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 16, paddingBottom: Platform.OS === "web" ? 84 + 34 : 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileHeaderTop}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>{initials}</Text>
            </LinearGradient>
            <Pressable onPress={() => { setEditName(profile.name); setEditBio(profile.bio); setEditing(true); }}>
              <Feather name="edit-2" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileBio}>{profile.bio}</Text>
          <View style={styles.profileMeta}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="star-four-points" size={14} color={Colors.xp} />
              <Text style={styles.metaText}>Level {profile.level}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="fire" size={14} color={Colors.accent} />
              <Text style={styles.metaText}>{profile.streak} day streak</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>{profile.tier.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileTabs}>
          {(["stats", "partners", "badges"] as ProfileTab[]).map(t => (
            <Pressable
              key={t}
              onPress={() => { Haptics.selectionAsync(); setTab(t); }}
              style={[styles.profileTab, tab === t && styles.profileTabActive]}
            >
              <Text style={[styles.profileTabText, tab === t && styles.profileTabTextActive]}>
                {t === "stats" ? "Stats" : t === "partners" ? "Partners" : "Badges"}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "stats" && (
          <View style={styles.statsGrid}>
            <View style={styles.statBlock}>
              <Text style={styles.statBlockValue}>{profile.totalRuns}</Text>
              <Text style={styles.statBlockLabel}>Total Runs</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statBlockValue}>{formatDistance(profile.totalDistance)}</Text>
              <Text style={styles.statBlockLabel}>km Total</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statBlockValue}>{runs.length > 0 ? formatDuration(Math.round(profile.totalTime / runs.length)) : "--"}</Text>
              <Text style={styles.statBlockLabel}>Avg Duration</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statBlockValue}>{avgPace > 0 ? `${Math.floor(avgPace)}:${Math.round((avgPace % 1) * 60).toString().padStart(2, "0")}` : "--"}</Text>
              <Text style={styles.statBlockLabel}>Avg Pace</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statBlockValue}>{totalCalories.toLocaleString()}</Text>
              <Text style={styles.statBlockLabel}>Calories</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statBlockValue}>{profile.xp.toLocaleString()}</Text>
              <Text style={styles.statBlockLabel}>Total XP</Text>
            </View>
          </View>
        )}

        {tab === "partners" && (
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            <Text style={styles.partnerSectionTitle}>Running Partners</Text>
            {partners.map(p => (
              <PartnerCard key={p.id} partner={p} onConnect={() => handleConnect(p.id)} />
            ))}
          </View>
        )}

        {tab === "badges" && (
          <View style={styles.badgesGrid}>
            {profile.badges.map(b => (
              <BadgeItem key={b.id} badge={b} />
            ))}
          </View>
        )}

        <View style={styles.goalsSection}>
          <Text style={styles.goalsSectionTitle}>Your Goals</Text>
          <View style={styles.goalsChips}>
            {profile.goals.map(g => (
              <View key={g} style={styles.goalChip}>
                <Text style={styles.goalChipText}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={editing} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setEditing(false)}>
                <Feather name="x" size={24} color={Colors.text} />
              </Pressable>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={handleSaveProfile}>
                <Text style={styles.saveBtn}>Save</Text>
              </Pressable>
            </View>
            <View style={styles.editFields}>
              <Text style={styles.editLabel}>Name</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.editLabel}>Bio</Text>
              <TextInput
                style={[styles.editInput, { height: 80, textAlignVertical: "top" }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell us about your running journey"
                placeholderTextColor={Colors.textMuted}
                multiline
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  profileHeader: { paddingHorizontal: 20, marginBottom: 20 },
  profileHeaderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  profileInitials: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#FFF" },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.text },
  profileBio: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
  profileMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textMuted },
  tierBadge: { backgroundColor: Colors.primary + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tierText: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: Colors.primary },
  profileTabs: { flexDirection: "row", marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 12, padding: 4, marginBottom: 20 },
  profileTab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  profileTabActive: { backgroundColor: Colors.primary },
  profileTabText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textSecondary },
  profileTabTextActive: { color: "#FFF" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 10 },
  statBlock: { width: "31%", backgroundColor: Colors.card, borderRadius: 14, padding: 16, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statBlockValue: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.primary },
  statBlockLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary, marginTop: 4, textAlign: "center" },
  partnerSectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.text },
  partnerCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  partnerHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  partnerAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  partnerInitials: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  partnerName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  partnerInfo: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  compatBadge: { backgroundColor: Colors.primary + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  compatText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.primary },
  partnerGoals: { flexDirection: "row", gap: 6, marginBottom: 10 },
  goalTag: { backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  goalTagText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  partnerFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  partnerActive: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textMuted },
  connectedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  connectedText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.success },
  pendingBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  pendingText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.accentOrange },
  connectBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  connectBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFF" },
  badgesGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 10 },
  badgeItem: { width: "30%", backgroundColor: Colors.card, borderRadius: 14, padding: 14, alignItems: "center", gap: 8, borderWidth: 1, borderColor: Colors.border },
  badgeItemLocked: { opacity: 0.5 },
  badgeIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  badgeName: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.text, textAlign: "center" },
  lockIcon: { position: "absolute", top: 8, right: 8 },
  goalsSection: { paddingHorizontal: 20, marginTop: 24 },
  goalsSectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.text, marginBottom: 12 },
  goalsChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  goalChip: { backgroundColor: Colors.primary + "15", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: Colors.primary + "30" },
  goalChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.primary },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.text },
  saveBtn: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.primary },
  editFields: { gap: 12 },
  editLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textSecondary },
  editInput: { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: "Inter_400Regular", color: Colors.text, borderWidth: 1, borderColor: Colors.border },
});
