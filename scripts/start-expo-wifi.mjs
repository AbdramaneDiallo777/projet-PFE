/**
 * Charge `.env` puis lance Expo en `--lan` avec une IP Metro explicite.
 * Sans ça, Windows peut garder une vieille IP (ex. 172.20.10.x partage de connexion).
 *
 * Dans .env : REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.x (même IP que ipconfig Wi‑Fi).
 */
import "dotenv/config";
import { spawn } from "node:child_process";

const host =
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME?.trim() ||
  process.env.EXPO_METRO_LAN_IP?.trim();

if (host) {
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = host;
  console.log(`[AgroConnectAfrica] Metro forcé sur l’hôte LAN : ${host} (exp://${host}:8081)\n`);
}

const passThrough = process.argv.slice(2);
const args = ["expo", "start", "--lan", ...passThrough];

const child = spawn("npx", args, {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
