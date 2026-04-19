/**
 * URL de base du backend FastAPI (port 8000).
 * Téléphone : définir EXPO_PUBLIC_API_URL=http://IP_DU_PC:8000 dans .env (voir .env.example).
 * En mode tunnel Expo, sans URL publique vers FastAPI, l’API reste injoignable depuis le téléphone.
 */
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

const stripSlash = (u: string | undefined): string | undefined => {
  const s = u?.replace(/\/$/, "").trim();
  return s || undefined;
};

/** URL API définie explicitement (.env / extra) — utilisée pour les messages d’aide. */
const explicitApiUrl =
  stripSlash(process.env.EXPO_PUBLIC_API_URL) ??
  stripSlash(process.env.EXPO_PUBLIC_AGRO_API) ??
  stripSlash(extra?.apiUrl);

function tunnelPackagerHost(host: string): boolean {
  const lower = host.toLowerCase();
  return (
    lower.includes("exp.direct") ||
    lower.endsWith(".exp.host") ||
    lower.includes("expo.dev") ||
    lower.includes("ngrok") ||
    lower.includes("ngrok-free.app")
  );
}

/**
 * Metro en mode `expo start --tunnel` : l’hôte du bundler n’est pas l’IP LAN du PC,
 * donc on ne peut pas deviner où tourne FastAPI — il faut EXPO_PUBLIC_API_URL dans .env.
 */
export function isExpoDevTunnel(): boolean {
  if (!__DEV__) return false;
  const candidates: string[] = [];
  const ec = Constants.expoConfig as { hostUri?: string } | undefined;
  if (ec?.hostUri) candidates.push(ec.hostUri);
  const m = Constants.manifest as
    | { debuggerHost?: string; hostUri?: string }
    | null
    | undefined;
  if (m?.hostUri) candidates.push(m.hostUri);
  if (m?.debuggerHost) candidates.push(m.debuggerHost);
  for (const raw of candidates) {
    if (!raw || typeof raw !== "string") continue;
    const host = raw.includes(":") ? raw.split(":")[0]! : raw;
    if (tunnelPackagerHost(host)) return true;
  }
  return false;
}

/**
 * En dev, déduit `http://<hôte Metro>:8000` (même machine que le bundler) pour Expo Go en LAN,
 * afin que le téléphone n’utilise pas `127.0.0.1` (qui désigne le téléphone lui-même).
 */
function inferLanApiBaseUrl(): string | null {
  if (!__DEV__) return null;
  const candidates: string[] = [];
  const ec = Constants.expoConfig as { hostUri?: string } | undefined;
  if (ec?.hostUri) candidates.push(ec.hostUri);
  const m = Constants.manifest as
    | { debuggerHost?: string; hostUri?: string }
    | null
    | undefined;
  if (m?.hostUri) candidates.push(m.hostUri);
  if (m?.debuggerHost) candidates.push(m.debuggerHost);

  for (const raw of candidates) {
    if (!raw || typeof raw !== "string") continue;
    const host = raw.includes(":") ? raw.split(":")[0]! : raw;
    const lower = host.toLowerCase();
    if (
      lower === "localhost" ||
      lower === "127.0.0.1" ||
      lower.includes("exp.direct") ||
      lower.endsWith(".exp.host") ||
      lower.includes("expo.dev") ||
      lower.includes("ngrok")
    ) {
      continue;
    }
    if (/^[\d.]+$/.test(host) || host.includes(".")) {
      return `http://${host}:8000`;
    }
  }
  return null;
}

export const API_BASE_URL =
  explicitApiUrl ?? inferLanApiBaseUrl() ?? "http://127.0.0.1:8000";

/**
 * Aide affichée sur Scan IA quand la config réseau est probablement incorrecte.
 */
export function getApiConnectionHint(): string | null {
  if (explicitApiUrl) return null;
  if (inferLanApiBaseUrl()) return null;
  if (isExpoDevTunnel()) {
    return "Mode tunnel Expo : définissez EXPO_PUBLIC_API_URL dans .env. Même Wi‑Fi que le PC : « npm run env:lan » puis l’IP en http://…:8000. Wi‑Fi public / bibliothèque : lancez « npm run api », puis « npm run tunnel:api », copiez l’URL https (ngrok) dans EXPO_PUBLIC_API_URL, redémarrez Expo.";
  }
  if (API_BASE_URL.includes("127.0.0.1") || API_BASE_URL.includes("localhost")) {
    return "Sur téléphone, remplacez 127.0.0.1 par l’IPv4 de votre PC : « npm run env:lan » puis collez la ligne dans .env.";
  }
  return null;
}

/** Préfixes courants de l'API AgroConnect Africa (backend/app) */
export const apiV1 = (path: string) =>
  `${API_BASE_URL}/api/v1${path.startsWith("/") ? path : `/${path}`}`;

/** Routes membre E : /api/weather, /api/recommendations, /api/chat */
export const apiInsights = (path: string) =>
  `${API_BASE_URL}/api${path.startsWith("/") ? path : `/${path}`}`;
