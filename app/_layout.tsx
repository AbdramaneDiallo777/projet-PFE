import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { AuthProvider } from "@/contexts/AuthContext";
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Précharge les polices d’icônes (@expo/vector-icons) avec le texte — sinon iOS peut
  // lancer des centaines de loadAsync en parallèle → CTFontManagerError 104.
  const [loaded, error] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
    ...MaterialCommunityIcons.font,
    ...Feather.font,
    "PJS-Regular": PlusJakartaSans_400Regular,
    "PJS-Medium": PlusJakartaSans_500Medium,
    "PJS-SemiBold": PlusJakartaSans_600SemiBold,
    "PJS-Bold": PlusJakartaSans_700Bold,
    "PJS-ExtraBold": PlusJakartaSans_800ExtraBold,
    "Inter-Reg": Inter_400Regular,
    "Inter-Med": Inter_500Medium,
    "Inter-Semi": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
