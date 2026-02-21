import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { isOnboardingDone } from "@/lib/storage";
import Colors from "@/constants/colors";

export default function IndexScreen() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  async function checkOnboarding() {
    const done = await isOnboardingDone();
    if (done) {
      router.replace("/(main)/home");
    } else {
      router.replace("/onboarding");
    }
    setChecking(false);
  }

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return null;
}
