/**
 * Avec « expo start --localhost », Expo Go a besoin d’EXPO_PACKAGER_PROXY_URL (tunnel Metro 8081).
 * Si elle est absente ou identique à EXPO_PUBLIC_API_URL (tunnel API 8000), le bundle est demandé
 * à FastAPI → 404 sur /node_modules/.../entry.bundle.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env");

if (process.env.EXPO_SKIP_PACKAGER_CHECK === "1") {
  process.exit(0);
}

function parseEnvFile(filePath) {
  const out = {};
  if (!existsSync(filePath)) return out;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function normUrl(u) {
  return (u || "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
}

const fileEnv = parseEnvFile(envPath);
const apiUrl = normUrl(
  process.env.EXPO_PUBLIC_API_URL ?? fileEnv.EXPO_PUBLIC_API_URL,
);
const packagerUrl = normUrl(
  process.env.EXPO_PACKAGER_PROXY_URL ?? fileEnv.EXPO_PACKAGER_PROXY_URL,
);
const singleTunnel =
  (process.env.EXPO_USE_SINGLE_TUNNEL ?? fileEnv.EXPO_USE_SINGLE_TUNNEL) === "1";

if (!packagerUrl) {
  console.error(`
[AgroConnectAfrica] EXPO_PACKAGER_PROXY_URL manquant dans .env

Sans URL pour Metro (8081), Expo Go ne peut pas charger le bundle.

Mode recommande (un seul ngrok, evite ERR_NGROK_334) :
  1) npm run api
  2) npx expo start --localhost --clear
  3) npm run dev:proxy
  4) npm run tunnel:single
  5) npm run start:tunnel

Sinon : npm run tunnel:dev (deux URLs ngrok) ou mode LAN (npx expo start --lan).

(Contourner ce message : EXPO_SKIP_PACKAGER_CHECK=1)
`);
  process.exit(1);
}

if (packagerUrl === apiUrl && apiUrl && !singleTunnel) {
  console.error(`
[AgroConnectAfrica] EXPO_PACKAGER_PROXY_URL ne doit pas être la même URL que EXPO_PUBLIC_API_URL
(sauf mode proxy : EXPO_USE_SINGLE_TUNNEL=1 + npm run dev:proxy + npm run tunnel:single).

Sans proxy : deux tunnels ngrok differents (8000 vs 8081) — npm run tunnel:dev
`);
  process.exit(1);
}

if (singleTunnel && packagerUrl !== apiUrl) {
  console.error(`
[AgroConnectAfrica] EXPO_USE_SINGLE_TUNNEL=1 mais les deux URLs different.
Mettez la meme URL pour EXPO_PUBLIC_API_URL et EXPO_PACKAGER_PROXY_URL (sortie de npm run tunnel:single).
`);
  process.exit(1);
}

process.exit(0);
