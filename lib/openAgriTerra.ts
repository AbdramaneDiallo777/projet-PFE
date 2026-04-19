import { Alert, Linking } from "react-native";

const AGRITERRA_URL = (process.env.EXPO_PUBLIC_AGRITERRA_URL ?? "").trim();

/**
 * Ouvre l’app AgriTerra (AgroConnect Africa) dans Expo Go — même flux qu’un lien exp://
 */
export async function openAgriTerra(): Promise<void> {
  if (!AGRITERRA_URL) {
    Alert.alert(
      "AgriTerra",
      "Ajoutez EXPO_PUBLIC_AGRITERRA_URL dans pfe/.env (ex. exp://192.168.1.12:8081)."
    );
    return;
  }
  try {
    await Linking.openURL(AGRITERRA_URL);
  } catch {
    Alert.alert(
      "AgriTerra",
      "Ouverture impossible. Vérifiez Expo Go et que l’app carte tourne (même réseau)."
    );
  }
}
