/**
 * Proxy local : une seule URL publique (ngrok) peut servir à la fois l’API (8000) et Metro (8081).
 * Routage : /api*, /docs*, /redoc*, /openapi.json → FastAPI ; le reste (bundle Expo, /_expo, WS) → Metro.
 *
 * Prérequis : npm run api  et  npx expo start --localhost  (ports 8000 et 8081).
 * Puis : npm run tunnel:single  (ngrok → ce proxy, défaut port 9090).
 */
import { createRequire } from "node:module";
import http from "node:http";

const require = createRequire(import.meta.url);
const httpProxy = require("http-proxy");

const PROXY_PORT = Number(process.env.AGRO_DEV_PROXY_PORT ?? "9090");
const API = "http://127.0.0.1:8000";
const METRO = "http://127.0.0.1:8081";

function pathname(req) {
  try {
    return new URL(req.url ?? "/", "http://127.0.0.1").pathname;
  } catch {
    return "/";
  }
}

/** @returns {string} */
function targetFor(req) {
  const p = pathname(req);
  if (p.startsWith("/api")) return API;
  if (p.startsWith("/docs")) return API;
  if (p.startsWith("/redoc")) return API;
  if (p === "/openapi.json") return API;
  return METRO;
}

const proxy = httpProxy.createProxyServer({
  ws: true,
  xfwd: true,
});

proxy.on("error", (err, req, res) => {
  console.error("[dev-public-proxy]", err.message);
  if (res && !res.headersSent && typeof res.writeHead === "function") {
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(
      "Proxy : verifiez que FastAPI (8000) et Metro (8081) tournent sur cette machine.\n"
    );
  }
});

const server = http.createServer((req, res) => {
  const target = targetFor(req);
  proxy.web(req, res, { target, changeOrigin: true });
});

server.on("upgrade", (req, socket, head) => {
  const target = targetFor(req);
  proxy.ws(req, socket, head, { target, changeOrigin: true });
});

server.listen(PROXY_PORT, "127.0.0.1", () => {
  console.log("");
  console.log(`--- Dev public proxy (127.0.0.1:${PROXY_PORT}) ---`);
  console.log("  /api*, /docs, /redoc, /openapi.json  ->", API);
  console.log("  tout le reste (bundle, /_expo, WebSocket) ->", METRO);
  console.log("");
  console.log("Ensuite : npm run tunnel:single");
  console.log("Ctrl+C pour arreter.\n");
});
