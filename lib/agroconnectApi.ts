/**
 * Appels vers le backend AgroConnect Africa (FastAPI) — météo membre E, recommandations, chat Ollama, ML.
 */
import { API_BASE_URL, apiInsights, apiV1 } from "@/constants/api";

/** Évite la page HTML d’avertissement ngrok (plan gratuit) sur les appels API. */
function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const base = API_BASE_URL.toLowerCase();
  if (!base.includes("ngrok")) return fetch(input, init);
  const headers = new Headers(init?.headers);
  if (!headers.has("ngrok-skip-browser-warning")) {
    headers.set("ngrok-skip-browser-warning", "69420");
  }
  return fetch(input, { ...init, headers });
}

/** Routes FastAPI MVP sous `/api` (hors `/api/v1/ml`). */
export function apiMvp(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}/api${p}`;
}

/** Jeton de secours quand le backend est injoignable à la connexion — pas d’appels authentifiés réels. */
export function isOfflineDevToken(token: string | null | undefined): boolean {
  return token == null || token === "" || token === "dev-token";
}

/** Détails FastAPI/Pydantic 422 → message lisible (champ + msg). */
function detailToMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const lines: string[] = [];
    for (const item of detail) {
      if (item != null && typeof item === "object" && "msg" in item) {
        const rec = item as { loc?: unknown[]; msg?: string; type?: string };
        const loc = Array.isArray(rec.loc)
          ? rec.loc.filter((x) => x !== "body").join(" → ")
          : "";
        const msg = typeof rec.msg === "string" ? rec.msg : JSON.stringify(rec);
        lines.push(loc ? `${loc}: ${msg}` : msg);
      } else {
        lines.push(JSON.stringify(item));
      }
    }
    return lines.join("\n");
  }
  if (detail != null && typeof detail === "object") return JSON.stringify(detail);
  return "";
}

export type RiskLevel = "Low" | "Medium" | "High";

export type InsightsWeather = {
  temperature: number;
  /** Ressenti (OpenWeather main.feels_like), °C */
  feels_like?: number;
  humidity: number;
  wind: { speed: number };
  rain: { lastHour: number | null };
};

export type InsightsRecommendations = {
  analysis: string[];
  recommendations: string[];
  risk_level: RiskLevel;
};

export type V1Weather = {
  temperature: number;
  /** Ressenti (OpenWeather), °C */
  feels_like?: number;
  humidity: number;
  wind_speed: number;
  condition: string;
  condition_fr: string;
  icon_url?: string;
  city?: string;
  recommendations?: string[];
  note?: string;
};

export type ChatIntent =
  | "weather_analysis"
  | "disease_detection"
  | "map"
  | "marketplace"
  | "logistics"
  | "help";

export type ChatResponse = {
  reply: string;
  intent?: ChatIntent;
};

export type MlPredictResponse = {
  maladie?: string;
  /** Code classe PlantVillage (ex. Tomato___Early_blight) */
  maladie_code?: string;
  confiance?: string;
  status?: string;
  error?: string;
};

/** GET /api/v1/ml/health — proxy vers Flask projet-data-main (GET /health). */
export type MlHealthFlaskPayload = {
  status?: string;
  model_loaded?: boolean;
  model_path?: string;
  error?: string | null;
  raw?: string;
};

export type MlHealthResponse = {
  ml_service: "up" | "down" | "error";
  url: string;
  http_status?: number;
  hint?: string;
  flask?: MlHealthFlaskPayload;
};

function withQuery(
  base: string,
  params: { lat?: number | null; lon?: number | null }
): string {
  const q = new URLSearchParams();
  if (params.lat != null && params.lon != null) {
    q.set("lat", String(params.lat));
    q.set("lon", String(params.lon));
  }
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

/** Météo normalisée (membre E) — GET /api/weather */
export async function fetchInsightsWeather(
  lat?: number | null,
  lon?: number | null
): Promise<InsightsWeather> {
  const url = withQuery(apiInsights("/weather"), { lat, lon });
  const res = await apiFetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Météo ${res.status}`);
  }
  return res.json() as Promise<InsightsWeather>;
}

/** Recommandations IA + risque — GET /api/recommendations */
export async function fetchInsightsRecommendations(
  lat?: number | null,
  lon?: number | null
): Promise<InsightsRecommendations> {
  const url = withQuery(apiInsights("/recommendations"), { lat, lon });
  const res = await apiFetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Recommandations ${res.status}`);
  }
  return res.json() as Promise<InsightsRecommendations>;
}

/**
 * Convertit la réponse `GET /api/weather` (InsightsWeather) en champs attendus par l’UI météo
 * (condition / libellé FR). Il n’existe pas de route séparée `/api/v1/weather/` sur le backend.
 */
export function mapInsightsWeatherToV1(w: InsightsWeather): V1Weather {
  const rainMm = w.rain?.lastHour ?? 0;
  let condition = "Clouds";
  let condition_fr = "Nuageux";
  if (rainMm > 0.3) {
    condition = "Rain";
    condition_fr = "Pluie";
  } else if (w.humidity >= 85) {
    condition = "Clouds";
    condition_fr = "Très humide";
  } else if (w.temperature >= 24 && w.humidity < 55) {
    condition = "Clear";
    condition_fr = "Ensoleillé";
  } else if (w.temperature < 8) {
    condition = "Clouds";
    condition_fr = "Froid";
  }

  return {
    temperature: w.temperature,
    feels_like: w.feels_like,
    humidity: w.humidity,
    wind_speed: w.wind.speed,
    condition,
    condition_fr,
  };
}

/** @deprecated Préférez `fetchInsightsWeather` + `mapInsightsWeatherToV1` pour un seul appel HTTP. */
export async function fetchV1Weather(
  lat?: number | null,
  lon?: number | null
): Promise<V1Weather> {
  const w = await fetchInsightsWeather(lat, lon);
  return mapInsightsWeatherToV1(w);
}

/**
 * Chat Agrobot — POST `/api/chat` sur `EXPO_PUBLIC_API_URL` (FastAPI).
 * Côté serveur : `OPENAI_API_KEY` si défini, sinon Ollama (`OLLAMA_URL`, `OLLAMA_MODEL` dans `.env`).
 */
export async function sendInsightsChat(message: string): Promise<ChatResponse> {
  const res = await apiFetch(apiInsights("/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Chat ${res.status}`);
  }
  return res.json() as Promise<ChatResponse>;
}

/** GET /api/chat/info — moteur utilisé (OpenAI ou Ollama + nom du modèle). */
export type ChatEngineInfo = {
  provider: "openai" | "ollama";
  model: string;
};

export async function fetchChatEngineInfo(): Promise<ChatEngineInfo> {
  const res = await apiFetch(apiInsights("/chat/info"));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Chat info ${res.status}`);
  }
  return res.json() as Promise<ChatEngineInfo>;
}

/**
 * Diagnostic image — POST /api/v1/ml/predict (proxy vers Flask ml-service /predict).
 * `uri` : fichier local (file://) depuis Photo ou caméra.
 */
export async function predictPlantDisease(uri: string): Promise<MlPredictResponse> {
  const form = new FormData();
  const name = uri.split("/").pop() || "photo.jpg";
  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "jpg";
  const mime =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  // React Native FormData attend un objet { uri, name, type }
  form.append(
    "file",
    {
      uri,
      name: `upload.${ext || "jpg"}`,
      type: mime,
    } as unknown as Blob
  );

  const res = await apiFetch(apiV1("/ml/predict"), {
    method: "POST",
    body: form,
  });

  const data = (await res.json().catch(() => ({}))) as MlPredictResponse & {
    detail?: string | unknown;
  };
  if (!res.ok) {
    const detail = data.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : detail != null
          ? JSON.stringify(detail)
          : data.error || `Diagnostic ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function fetchMlHealth(): Promise<MlHealthResponse> {
  const url = apiV1("/ml/health");
  let res: Response;
  try {
    res = await apiFetch(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Réseau : ${msg}. URL : ${url} — démarrez FastAPI sur le PC et ouvrez le pare-feu Windows (port 8000).`
    );
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `ML health ${res.status} (${url})`);
  }
  return res.json() as Promise<MlHealthResponse>;
}

/** Parcelle telle que renvoyée par GET /api/v1/parcelles/ ou envoyée au POST /api/parcelles/bulk */
export type ApiParcelle = {
  id?: number;
  id_local: string;
  nom: string;
  points?: string | null;
  surface?: string | null;
  humidite?: string | null;
  croissance?: string | null;
  qualite_sol?: string | null;
  statut_occupation?: string;
  statut_location?: string;
  lieu?: string | null;
  culture?: string | null;
  proprietaire_nom?: string | null;
  proprietaire_tel?: string | null;
  /** JSON string : liste d’URLs ou marqueurs `bundled-culture:…` (sync app). */
  photos_urls?: string | null;
  synced_at?: string | null;
};

export async function fetchParcelles(): Promise<ApiParcelle[]> {
  const res = await apiFetch(apiV1("/parcelles/"));
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Parcelles ${res.status}`);
  }
  return res.json() as Promise<ApiParcelle[]>;
}

/** Parcelles du membre connecté — GET /api/v1/parcelles/me */
export async function fetchMyParcelles(token: string): Promise<ApiParcelle[]> {
  const res = await apiFetch(`${API_BASE_URL}/api/parcelles/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const raw = await res.json().catch(() => null);
  if (!res.ok) {
    const detail =
      raw && typeof raw === "object" && raw !== null && "detail" in raw
        ? (raw as { detail?: unknown }).detail
        : undefined;
    const msg =
      typeof detail === "string"
        ? detail
        : detail != null
          ? JSON.stringify(detail)
          : `Parcelles ${res.status}`;
    throw new Error(msg);
  }
  return Array.isArray(raw) ? (raw as ApiParcelle[]) : [];
}

/** Ligne parcelle — GET /api/parcelles/sync (même schéma que la synchro carte). */
export type ParcelleSyncRow = {
  id_local: string;
  nom: string;
  points: string;
  surface: string;
  humidite: string;
  croissance: string;
  qualite_sol: string;
  statut_occupation: string;
  statut_location: string;
  lieu: string;
  culture: string;
  proprietaire_nom: string;
  proprietaire_tel: string;
  photos_urls?: string;
};

export type ParcellesSyncResponse = {
  parcelles: ParcelleSyncRow[];
  last_updated: number;
};

/** Liste toutes les parcelles (sync descendante) — GET /api/parcelles/sync — sans auth. */
export async function fetchParcellesSync(): Promise<ParcellesSyncResponse> {
  const res = await apiFetch(apiMvp("/parcelles/sync"));
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Parcelles sync ${res.status}`);
  }
  return res.json() as Promise<ParcellesSyncResponse>;
}

/** Bulk upsert parcelles — POST /api/parcelles/bulk (FastAPI MVP). */
export async function bulkUpsertParcelles(
  token: string,
  parcelles: ApiParcelle[]
): Promise<{ ok: boolean; upserted: number }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (!isOfflineDevToken(token)) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await apiFetch(apiMvp("/parcelles/bulk"), {
    method: "POST",
    headers,
    body: JSON.stringify({ parcelles }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Bulk parcelles ${res.status}`);
  }
  return res.json() as Promise<{ ok: boolean; upserted: number }>;
}

export type ApiUser = {
  id: string | number;
  email: string;
  full_name: string | null;
  role: string;
  location?: string | null;
  phone_number?: string | null;
  is_active: boolean;
  image_url?: string | null;
  country_code?: string | null;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export async function authLogin(
  email: string,
  password: string
): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  let res: Response;
  try {
    res = await apiFetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (error) {
    console.warn("authLogin: backend indisponible, mode dev-token", error);
    return {
      access_token: "dev-token",
      token_type: "bearer",
    };
  }
  const data = (await res.json().catch(() => ({}))) as {
    detail?: string | unknown;
  } & Partial<TokenResponse>;
  if (!res.ok) {
    const msg =
      detailToMessage(data.detail) || `Connexion ${res.status}`;
    throw new Error(msg);
  }
  if (!data.access_token) {
    throw new Error("Réponse de connexion invalide");
  }
  return data as TokenResponse;
}

export type RegisterPayload = {
  email: string;
  password: string;
  full_name?: string;
  phone_number?: string;
  role?: string;
  location?: string;
};

function mapRegisterRoleToBackend(role?: string): "farmer" | "company" | "client" {
  const x = (role || "farmer").toLowerCase().trim();
  if (x === "farmer" || x === "agriculteur") return "farmer";
  if (x === "investor" || x === "investisseur") return "company";
  if (x === "pro" || x === "professionnel") return "company";
  if (x === "client" || x === "acheteur" || x === "client_occident") return "client";
  return "farmer";
}

export async function authRegister(payload: RegisterPayload): Promise<TokenResponse> {
  const fullName = (payload.full_name ?? "").trim().slice(0, 200);
  const res = await apiFetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
      full_name: fullName,
      role: mapRegisterRoleToBackend(payload.role),
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: string | unknown;
  } & Partial<TokenResponse>;
  if (!res.ok) {
    const msg = detailToMessage(data.detail) || `Inscription ${res.status}`;
    throw new Error(msg);
  }
  if (!data.access_token) {
    throw new Error("Réponse d’inscription invalide");
  }
  return data as TokenResponse;
}

export async function fetchCurrentUser(token: string): Promise<ApiUser> {
  if (token === "dev-token") {
    return {
      id: "00000000-0000-0000-0000-000000000001",
      email: "demo@agroconnect.local",
      full_name: "Utilisateur Démo",
      role: "farmer",
      location: "Local",
      phone_number: "",
      is_active: true,
      country_code: "CI",
    };
  }
  const res = await apiFetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: string | unknown;
    id?: string;
    email?: string;
    full_name?: string;
    role?: string;
    country_code?: string | null;
    phone_number?: string | null;
    location?: string | null;
    image_url?: string | null;
  };
  if (!res.ok) {
    const msg = detailToMessage(data.detail) || `Profil ${res.status}`;
    throw new Error(msg);
  }
  return {
    id: data.id != null ? String(data.id) : "",
    email: String(data.email ?? ""),
    full_name: data.full_name ?? null,
    role: String(data.role ?? "farmer"),
    location: data.location ?? null,
    phone_number: data.phone_number ?? null,
    is_active: true,
    image_url: data.image_url ?? null,
    country_code: data.country_code ?? null,
  };
}

export type ProfilePatch = {
  full_name?: string;
  phone_number?: string;
  location?: string;
  country_code?: string;
  image_url?: string;
};

export async function updateUserProfile(
  token: string,
  patch: ProfilePatch
): Promise<ApiUser> {
  const res = await apiFetch(`${API_BASE_URL}/api/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: unknown;
    id?: string;
    email?: string;
    full_name?: string;
    role?: string;
    country_code?: string | null;
    phone_number?: string | null;
    location?: string | null;
    image_url?: string | null;
  };
  if (!res.ok) {
    throw new Error(detailToMessage(data.detail) || `Profil ${res.status}`);
  }
  return {
    id: data.id != null ? String(data.id) : "",
    email: String(data.email ?? ""),
    full_name: data.full_name ?? null,
    role: String(data.role ?? "farmer"),
    location: data.location ?? null,
    phone_number: data.phone_number ?? null,
    is_active: true,
    image_url: data.image_url ?? null,
    country_code: data.country_code ?? null,
  };
}

/** Photo de profil — POST /api/auth/upload-avatar */
export async function uploadProfileAvatar(
  token: string,
  fileUri: string
): Promise<string> {
  const form = new FormData();
  const name = fileUri.split("/").pop() || "avatar.jpg";
  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "jpg";
  const mime =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  form.append(
    "file",
    {
      uri: fileUri,
      name: `avatar.${ext || "jpg"}`,
      type: mime,
    } as unknown as Blob
  );
  const res = await apiFetch(`${API_BASE_URL}/api/auth/upload-avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: unknown;
    url?: string;
  };
  if (!res.ok) {
    throw new Error(detailToMessage(data.detail) || `Avatar ${res.status}`);
  }
  if (!data.url) throw new Error("Réponse avatar invalide");
  return data.url;
}

export function productImageUrl(
  imageUrl: string | null | undefined
): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${API_BASE_URL}${path}`;
}

/** Produit marketplace MVP — POST /api/marketplace/products */
export type MvpProductCreate = {
  title: string;
  description?: string;
  category?: string;
  price_cents: number;
  currency?: string;
  quantity?: number;
  origin_country?: string | null;
  image_url?: string | null;
};

export type MvpProductOut = {
  id: string;
  seller_id: string;
  seller_name?: string | null;
  title: string;
  description: string;
  category: string;
  price_cents: number;
  currency: string;
  quantity: number;
  origin_country?: string | null;
  image_url?: string | null;
};

/** Image locale (file://) — POST /api/marketplace/upload-image */
export async function uploadAgroImage(token: string, fileUri: string): Promise<string> {
  const form = new FormData();
  const name = fileUri.split("/").pop() || "photo.jpg";
  const ext = name.includes(".") ? name.split(".").pop()?.toLowerCase() : "jpg";
  const mime =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  form.append(
    "file",
    {
      uri: fileUri,
      name: `upload.${ext || "jpg"}`,
      type: mime,
    } as unknown as Blob
  );
  const res = await apiFetch(`${API_BASE_URL}/api/marketplace/upload-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: unknown;
    url?: string;
  };
  if (!res.ok) {
    throw new Error(detailToMessage(data.detail) || `Upload ${res.status}`);
  }
  if (!data.url) {
    throw new Error("Réponse upload invalide");
  }
  return data.url;
}

export async function createMvpMarketplaceProduct(
  token: string,
  body: MvpProductCreate
): Promise<MvpProductOut> {
  const res = await apiFetch(`${API_BASE_URL}/api/marketplace/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: body.title,
      description: body.description ?? "",
      category: body.category ?? "recoltes",
      price_cents: body.price_cents,
      currency: body.currency ?? "XOF",
      quantity: body.quantity ?? 1,
      origin_country: body.origin_country ?? "CI",
      image_url: body.image_url ?? null,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: unknown;
  } & Partial<MvpProductOut>;
  if (!res.ok) {
    throw new Error(detailToMessage(data.detail) || `Produit ${res.status}`);
  }
  return data as MvpProductOut;
}

export type ApiProduct = {
  id: string;
  owner_id: string;
  seller_name?: string | null;
  name: string;
  variety?: string | null;
  quantity: number;
  unit: string;
  price_per_unit?: number | null;
  location?: string | null;
  description?: string | null;
  status: string;
  image_url?: string | null;
  created_at?: string;
  category?: string;
  currency?: string;
};

function mapMvpProductToApi(p: MvpProductOut): ApiProduct {
  return {
    id: String(p.id),
    owner_id: String(p.seller_id),
    seller_name: p.seller_name ?? null,
    name: p.title,
    variety: null,
    quantity: p.quantity,
    unit: "lot",
    price_per_unit: p.price_cents / 100,
    location: p.origin_country ?? null,
    description: p.description ?? null,
    status: "active",
    image_url: p.image_url ?? null,
    category: p.category,
    currency: p.currency,
  };
}

/** Liste produits — GET /api/marketplace/products */
export async function fetchProducts(
  skip = 0,
  limit = 80,
  search?: string
): Promise<ApiProduct[]> {
  const q = new URLSearchParams();
  q.set("limit", String(limit));
  const res = await apiFetch(
    `${API_BASE_URL}/api/marketplace/products?${q.toString()}`
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Produits ${res.status}`);
  }
  const raw = (await res.json()) as MvpProductOut[];
  let list = Array.isArray(raw) ? raw.map(mapMvpProductToApi) : [];
  const s = search?.trim().toLowerCase();
  if (s) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.description && p.description.toLowerCase().includes(s)) ||
        (p.category && p.category.toLowerCase().includes(s))
    );
  }
  return list.slice(skip);
}

/** Détail — GET /api/marketplace/products/{uuid} */
export async function fetchProduct(productId: string): Promise<ApiProduct> {
  const res = await apiFetch(
    `${API_BASE_URL}/api/marketplace/products/${encodeURIComponent(productId)}`
  );
  const data = (await res.json().catch(() => ({}))) as {
    detail?: string;
  } & Partial<MvpProductOut>;
  if (!res.ok) {
    throw new Error(
      (typeof data.detail === "string" && data.detail) || `Produit ${res.status}`
    );
  }
  return mapMvpProductToApi(data as MvpProductOut);
}

/** Commande multi-lignes — POST /api/marketplace/orders */
export async function placeMarketplaceOrder(
  token: string,
  lines: { product_id: string; quantity: number }[]
): Promise<{ id: string; status: string; total_cents: number; currency: string }> {
  const res = await apiFetch(`${API_BASE_URL}/api/marketplace/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      lines: lines.map((l) => ({
        product_id: l.product_id,
        quantity: l.quantity,
      })),
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: unknown;
    id?: string;
    status?: string;
    total_cents?: number;
    currency?: string;
  };
  if (!res.ok) {
    throw new Error(detailToMessage(data.detail) || `Commande ${res.status}`);
  }
  return data as {
    id: string;
    status: string;
    total_cents: number;
    currency: string;
  };
}

/** Réservation service (terrain / matériel) — POST /api/marketplace/reservations */
export type ServiceReservationOut = {
  id: string;
  title: string;
  total_cents: number;
  currency: string;
  status: string;
  notes: string;
  created_at: string;
};

export async function placeServiceReservation(
  token: string,
  body: { title: string; total_cents: number; currency?: string; notes?: string }
): Promise<ServiceReservationOut> {
  const res = await apiFetch(`${API_BASE_URL}/api/marketplace/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: body.title,
      total_cents: body.total_cents,
      currency: body.currency ?? "XOF",
      notes: body.notes ?? "",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: unknown;
  } & Partial<ServiceReservationOut>;
  if (!res.ok) {
    throw new Error(detailToMessage(data.detail) || `Réservation ${res.status}`);
  }
  return data as ServiceReservationOut;
}

/** Mes réservations enregistrées serveur — GET /api/marketplace/reservations/me */
export async function fetchMyServiceReservations(
  token: string,
  limit = 40
): Promise<ServiceReservationOut[]> {
  const res = await apiFetch(
    `${API_BASE_URL}/api/marketplace/reservations/me?limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const d = data as { detail?: unknown };
    throw new Error(detailToMessage(d.detail) || `Réservations ${res.status}`);
  }
  return Array.isArray(data) ? (data as ServiceReservationOut[]) : [];
}

/** Mes commandes marketplace — GET /api/marketplace/orders/me */
export type MarketplaceOrderRow = {
  id: string;
  status: string;
  total_cents: number;
  currency: string;
  created_at: string;
  line_count: number;
};

/** Ligne commande — GET /api/marketplace/orders/me/detailed */
export type MarketplaceOrderLineDetail = {
  product_id: string;
  product_title: string;
  seller_id: string;
  seller_name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

export type MarketplaceOrderDetail = {
  id: string;
  status: string;
  total_cents: number;
  currency: string;
  created_at: string;
  line_count: number;
  lines: MarketplaceOrderLineDetail[];
};

/** Commandes acheteur avec produits et vendeurs — GET /api/marketplace/orders/me/detailed */
export async function fetchMyMarketplaceOrdersDetailed(
  token: string,
  limit = 50
): Promise<MarketplaceOrderDetail[]> {
  const res = await apiFetch(
    `${API_BASE_URL}/api/marketplace/orders/me/detailed?limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Commandes détail ${res.status}`);
  }
  return res.json() as Promise<MarketplaceOrderDetail[]>;
}

export async function fetchMyMarketplaceOrders(
  token: string,
  limit = 50
): Promise<MarketplaceOrderRow[]> {
  const res = await apiFetch(
    `${API_BASE_URL}/api/marketplace/orders/me?limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Commandes ${res.status}`);
  }
  return res.json() as Promise<MarketplaceOrderRow[]>;
}

/** Ventes vendeur — GET /api/marketplace/orders/sales (montant = part vendeur sur la commande). */
export async function fetchMySellerSales(
  token: string,
  limit = 50
): Promise<MarketplaceOrderRow[]> {
  const res = await apiFetch(
    `${API_BASE_URL}/api/marketplace/orders/sales?limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Ventes ${res.status}`);
  }
  return res.json() as Promise<MarketplaceOrderRow[]>;
}

export type ApiOrder = {
  id: number;
  buyer_id: number;
  product_id: number;
  quantity_ordered: number;
  total_price: number;
  status: string;
  created_at: string;
  product?: ApiProduct | null;
};

export async function createOrder(
  token: string,
  productId: number,
  quantity: number
): Promise<ApiOrder> {
  const res = await apiFetch(apiV1("/orders/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: string | unknown;
  } & Partial<ApiOrder>;
  if (!res.ok) {
    const d = data.detail;
    const msg =
      typeof d === "string"
        ? d
        : d != null
          ? JSON.stringify(d)
          : `Commande ${res.status}`;
    throw new Error(msg);
  }
  return data as ApiOrder;
}

export async function fetchMyOrders(token: string): Promise<ApiOrder[]> {
  const res = await apiFetch(apiV1("/orders/my-orders"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Commandes ${res.status}`);
  }
  return res.json() as Promise<ApiOrder[]>;
}

export type ConversationSummary = {
  other_user_id: number;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

export async function fetchConversations(
  token: string
): Promise<ConversationSummary[]> {
  const res = await apiFetch(`${API_BASE_URL}/api/messages/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return [];
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Conversations ${res.status}`);
  }
  return res.json() as Promise<ConversationSummary[]>;
}

export type ApiMessage = {
  id: number;
  sender_id: number;
  receiver_id: number;
  product_id?: number | null;
  content: string;
  is_read: boolean;
  created_at: string;
};

export async function fetchConversationMessages(
  token: string,
  otherUserId: number
): Promise<ApiMessage[]> {
  const res = await apiFetch(
    `${API_BASE_URL}/api/messages/conversation/${otherUserId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (res.status === 404) return [];
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Messages ${res.status}`);
  }
  return res.json() as Promise<ApiMessage[]>;
}

export async function sendApiMessage(
  token: string,
  receiverId: number,
  content: string,
  productId?: number | null
): Promise<ApiMessage> {
  const res = await apiFetch(`${API_BASE_URL}/api/messages/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      receiver_id: receiverId,
      content,
      product_id: productId ?? null,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: string | unknown;
  } & Partial<ApiMessage>;
  if (!res.ok) {
    const d = data.detail;
    const msg =
      typeof d === "string"
        ? d
        : d != null
          ? JSON.stringify(d)
          : `Envoi message ${res.status}`;
    throw new Error(msg);
  }
  return data as ApiMessage;
}

export type V1AnthropicChatResponse = {
  reply: string;
  suggestions: string[];
};

export async function sendV1AnthropicChat(
  token: string,
  message: string
): Promise<V1AnthropicChatResponse> {
  const res = await apiFetch(apiV1("/chat/message"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    detail?: string | unknown;
  } & Partial<V1AnthropicChatResponse>;
  if (!res.ok) {
    const d = data.detail;
    const msg =
      typeof d === "string"
        ? d
        : d != null
          ? JSON.stringify(d)
          : `Chat IA ${res.status}`;
    throw new Error(msg);
  }
  return data as V1AnthropicChatResponse;
}
