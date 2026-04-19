/**
 * Affichage cohérent du profil connecté (nom, avatar, sous-titre).
 */
import { productImageUrl, type ApiUser } from "@/lib/agroconnectApi";

export const DEFAULT_USER_AVATAR = require("../assets/images/p1.jpg");

export function userFirstName(user: ApiUser | null): string {
  if (!user) return "";
  const full = user.full_name?.trim();
  if (full) return full.split(/\s+/)[0] ?? full;
  return user.email?.split("@")[0] ?? "";
}

/** Nom complet ou partie locale de l’email */
export function userDisplayName(
  user: ApiUser | null,
  fallback = "Agriculteur"
): string {
  if (!user) return fallback;
  const full = user.full_name?.trim();
  if (full) return full;
  return user.email?.split("@")[0] ?? fallback;
}

/** Ligne d’accueil : « Salut » ou « Salut, Prénom » */
export function greetingLine(isReady: boolean, user: ApiUser | null): string {
  if (!isReady) return "Salut";
  if (!user) return "Salut";
  const first = userFirstName(user);
  return first ? `Salut, ${first}` : "Salut";
}

/** Sous-titre profil : lieu • rôle (sans reprendre l’email ; évite les doublons si l’email est affiché à part) */
export function userLocationAndRole(user: ApiUser | null): string {
  if (!user) return "—";
  const loc = user.location?.trim();
  const rl = user.role?.trim() ? userRoleLabel(user) : "";
  if (loc && rl) return `${loc} • ${rl}`;
  if (loc) return loc;
  if (rl) return rl;
  return "—";
}

const ROLE_LABELS: Record<string, string> = {
  farmer: "Agriculteur",
  agriculteur: "Agriculteur",
  company: "Entreprise / investisseur",
  vendeur: "Vendeur",
  acheteur: "Acheteur",
  client: "Client acheteur",
  admin: "Administrateur",
  logistics: "Logistique",
};

/** Compte « Occident » : commandes + carte, sans outils producteur. */
export function isClientBuyer(user: ApiUser | null | undefined): boolean {
  return user?.role?.toLowerCase() === "client";
}

export function userRoleLabel(user: ApiUser | null): string {
  if (!user?.role) return "Membre";
  return ROLE_LABELS[user.role.toLowerCase()] ?? user.role;
}

/** Source d’image pour <Image source={…} /> */
export function userAvatarSource(
  user: ApiUser | null
): typeof DEFAULT_USER_AVATAR | { uri: string } {
  const uri = user?.image_url ? productImageUrl(user.image_url) : null;
  if (uri) return { uri };
  return DEFAULT_USER_AVATAR;
}
