/**
 * Affiche des lignes prêtes pour .env (EXPO_PUBLIC_API_URL) à partir des IPv4 locales.
 * Usage : node scripts/show-lan-ip.mjs
 */
import os from "node:os";

const nets = os.networkInterfaces();
const lines = [];
for (const name of Object.keys(nets)) {
  for (const net of nets[name] ?? []) {
    const fam = net.family;
    const isV4 = fam === "IPv4" || fam === 4;
    if (isV4 && !net.internal) {
      lines.push({
        name,
        line: `EXPO_PUBLIC_API_URL=http://${net.address}:8000`,
        metro: `REACT_NATIVE_PACKAGER_HOSTNAME=${net.address}`,
      });
    }
  }
}

console.log("");
console.log("Copier la ligne correspondant à votre Wi‑Fi dans .env (racine du projet Expo), puis redémarrer Metro.");
console.log("");
if (lines.length === 0) {
  console.log("(Aucune IPv4 trouvée — branchez le Wi‑Fi ou définissez EXPO_PUBLIC_API_URL à la main.)");
} else {
  for (const { name, line, metro } of lines) {
    console.log(`# ${name}`);
    console.log(line);
    console.log(metro);
    console.log("");
  }
  console.log(
    "Mettez à jour .env : EXPO_PUBLIC_API_URL (API) et REACT_NATIVE_PACKAGER_HOSTNAME (Metro / QR code Expo Go), même IPv4 Wi‑Fi."
  );
}
console.log("");
