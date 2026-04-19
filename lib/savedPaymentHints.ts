/**
 * Indices de paiement mémorisés localement (SecureStore) — pas de numéro de carte complet (PCI).
 * Titulaire, 4 derniers chiffres, date d’expiration pour préremplir le formulaire.
 */
import * as SecureStore from 'expo-secure-store';

const KEY = 'agroconnect_saved_payment_hints_v1';

export type SavedPaymentHints = {
  cardHolder: string;
  cardLast4: string;
  expiry: string;
};

export async function loadSavedPaymentHints(): Promise<SavedPaymentHints | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<SavedPaymentHints>;
    if (!p.cardHolder?.trim() && !p.cardLast4?.trim() && !p.expiry?.trim()) return null;
    return {
      cardHolder: String(p.cardHolder ?? '').trim(),
      cardLast4: String(p.cardLast4 ?? '').replace(/\D/g, '').slice(0, 4),
      expiry: String(p.expiry ?? '').trim(),
    };
  } catch {
    return null;
  }
}

export async function saveSavedPaymentHints(h: SavedPaymentHints): Promise<void> {
  const payload: SavedPaymentHints = {
    cardHolder: h.cardHolder.trim(),
    cardLast4: h.cardLast4.replace(/\D/g, '').slice(0, 4),
    expiry: h.expiry.trim(),
  };
  await SecureStore.setItemAsync(KEY, JSON.stringify(payload));
}

export async function clearSavedPaymentHints(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* */
  }
}
