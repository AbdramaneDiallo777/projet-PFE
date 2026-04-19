import "dotenv/config";

/** Metro / Expo Go — fallback uniquement. */
const defaultMetro = "exp://127.0.0.1:8081";

/**
 * Ne pas injecter d’URL API par défaut dans `extra` : sinon elle écrase la déduction LAN
 * dans `constants/api.ts` (inferLanApiBaseUrl) et le téléphone reste sur 127.0.0.1.
 * Utiliser EXPO_PUBLIC_API_URL dans .env pour forcer une URL (tunnel ngrok, etc.).
 */
export default ({ config }) => ({
  ...config,
  expo: {
    ...config.expo,
    extra: {
      ...(config.expo?.extra ?? {}),
      ...(process.env.EXPO_PUBLIC_API_URL?.trim()
        ? { apiUrl: process.env.EXPO_PUBLIC_API_URL.trim().replace(/\/$/, "") }
        : {}),
      agriterraUrl: process.env.EXPO_PUBLIC_AGRITERRA_URL ?? defaultMetro,
    },
  },
});
