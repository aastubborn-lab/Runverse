import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  getLeaderboard,
  getChallenges,
  getProfile,
  saveChallenges,
  formatDistance,
  type LeaderboardEntry,
  type Challenge,
  type UserProfile,
} from "@/lib/storage";

type Tab = "leaderboard" | "challenges";

function TopThree({ entries }: { entries: LeaderboardEntry[] }) {
  const positions = [entries[1], entries[0], entries[2]];
  const heights = [100, 130, 80];
  const medalColors = [Colors.silver, Colors.gold, Colors.bronze];
  const sizes = [52, 64, 48];

  return (
    <View style={styles.podium}>
      {positions.map((entry, i) => {
        if (!entry) return null;
        const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
        return (
          <View key={entry.userId} style={[styles.podiumItem, { height: heights[i] + 80 }]}>
            <LinearGradient colors={[medalColors[i] + "40", medalColors[i] + "10"]} style={[styles.podiumAvatar, { width: sizes[i], height: sizes[i], borderRadius: sizes[i] / 2, borderColor: medalColors[i] }]}>
              <Text style={[styles.podiumInitials, { fontSize: sizes[i] * 0.3 }]}>{entry.avatar}</Text>
            </LinearGradient>
            <Text style={styles.podiumName} numberOfLines={1}>{entry.name.split(" ")[0]}</Text>
            <Text style={styles.podiumDistance}>{formatDistance(entry.distance)} km</Text>
            <View style={[styles.podiumBar, { height: heights[i], backgroundColor: medalColors[i] + "25" }]}>
              <Text style={[styles.podiumRank, { color: medalColors[i] }]}>#{actualRank}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function LeaderboardRow({ entry, isUser }: { entry: LeaderboardEntry; isUser: boolean }) {
  return (
    <View style={[styles.leaderRow, isUser && styles.leaderRowUser]}>
      <Text style={[styles.rankNum, entry.rank <= 3 && { color: [Colors.gold, Colors.silver, Colors.bronze][entry.rank - 1] }]}>
        {entry.rank}
      </Text>
      <LinearGradient colors={[Colors.primary + "30", Colors.primary + "10"]} style={styles.leaderAvatar}>
        <Text style={styles.leaderInitials}>{entry.avatar}</Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={styles.leaderName}>{entry.name}{isUser ? " (You)" : ""}</Text>
        <View style={styles.leaderMeta}>
          <MaterialCommunityIcons name="star-four-points" size={12} color={Colors.xp} />
          <Text style={styles.leaderXp}>Lv {entry.level}</Text>
          <MaterialCommunityIcons name="fire" size={12} color={Colors.accent} />
          <Text style={styles.leaderStreak}>{entry.streak}d</Text>
        </View>
      </View>
      <Text style={styles.leaderDistance}>{formatDistance(entry.distance)} km</Text>
    </View>
  );
}

function ChallengeDetailCard({ challenge, onJoin }: { challenge: Challenge; onJoin: () => void }) {
  const progress = Math.min(challenge.progress / challenge.target, 1);
  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000));

  return (
    <View style={styles.challengeDetail}>
      <View style={styles.challengeDetailHeader}>
        <View style={[styles.challengeDetailIcon, { backgroundColor: Colors.primary + "20" }]}>
          <MaterialCommunityIcons name={challenge.icon as any} size={24} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.challengeDetailTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDetailDesc}>{challenge.description}</Text>
        </View>
      </View>
      <View style={styles.challengeStats}>
        <View style={styles.challengeStat}>
          <MaterialCommunityIcons name="account-group" size={16} color={Colors.textSecondary} />
          <Text style={styles.challengeStatText}>{challenge.participants.toLocaleString()}</Text>
        </View>
        <View style={styles.challengeStat}>
          <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.challengeStatText}>{daysLeft}d left</Text>
        </View>
        <View style={styles.challengeStat}>
          <MaterialCommunityIcons name="star-four-points" size={16} color={Colors.xp} />
          <Text style={[styles.challengeStatText, { color: Colors.xp }]}>+{challenge.xpReward} XP</Text>
        </View>
      </View>
      <View style={styles.challengeProgressSection}>
        <View style={styles.challengeProgressBar}>
          <View style={[styles.challengeProgressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.challengeProgressText}>{challenge.progress}/{challenge.target} {challenge.unit}</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("leaderboard");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallengesState] = useState<Challenge[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [lb, c, p] = await Promise.all([
      Promise.resolve(getLeaderboard()),
      getChallenges(),
      getProfile(),
    ]);
    setLeaderboard(lb);
    setChallengesState(c);
    setProfile(p);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.background, Colors.backgroundLight]} style={StyleSheet.absoluteFill} />
      <View style={[styles.screenHeader, { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 8 }]}>
        <Text style={styles.screenTitle}>{tab === "leaderboard" ? "Leaderboard" : "Challenges"}</Text>
      </View>
      <View style={styles.tabs}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); setTab("leaderboard"); }}
          style={[styles.tab, tab === "leaderboard" && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === "leaderboard" && styles.tabTextActive]}>Leaderboard</Text>
        </Pressable>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); setTab("challenges"); }}
          style={[styles.tab, tab === "challenges" && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === "challenges" && styles.tabTextActive]}>Challenges</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 84 + 34 : 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {tab === "leaderboard" ? (
          <>
            <TopThree entries={leaderboard.slice(0, 3)} />
            {leaderboard.slice(3).map(entry => (
              <LeaderboardRow key={entry.userId} entry={entry} isUser={false} />
            ))}
            {profile && (
              <LeaderboardRow
                entry={{
                  rank: 42,
                  userId: profile.id,
                  name: profile.name,
                  avatar: profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
                  distance: profile.totalDistance,
                  xp: profile.xp,
                  streak: profile.streak,
                  level: profile.level,
                }}
                isUser
              />
            )}
          </>
        ) : (
          <View style={{ paddingTop: 8 }}>
            {challenges.map(c => (
              <ChallengeDetailCard key={c.id} challenge={c} onJoin={() => {}} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  screenHeader: { paddingHorizontal: 20, paddingBottom: 8 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  tabs: { flexDirection: "row", marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textSecondary },
  tabTextActive: { color: "#FFF" },
  podium: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end", paddingHorizontal: 20, marginBottom: 24, gap: 12 },
  podiumItem: { alignItems: "center", flex: 1, gap: 6 },
  podiumAvatar: { justifyContent: "center", alignItems: "center", borderWidth: 2 },
  podiumInitials: { fontFamily: "Inter_700Bold", color: Colors.text },
  podiumName: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  podiumDistance: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary },
  podiumBar: { width: "100%", borderRadius: 10, justifyContent: "center", alignItems: "center" },
  podiumRank: { fontFamily: "Inter_700Bold", fontSize: 22 },
  leaderRow: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  leaderRowUser: { borderColor: Colors.primary, backgroundColor: Colors.primary + "10" },
  rankNum: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.textSecondary, width: 28, textAlign: "center" },
  leaderAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  leaderInitials: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  leaderName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  leaderMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  leaderXp: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.xp, marginRight: 6 },
  leaderStreak: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.accent },
  leaderDistance: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.primary },
  challengeDetail: { marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  challengeDetailHeader: { flexDirection: "row", gap: 12, marginBottom: 12 },
  challengeDetailIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  challengeDetailTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.text },
  challengeDetailDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  challengeStats: { flexDirection: "row", gap: 16, marginBottom: 12 },
  challengeStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  challengeStatText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary },
  challengeProgressSection: { gap: 6 },
  challengeProgressBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3 },
  challengeProgressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  challengeProgressText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, textAlign: "right" },
});
