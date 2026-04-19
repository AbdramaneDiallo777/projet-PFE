/**
 * Tunnel ngrok v3+ vers FastAPI (port 8000) via le SDK officiel @ngrok/ngrok
 * (l’ancien paquet npm "ngrok" embarquait l’agent 2.x, rejeté par ngrok.com : ERR_NGROK_121).
 *
 * Prérequis : NGROK_AUTHTOKEN dans .env, FastAPI sur 8000 (npm run api).
 * Usage : npm run tunnel:api
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ngrok = require("@ngrok/ngrok");
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
dotenv.config({ path: resolve(root, ".env") });

const token = process.env.NGROK_AUTHTOKEN?.trim();
if (!token) {
  console.error(`
NGROK_AUTHTOKEN manquant dans .env

1. https://dashboard.ngrok.com/get-started/your-authtoken
2. Dans .env : NGROK_AUTHTOKEN=votre_token
3. npm run tunnel:api
`);
  process.exit(1);
}

(async () => {
  let listener;
  try {
    listener = await ngrok.forward({
      addr: 8000,
      authtoken: token,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Erreur ngrok :", msg);
    console.error(
      "Vérifiez le token, que FastAPI tourne (npm run api), et votre connexion Internet."
    );
    process.exit(1);
  }

  const url = listener.url();
  if (!url) {
    console.error("Tunnel démarré mais URL indisponible.");
    process.exit(1);
  }

  console.log("");
  console.log("--- Tunnel API (localhost:8000) ---");
  console.log("URL publique :", url);
  console.log("");
  console.log("Dans .env, une seule ligne EXPO_PUBLIC_API_URL :");
  console.log("");
  console.log(`EXPO_PUBLIC_API_URL=${url}`);
  console.log("");
  console.log("Puis redémarrez Expo. Ctrl+C pour arrêter le tunnel.");
  console.log("");

  const shutdown = async () => {
    try {
      await listener.close();
    } catch {
      /* ignore */
    }
    // Ne pas appeler ngrok.kill() ici : cela fermerait aussi un autre tunnel
    // (ex. Metro) si vous lancez tunnel:api et tunnel:metro dans deux terminaux.
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  process.stdin.resume();
})();
