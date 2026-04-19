import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

/**
 * Au lancement (y compris retour depuis AgriTerra via exp://) : si un token est en SecureStore,
 * on va directement au tableau de bord ; sinon flux d’accueil / connexion.
 */
export default function Index() {
  const { isReady, token } = useAuth();

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#065F46" />
      </View>
    );
  }

  if (token) {
    return <Redirect href="/tableau-de-bord" />;
  }

  return <Redirect href="/(accueil)/bienvenue" />;
}
