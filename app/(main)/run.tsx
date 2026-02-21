import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from "react-native-reanimated";
import Colors from "@/constants/colors";
import {
  saveRun,
  getProfile,
  saveProfile,
  getRuns,
  formatDuration,
  formatPace,
  formatDistance,
  type RunRecord,
} from "@/lib/storage";
import * as Crypto from "expo-crypto";

type RunState = "idle" | "running" | "paused" | "finished";

function PulsingDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 800 }), withTiming(1, { duration: 800 })), -1);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.pulsingDot, style]} />;
}

function RunHistoryItem({ run }: { run: RunRecord }) {
  const date = new Date(run.date);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <View style={styles.historyItem}>
      <View style={styles.historyLeft}>
        <View style={[styles.historyIcon, { backgroundColor: Colors.primary + "20" }]}>
          <MaterialCommunityIcons name="run-fast" size={18} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.historyDate}>{dateStr}</Text>
          <Text style={styles.historyPace}>{formatPace(run.pace)} min/km</Text>
        </View>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyDistance}>{formatDistance(run.distance)} km</Text>
        <Text style={styles.historyDuration}>{formatDuration(run.duration)}</Text>
      </View>
    </View>
  );
}

export default function RunScreen() {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<RunState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadHistory = useCallback(async () => {
    const runs = await getRuns();
    setHistory(runs);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  function startRun() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setState("running");
    setElapsed(0);
    setDistance(0);
    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
      setDistance(prev => prev + (0.002 + Math.random() * 0.003));
    }, 1000);
  }

  function pauseRun() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setState("paused");
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function resumeRun() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState("running");
    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
      setDistance(prev => prev + (0.002 + Math.random() * 0.003));
    }, 1000);
  }

  async function finishRun() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState("finished");

    const pace = elapsed > 0 && distance > 0 ? (elapsed / 60) / distance : 0;
    const calories = Math.round(distance * 65);
    const run: RunRecord = {
      id: Crypto.randomUUID(),
      date: new Date().toISOString(),
      distance: Math.round(distance * 100) / 100,
      duration: elapsed,
      pace: Math.round(pace * 100) / 100,
      calories,
      route: [],
      elevation: Math.round(Math.random() * 50 + 10),
      splits: [],
    };
    await saveRun(run);

    const profile = await getProfile();
    profile.totalRuns += 1;
    profile.totalDistance += run.distance;
    profile.totalTime += run.duration;
    profile.xp += Math.round(run.distance * 100);
    profile.level = Math.floor(profile.xp / 1000) + 1;
    profile.streak += 1;
    await saveProfile(profile);
    await loadHistory();
  }

  function resetRun() {
    setState("idle");
    setElapsed(0);
    setDistance(0);
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const pace = elapsed > 0 && distance > 0 ? (elapsed / 60) / distance : 0;
  const calories = Math.round(distance * 65);

  if (state === "finished") {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.background, Colors.backgroundLight]} style={StyleSheet.absoluteFill} />
        <ScrollView contentContainerStyle={{ paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 20, paddingBottom: Platform.OS === "web" ? 84 + 34 : 100, paddingHorizontal: 20 }}>
          <View style={styles.finishHeader}>
            <MaterialCommunityIcons name="check-circle" size={48} color={Colors.success} />
            <Text style={styles.finishTitle}>Great Run!</Text>
            <Text style={styles.finishSubtitle}>Keep up the momentum</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatDistance(distance)}</Text>
              <Text style={styles.summaryLabel}>km</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatDuration(elapsed)}</Text>
              <Text style={styles.summaryLabel}>duration</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatPace(pace)}</Text>
              <Text style={styles.summaryLabel}>min/km</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{calories}</Text>
              <Text style={styles.summaryLabel}>cal</Text>
            </View>
          </View>
          <View style={styles.xpEarned}>
            <MaterialCommunityIcons name="star-four-points" size={20} color={Colors.xp} />
            <Text style={styles.xpEarnedText}>+{Math.round(distance * 100)} XP earned!</Text>
          </View>
          <Pressable onPress={resetRun} style={({ pressed }) => [styles.doneBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.background, Colors.backgroundLight]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 16, paddingBottom: Platform.OS === "web" ? 84 + 34 : 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.runHeader}>
          <Text style={styles.screenTitle}>
            {state === "idle" ? "Ready to Run" : state === "running" ? "Running" : "Paused"}
          </Text>
          {state === "running" && <PulsingDot />}
        </View>

        <View style={styles.mainDisplay}>
          <View style={styles.bigStat}>
            <Text style={styles.bigStatValue}>{formatDistance(distance)}</Text>
            <Text style={styles.bigStatUnit}>km</Text>
          </View>
          <View style={styles.liveStats}>
            <View style={styles.liveStat}>
              <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.liveStatValue}>{formatDuration(elapsed)}</Text>
              <Text style={styles.liveStatLabel}>Time</Text>
            </View>
            <View style={styles.liveStatDivider} />
            <View style={styles.liveStat}>
              <MaterialCommunityIcons name="speedometer" size={18} color={Colors.textSecondary} />
              <Text style={styles.liveStatValue}>{distance > 0 ? formatPace(pace) : "--:--"}</Text>
              <Text style={styles.liveStatLabel}>Pace</Text>
            </View>
            <View style={styles.liveStatDivider} />
            <View style={styles.liveStat}>
              <Ionicons name="flame-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.liveStatValue}>{calories}</Text>
              <Text style={styles.liveStatLabel}>Cal</Text>
            </View>
          </View>
        </View>

        {state === "idle" && (
          <Pressable onPress={startRun} style={({ pressed }) => [styles.startBtn, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.startBtnGradient}>
              <MaterialCommunityIcons name="play" size={40} color="#FFF" />
              <Text style={styles.startBtnText}>Start Run</Text>
            </LinearGradient>
          </Pressable>
        )}

        {(state === "running" || state === "paused") && (
          <View style={styles.runControls}>
            <Pressable
              onPress={state === "running" ? pauseRun : resumeRun}
              style={[styles.controlBtn, { backgroundColor: Colors.card }]}
            >
              <Ionicons name={state === "running" ? "pause" : "play"} size={28} color={Colors.text} />
            </Pressable>
            <Pressable
              onPress={finishRun}
              style={[styles.controlBtn, { backgroundColor: Colors.accent }]}
            >
              <Ionicons name="stop" size={28} color="#FFF" />
            </Pressable>
          </View>
        )}

        {state === "idle" && history.length > 0 && (
          <>
            <View style={styles.historySectionHeader}>
              <Text style={styles.historySectionTitle}>Recent Runs</Text>
            </View>
            {history.slice(0, 5).map(run => (
              <RunHistoryItem key={run.id} run={run} />
            ))}
          </>
        )}

        {state === "idle" && history.length === 0 && (
          <View style={styles.emptyHistory}>
            <MaterialCommunityIcons name="run" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyHistoryText}>No runs yet. Hit Start to begin!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  runHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  pulsingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  mainDisplay: { alignItems: "center", marginBottom: 32, paddingHorizontal: 20 },
  bigStat: { alignItems: "center", marginBottom: 24 },
  bigStatValue: { fontFamily: "Inter_700Bold", fontSize: 64, color: Colors.text },
  bigStatUnit: { fontFamily: "Inter_500Medium", fontSize: 18, color: Colors.textSecondary, marginTop: -8 },
  liveStats: { flexDirection: "row", backgroundColor: Colors.card, borderRadius: 16, padding: 16, width: "100%", justifyContent: "space-around", borderWidth: 1, borderColor: Colors.border },
  liveStat: { alignItems: "center", gap: 4 },
  liveStatValue: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.text },
  liveStatLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  liveStatDivider: { width: 1, backgroundColor: Colors.border },
  startBtn: { marginHorizontal: 20, borderRadius: 20, overflow: "hidden", marginBottom: 32 },
  startBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 20, gap: 12 },
  startBtnText: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#FFF" },
  runControls: { flexDirection: "row", justifyContent: "center", gap: 20, paddingHorizontal: 20, marginBottom: 32 },
  controlBtn: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  historySectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
  historySectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.text },
  historyItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  historyLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  historyIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  historyDate: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  historyPace: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  historyRight: { alignItems: "flex-end" },
  historyDistance: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.primary },
  historyDuration: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary },
  emptyHistory: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyHistoryText: { fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.textMuted },
  finishHeader: { alignItems: "center", marginBottom: 32, gap: 8 },
  finishTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.text },
  finishSubtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.textSecondary },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  summaryItem: { flex: 1, minWidth: "40%", backgroundColor: Colors.card, borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  summaryValue: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.primary },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  xpEarned: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20, backgroundColor: Colors.xp + "15", paddingVertical: 12, borderRadius: 12 },
  xpEarnedText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.xp },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 20 },
  doneBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: "#FFF" },
});
