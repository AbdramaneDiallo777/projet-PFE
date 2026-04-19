/**
 * Tunnel Metro (8081) via ngrok v3 — remplace localtunnel (*.loca.lt) qui provoque
 * souvent des HTTP 408 / timeouts sur Expo Go.
 *
 * Préférez npm run tunnel:dev (un seul processus : API + Metro) pour éviter ERR_NGROK_334.
 *
 * Prérequis : NGROK_AUTHTOKEN, Metro sur 8081.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const require = createRequire(import.meta.url);
const ngrok = require("@ngrok/ngrok");
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env");
dotenv.config({ path: envPath });

function normUrl(u) {
  return (u || "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
}

const token = process.env.NGROK_AUTHTOKEN?.trim();
if (!token) {
  console.error("NGROK_AUTHTOKEN manquant — ou lancez npm run tunnel:dev");
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
    const block =
      "\n# Expo : URL publique Metro\n" + line + "\n";
    content = (content.trimEnd() + block).trim() + "\n";
  }
  writeFileSync(filePath, content, "utf8");
}

(async () => {
  let listener;
  try {
    listener = await ngrok.forward({
      addr: 8081,
      authtoken: token,
      force_new_session: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Erreur ngrok (Metro) :", msg);
    console.error("Astuce : utilisez npm run tunnel:dev (API + Metro en une session).");
    process.exit(1);
  }

  const url = listener.url();
  if (!url) {
    console.error("Tunnel Metro : URL indisponible.");
    process.exit(1);
  }

  const apiUrl = normUrl(process.env.EXPO_PUBLIC_API_URL);
  if (apiUrl && normUrl(url) === apiUrl) {
    try {
      await listener.close();
    } catch {
      /* ignore */
    }
    console.error(`
[AgroConnectAfrica] ngrok a attribue la MEME URL que EXPO_PUBLIC_API_URL (${url})

Votre compte ngrok reutilise probablement un domaine reserve pour tous les tunnels.
Metro (8081) doit avoir un autre sous-domaine que l’API (8000).

Actions :
  1) Sur https://dashboard.ngrok.com/cloud-edge/domains — desactivez ou ne forcez pas un domaine par defaut pour le dev.
  2) Arretez tout tunnel API (terminal tunnel:api), puis relancez : npm run tunnel:metro
  3) Ou : arretez les endpoints sur le dashboard ngrok, puis npm run tunnel:dev
`);
    process.exit(1);
  }

  if (existsSync(envPath)) {
    upsertEnvKey(envPath, "EXPO_PACKAGER_PROXY_URL", url);
  }

  console.log("");
  console.log("--- Tunnel Metro (localhost:8081) ---");
  console.log("URL publique :", url);
  console.log("EXPO_PACKAGER_PROXY_URL ecrit dans .env");
  console.log("Puis redemarrez Expo. Ctrl+C pour arreter (ferme ce tunnel seulement).");
  console.log("");

  const shutdown = async () => {
    try {
      await listener?.close();
    } catch {
      /* ignore */
    }
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.stdin.resume();
})();
