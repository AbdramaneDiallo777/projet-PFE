import { Image } from "react-native";
import { productImageUrl } from "@/lib/agroconnectApi";

/** Préfixe stocké dans `photos_urls` (JSON) pour une image locale liée à la culture. */
export const BUNDLED_CULTURE_PREFIX = "bundled-culture:";

const DEFAULT_FIELD = require("../assets/images/parcel2.jpg");

/** Correspondance culture (libellé carte) → visuel représentatif. */
const ASSET_BY_NORMALIZED_KEY: Record<string, number> = {
  cacao: require("../assets/images/parcel1.jpg"),
  maïs: require("../assets/images/i5.jpg"),
  mais: require("../assets/images/i5.jpg"),
  riz: require("../assets/images/recolte.jpg"),
  arachide: require("../assets/images/i4.jpg"),
  coton: require("../assets/images/parcel2.jpg"),
  manioc: require("../assets/images/i3.jpg"),
  igname: require("../assets/images/i2.jpg"),
  soja: require("../assets/images/i6.jpg"),
};

export function normalizeCultureKey(culture: string): string {
  return culture
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function assetModuleForCulture(culture: string): number {
  const k = normalizeCultureKey(culture);
  return ASSET_BY_NORMALIZED_KEY[k] ?? DEFAULT_FIELD;
}

/** URI file:// utilisable dans <Image source={{ uri }} /> */
export function uriForCulture(culture: string): string {
  const mod = assetModuleForCulture(culture);
  return Image.resolveAssetSource(mod).uri;
}

/** Valeur à enregistrer dans `photos_urls` (chaîne JSON) à la création / mise à jour culture. */
export function photosUrlsJsonForCulture(culture: string): string {
  const c = culture.trim();
  if (!c) return "[]";
  return JSON.stringify([`${BUNDLED_CULTURE_PREFIX}${c}`]);
}

/**
 * Première URL affichable : uploads serveur, marqueur bundled-culture, ou repli sur la culture renseignée.
 */
export function resolveParcelPreviewUri(
  photos_urls: string | null | undefined,
  cultureFallback?: string | null
): string | null {
  if (photos_urls?.trim()) {
    try {
      const parsed = JSON.parse(photos_urls) as unknown;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item !== "string" || !item.trim()) continue;
          if (item.startsWith(BUNDLED_CULTURE_PREFIX)) {
            const label = item.slice(BUNDLED_CULTURE_PREFIX.length);
            if (label.trim()) return uriForCulture(label);
            continue;
          }
          if (item.startsWith("http")) return item;
          const u = productImageUrl(item);
          if (u) return u;
        }
      }
    } catch {
      const t = photos_urls.trim();
      if (t.startsWith("http")) return t;
      const u = productImageUrl(t);
      if (u) return u;
    }
  }
  if (cultureFallback?.trim()) return uriForCulture(cultureFallback);
  return null;
}

/** Met à jour les photos par défaut quand la culture change (garde les URLs serveur /uploads/). */
export function mergePhotosUrlsOnCultureChange(
  previousPhotosUrls: string | null | undefined,
  newCulture: string
): string {
  const c = newCulture.trim();
  if (!c) return previousPhotosUrls?.trim() ?? "[]";
  let keptUploads: string[] = [];
  try {
    const parsed = JSON.parse(previousPhotosUrls ?? "[]") as unknown;
    if (Array.isArray(parsed)) {
      keptUploads = parsed.filter(
        (x): x is string =>
          typeof x === "string" &&
          (x.includes("/uploads/") || x.startsWith("http"))
      );
    }
  } catch {
    /* ignore */
  }
  const cultureMarker = `${BUNDLED_CULTURE_PREFIX}${c}`;
  const next = [cultureMarker, ...keptUploads];
  return JSON.stringify(next);
}
