import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImageSourcePropType } from 'react-native';

const CART_KEY = '@AgroConnect/cart_lines_v1';

/** Ligne sérialisable (pas de `require` / ImageSource). */
export type PersistedCartLine = {
    id: string;
    name: string;
    price: number;
    qty: number;
    detail?: string;
    /** Images locales catalogue démo i1…i6 */
    imageSlot?: 1 | 2 | 3 | 4 | 5 | 6;
    imageUri?: string;
};

const SLOT_TO_MODULE: Record<number, ImageSourcePropType> = {
    1: require('../assets/images/i1.jpg'),
    2: require('../assets/images/i2.jpg'),
    3: require('../assets/images/i3.jpg'),
    4: require('../assets/images/i4.jpg'),
    5: require('../assets/images/i5.jpg'),
    6: require('../assets/images/i6.jpg'),
};

export function hydrateImage(p: PersistedCartLine): ImageSourcePropType {
    if (p.imageUri) return { uri: p.imageUri };
    const slot = p.imageSlot ?? 1;
    return SLOT_TO_MODULE[slot] ?? SLOT_TO_MODULE[1];
}

/** Slot image 1–6 pour un id produit démo (fiche locale). */
export function imageSlotFromMockProductId(id: string): 1 | 2 | 3 | 4 | 5 | 6 {
    const n = Number(id);
    if (n >= 1 && n <= 6) return n as 1 | 2 | 3 | 4 | 5 | 6;
    return 1;
}

export async function loadCartFromStorage(): Promise<PersistedCartLine[] | null> {
    try {
        const raw = await AsyncStorage.getItem(CART_KEY);
        if (raw == null) return null;
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return null;
        return parsed as PersistedCartLine[];
    } catch {
        return null;
    }
}

export async function saveCartToStorage(lines: PersistedCartLine[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    /* ignore */
  }
}

export async function clearCartStorage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CART_KEY);
  } catch {
    /* ignore */
  }
}

/** Même logique que le récapitulatif panier (sous-total + TVA 5 % + logistique). */
export function computeCartTotalEuros(lines: PersistedCartLine[] | null | undefined): number {
  const list = lines ?? [];
  const subtotal = list.reduce((acc, l) => acc + l.price * l.qty, 0);
  const tax = subtotal * 0.05;
  const units = list.reduce((a, l) => a + l.qty, 0);
  const logistics = 15 + Math.max(0, units - 3) * 2;
  return subtotal + tax + logistics;
}

export async function addOrMergeCartLine(line: PersistedCartLine): Promise<void> {
    const prev = (await loadCartFromStorage()) ?? [];
    const i = prev.findIndex((l) => l.id === line.id);
    if (i >= 0) {
        const merged = [...prev];
        merged[i] = { ...merged[i], qty: merged[i].qty + line.qty };
        await saveCartToStorage(merged);
    } else {
        await saveCartToStorage([...prev, line]);
    }
}
