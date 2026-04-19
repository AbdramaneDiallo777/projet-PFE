/**
 * Un seul tunnel ngrok vers le proxy de dev (port AGRO_DEV_PROXY_PORT, défaut 9090).
 * Met la MEME URL dans EXPO_PUBLIC_API_URL et EXPO_PACKAGER_PROXY_URL + EXPO_USE_SINGLE_TUNNEL=1.
 * Evite ERR_NGROK_334 (deux endpoints sur le meme domaine reserve) et le melange API/Metro.
 *
 * Prérequis : npm run dev:proxy  (et api + Metro en cours d'execution).
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
const proxyPort = Number(process.env.AGRO_DEV_PROXY_PORT ?? "9090");

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
  let listener;
  try {
    try {
      await ngrok.kill();
    } catch {
      /* ignore */
    }
    listener = await ngrok.forward({
      addr: proxyPort,
      authtoken: token,
      force_new_session: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Erreur ngrok :", msg);
    console.error(
      `Le proxy ecoute-t-il sur 127.0.0.1:${proxyPort} ? (npm run dev:proxy)`
    );
    process.exit(1);
  }

  const url = listener.url();
  if (!url) {
    console.error("URL ngrok indisponible.");
    process.exit(1);
  }

  if (existsSync(envPath)) {
    upsertEnvKey(envPath, "EXPO_PUBLIC_API_URL", url);
    upsertEnvKey(envPath, "EXPO_PACKAGER_PROXY_URL", url);
    upsertEnvKey(envPath, "EXPO_USE_SINGLE_TUNNEL", "1");
  }

  console.log("");
  console.log("--- Tunnel unique (proxy ->", `localhost:${proxyPort}`, ") ---");
  console.log("URL publique (API + Metro) :", url);
  console.log("");
  console.log(".env : EXPO_PUBLIC_API_URL = EXPO_PACKAGER_PROXY_URL (mode proxy)");
  console.log("Puis : npm run start:tunnel");
  console.log("Gardez dev:proxy + ce terminal ouverts. Ctrl+C pour arreter ngrok.\n");

  const shutdown = async () => {
    try {
      await listener?.close();
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
  setInterval(() => {}, 60_000);
  process.stdin.resume();
  await new Promise(() => {});
})();
