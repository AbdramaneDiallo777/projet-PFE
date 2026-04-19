/**
 * Un seul processus ngrok : API (8000) + Metro (8081).
 * Évite localtunnel (*.loca.lt) → timeouts HTTP 408 sur le téléphone,
 * et évite deux agents ngrok qui se marchent dessus (ERR_NGROK_334).
 *
 * Prérequis : NGROK_AUTHTOKEN dans .env, FastAPI sur 8000, Metro sur 8081 avant Expo.
 * Usage : npm run tunnel:dev
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const require = createRequire(import.meta.url);
const ngrok = require("@ngrok/ngrok");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env");
dotenv.config({ path: envPath });

const token = process.env.NGROK_AUTHTOKEN?.trim();
if (!token) {
  console.error(`
NGROK_AUTHTOKEN manquant dans .env
https://dashboard.ngrok.com/get-started/your-authtoken
`);
  process.exit(1);
}

function upsertEnvKey(filePath, key, value) {
  let content = "";
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    content = "";
  }
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=.*$`, "m");
  if (re.test(content)) {
    content = content.replace(re, line);
  } else {
    content = (content.trimEnd() + "\n" + line + "\n").trim() + "\n";
  }
  writeFileSync(filePath, content, "utf8");
}

(async () => {
  let apiListener;
  let metroListener;
  try {
    try {
      await ngrok.kill();
    } catch {
      /* ignore — libère une session ngrok zombie (évite ERR_NGROK_334) */
    }
    const staleUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (staleUrl && /ngrok/i.test(staleUrl)) {
      try {
        await ngrok.disconnect(staleUrl);
      } catch {
        /* ignore — endpoint peut être tenu par un autre PC / autre processus */
      }
    }
    const forwardOpts = { authtoken: token, force_new_session: true };
    apiListener = await ngrok.forward({
      addr: 8000,
      ...forwardOpts,
    });
    metroListener = await ngrok.forward({
      addr: 8081,
      ...forwardOpts,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Erreur ngrok :", msg);
    if (msg.includes("ERR_NGROK_334") || msg.includes("already online")) {
      console.error(`
ERR_NGROK_334 : le domaine ngrok (ex. doorframe-…ngrok-free.dev) est DEJA utilise.

  1) https://dashboard.ngrok.com/endpoints  → arretez / supprimez chaque endpoint actif.
  2) Fermez les terminaux tunnel:api, tunnel:metro, tunnel:dev.
  3) Invite de commandes (cmd) : taskkill /F /IM ngrok.exe
  4) Relancez : npm run tunnel:dev

Si un autre appareil utilise le meme compte ngrok, arretez le tunnel la-bas aussi.
`);
    }
    try {
      await apiListener?.close();
    } catch {
      /* ignore */
    }
    try {
      await metroListener?.close();
    } catch {
      /* ignore */
    }
    process.exit(1);
  }

  const apiUrl = apiListener.url();
  const metroUrl = metroListener.url();
  if (!apiUrl || !metroUrl) {
    console.error("URL ngrok indisponible.");
    process.exit(1);
  }

  const same =
    apiUrl.replace(/\/+$/, "").toLowerCase() ===
    metroUrl.replace(/\/+$/, "").toLowerCase();
  if (same) {
    console.error(`
[AgroConnectAfrica] Les deux tunnels ont la meme URL (${apiUrl}). Impossible de separer API (8000) et Metro (8081).

Le compte ngrok reutilise un domaine reserve pour plusieurs listeners. Consultez :
  https://dashboard.ngrok.com/cloud-edge/domains
Puis arretez les endpoints actifs et relancez npm run tunnel:dev.
`);
    try {
      await metroListener.close();
    } catch {
      /* ignore */
    }
    try {
      await apiListener.close();
    } catch {
      /* ignore */
    }
    process.exit(1);
  }

  if (existsSync(envPath)) {
    upsertEnvKey(envPath, "EXPO_PUBLIC_API_URL", apiUrl);
    upsertEnvKey(envPath, "EXPO_PACKAGER_PROXY_URL", metroUrl);
  }

  console.log("");
  console.log("--- Tunnels ngrok (meme session) ---");
  console.log("API (8000)   :", apiUrl);
  console.log("Metro (8081) :", metroUrl);
  console.log("");
  console.log(".env mis a jour : EXPO_PUBLIC_API_URL + EXPO_PACKAGER_PROXY_URL");
  console.log("");
  console.log("Puis : npx expo start --localhost --clear");
  console.log("Gardez ce terminal ouvert. Ctrl+C pour tout arreter.");
  console.log("");

  const shutdown = async () => {
    try {
      await metroListener?.close();
    } catch {
      /* ignore */
    }
    try {
      await apiListener?.close();
    } catch {
      /* ignore */
    }
    try {
      await ngrok.kill();
    } catch {
      /* ignore */
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.stdin.resume();
})();
