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
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import {
  getProfile,
  getRuns,
  getChallenges,
  getWorkouts,
  type UserProfile,
  type Challenge,
  type Workout,
  formatDistance,
} from "@/lib/storage";

function StatCard({ icon, label, value, color, delay }: { icon: string; label: string; value: string; color: string; delay: number }) {
  return (
    <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(delay).springify() : undefined} style={styles.statCard}>
      <LinearGradient colors={[color + '20', color + '08']} style={styles.statGradient}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const progress = Math.min(challenge.progress / challenge.target, 1);
  return (
    <Pressable style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <View style={[styles.challengeIconBg, { backgroundColor: Colors.primary + '20' }]}>
          <MaterialCommunityIcons name={challenge.icon as any} size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDesc}>{challenge.description}</Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>+{challenge.xpReward} XP</Text>
        </View>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {challenge.progress}/{challenge.target} {challenge.unit}
        </Text>
      </View>
    </Pressable>
  );
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const typeColors: Record<string, string> = {
    interval: Colors.accent,
    tempo: Colors.accentOrange,
    easy: Colors.primary,
    long: '#7C6FFF',
    recovery: '#4ECDC4',
  };
  const color = typeColors[workout.type] || Colors.primary;

  return (
    <Pressable style={styles.workoutCard}>
      <LinearGradient colors={[color + '15', 'transparent']} style={styles.workoutGradient}>
        <View style={styles.workoutTop}>
          <View style={[styles.workoutTypeBadge, { backgroundColor: color + '25' }]}>
            <Text style={[styles.workoutTypeText, { color }]}>{workout.type.toUpperCase()}</Text>
          </View>
          {workout.completed && (
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          )}
        </View>
        <Text style={styles.workoutTitle}>{workout.title}</Text>
        <View style={styles.workoutMeta}>
          <View style={styles.workoutMetaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.workoutMetaText}>{workout.duration} min</Text>
          </View>
          <View style={styles.workoutMetaItem}>
            <Ionicons name="flame-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.workoutMetaText}>{workout.calories} cal</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [todayDistance, setTodayDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [p, runs, c, w] = await Promise.all([
      getProfile(),
      getRuns(),
      getChallenges(),
      getWorkouts(),
    ]);
    setProfile(p);
    setChallenges(c);
    setWorkouts(w);
    const today = new Date().toDateString();
    const todayRuns = runs.filter(r => new Date(r.date).toDateString() === today);
    setTodayDistance(todayRuns.reduce((sum, r) => sum + r.distance, 0));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (!profile) return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );

  const levelProgress = (profile.xp % 1000) / 1000;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.background, Colors.backgroundLight]} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={{ paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 16, paddingBottom: Platform.OS === "web" ? 84 + 34 : 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},</Text>
            <Text style={styles.userName}>{profile.name}</Text>
          </View>
          <View style={styles.levelBadge}>
            <MaterialCommunityIcons name="star-four-points" size={16} color={Colors.xp} />
            <Text style={styles.levelText}>Lv {profile.level}</Text>
          </View>
        </View>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.springify() : undefined}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(main)/run"); }}
            style={({ pressed }) => [styles.startRunCard, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.startRunGradient}>
              <View style={styles.startRunContent}>
                <View>
                  <Text style={styles.startRunTitle}>Start Running</Text>
                  <Text style={styles.startRunSub}>Today: {formatDistance(todayDistance)} km</Text>
                </View>
                <View style={styles.startRunIcon}>
                  <MaterialCommunityIcons name="play" size={32} color="#FFF" />
                </View>
              </View>
              <View style={styles.levelProgressBar}>
                <View style={[styles.levelProgressFill, { width: `${levelProgress * 100}%` }]} />
              </View>
              <Text style={styles.xpProgress}>{profile.xp % 1000} / 1000 XP to Level {profile.level + 1}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <View style={styles.statsRow}>
          <StatCard icon="fire" label="Streak" value={`${profile.streak}d`} color={Colors.accent} delay={100} />
          <StatCard icon="map-marker-distance" label="Total" value={`${formatDistance(profile.totalDistance)}km`} color={Colors.primary} delay={200} />
          <StatCard icon="run" label="Runs" value={`${profile.totalRuns}`} color={Colors.accentOrange} delay={300} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Challenges</Text>
          <Pressable onPress={() => router.push("/(main)/leaderboard")}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
        {challenges.slice(0, 2).map(c => (
          <ChallengeCard key={c.id} challenge={c} />
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Workouts</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.workoutsRow}>
          {workouts.filter(w => !w.completed).slice(0, 3).map(w => (
            <WorkoutCard key={w.id} workout={w} />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={() => router.push("/(main)/feed")}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#7C6FFF20' }]}>
              <Ionicons name="chatbubbles" size={22} color="#7C6FFF" />
            </View>
            <Text style={styles.quickActionText}>Social Feed</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={() => router.push("/(main)/leaderboard")}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.xp + '20' }]}>
              <Ionicons name="trophy" size={22} color={Colors.xp} />
            </View>
            <Text style={styles.quickActionText}>Leaderboard</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={() => router.push("/(main)/profile")}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '20' }]}>
              <Ionicons name="person" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Profile</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 20 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.textSecondary },
  userName: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.text, marginTop: 2 },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.xp + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  levelText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.xp },
  startRunCard: { marginHorizontal: 20, borderRadius: 20, overflow: "hidden", marginBottom: 20 },
  startRunGradient: { padding: 20 },
  startRunContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  startRunTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#FFF" },
  startRunSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  startRunIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  levelProgressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, marginTop: 16 },
  levelProgressFill: { height: 4, backgroundColor: "#FFF", borderRadius: 2 },
  xpProgress: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 6 },
  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  statCard: { flex: 1 },
  statGradient: { borderRadius: 16, padding: 14, alignItems: "center", gap: 6, borderWidth: 1, borderColor: Colors.border },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.text },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.text },
  seeAll: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.primary },
  challengeCard: { marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  challengeHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  challengeIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  challengeTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  challengeDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  xpBadge: { backgroundColor: Colors.xp + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  xpText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.xp },
  progressContainer: { marginTop: 12, gap: 6 },
  progressBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  progressText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, textAlign: "right" },
  workoutsRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  workoutCard: { width: 200, borderRadius: 16, overflow: "hidden", backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  workoutGradient: { padding: 16, gap: 8 },
  workoutTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  workoutTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  workoutTypeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  workoutTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  workoutMeta: { flexDirection: "row", gap: 12, marginTop: 4 },
  workoutMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  workoutMetaText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  quickActions: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  quickAction: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 16, alignItems: "center", gap: 10, borderWidth: 1, borderColor: Colors.border },
  quickActionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  quickActionText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.textSecondary },
});
