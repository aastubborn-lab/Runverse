import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { setOnboardingDone, saveProfile, getProfile } from "@/lib/storage";

const { width } = Dimensions.get("window");

const GOALS = ["5K", "10K", "Half Marathon", "Marathon", "Weight Loss", "Stay Healthy", "Speed", "Fun"];

interface OnboardingStep {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
}

const STEPS: OnboardingStep[] = [
  { id: "welcome", icon: "run-fast", title: "Welcome to Runverse", subtitle: "Your all-in-one running companion. Track runs, find partners, crush challenges." },
  { id: "track", icon: "map-marker-path", title: "Track Every Run", subtitle: "GPS tracking with real-time pace, distance, and route mapping." },
  { id: "social", icon: "account-group", title: "Run Together", subtitle: "Find running partners, share highlights, and compete on leaderboards." },
  { id: "train", icon: "dumbbell", title: "Train Smarter", subtitle: "Guided workouts, custom plans, and progress analytics to level up." },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const showSetup = currentStep >= STEPS.length;
  const showGoals = currentStep >= STEPS.length + 1;

  function nextStep() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      setCurrentStep(STEPS.length);
    }
  }

  function toggleGoal(goal: string) {
    Haptics.selectionAsync();
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  }

  async function finishOnboarding() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const profile = await getProfile();
    profile.name = name || "Runner";
    profile.username = (name || "runner").toLowerCase().replace(/\s+/g, "");
    profile.goals = selectedGoals.length > 0 ? selectedGoals : ["Stay Healthy"];
    await saveProfile(profile);
    await setOnboardingDone();
    router.replace("/(main)/home");
  }

  if (showGoals) {
    return (
      <View style={[styles.container, { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 20 }]}>
        <LinearGradient colors={[Colors.background, Colors.backgroundLight]} style={StyleSheet.absoluteFill} />
        <View style={styles.setupContent}>
          <MaterialCommunityIcons name="target" size={48} color={Colors.primary} />
          <Text style={styles.setupTitle}>Set Your Goals</Text>
          <Text style={styles.setupSubtitle}>Pick what drives you. You can change these later.</Text>
          <View style={styles.goalsGrid}>
            {GOALS.map(goal => {
              const selected = selectedGoals.includes(goal);
              return (
                <Pressable
                  key={goal}
                  onPress={() => toggleGoal(goal)}
                  style={[styles.goalChip, selected && styles.goalChipSelected]}
                >
                  <Text style={[styles.goalText, selected && styles.goalTextSelected]}>{goal}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Pressable
          onPress={finishOnboarding}
          style={({ pressed }) => [styles.continueBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.continueBtnText}>Start Running</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </Pressable>
        <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 16 }} />
      </View>
    );
  }

  if (showSetup) {
    return (
      <View style={[styles.container, { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 20 }]}>
        <LinearGradient colors={[Colors.background, Colors.backgroundLight]} style={StyleSheet.absoluteFill} />
        <View style={styles.setupContent}>
          <MaterialCommunityIcons name="account-circle" size={48} color={Colors.primary} />
          <Text style={styles.setupTitle}>What's your name?</Text>
          <Text style={styles.setupSubtitle}>Let other runners know who you are.</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Your name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="next"
          />
        </View>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentStep(STEPS.length + 1); }}
          style={({ pressed }) => [styles.continueBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.continueBtnText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </Pressable>
        <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 16 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <LinearGradient colors={[Colors.background, Colors.backgroundLight]} style={StyleSheet.absoluteFill} />
      <Pressable
        onPress={async () => {
          await setOnboardingDone();
          router.replace("/(main)/home");
        }}
        style={styles.skipBtn}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
      <FlatList
        ref={flatListRef}
        data={STEPS}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[Colors.primary + '30', Colors.primary + '10']}
                style={styles.iconBg}
              >
                <MaterialCommunityIcons name={item.icon} size={64} color={Colors.primary} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />
      <View style={styles.bottomSection}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentStep && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          onPress={nextStep}
          style={({ pressed }) => [styles.continueBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.continueBtnText}>
            {currentStep === STEPS.length - 1 ? "Get Started" : "Continue"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </Pressable>
      </View>
      <View style={{ height: Platform.OS === "web" ? 34 : insets.bottom + 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  skipBtn: { position: "absolute", top: 60, right: 24, zIndex: 10, padding: 8 },
  skipText: { color: Colors.textSecondary, fontFamily: "Inter_500Medium", fontSize: 16 },
  slide: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  iconContainer: { marginBottom: 40 },
  iconBg: { width: 120, height: 120, borderRadius: 60, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.text, textAlign: "center", marginBottom: 16 },
  subtitle: { fontSize: 16, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 24 },
  bottomSection: { paddingHorizontal: 24, gap: 24 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 24 },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  continueBtnText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 17 },
  setupContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, gap: 12 },
  setupTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: Colors.text, textAlign: "center" },
  setupSubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center", lineHeight: 22 },
  nameInput: {
    width: "100%",
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 17,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 20 },
  goalChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalChipSelected: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  goalText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textSecondary },
  goalTextSelected: { color: Colors.primary },
});
