import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MarketplaceOrderDetail, MarketplaceOrderLineDetail } from '@/lib/agroconnectApi';

const KEY = '@AgroConnect/local_buyer_transactions_v1';

/** Copie locale d’un achat (complète l’API ou remplace si pas de commande serveur). */
export type StoredBuyerTransaction = {
  id: string;
  kind?: 'marketplace' | 'reservation';
  /** UUID commande marketplace si enregistrée côté serveur */
  server_order_id?: string;
  created_at: string;
  total_cents: number;
  currency: string;
  amount_label: string;
  status: string;
  lines: {
    product_id: string;
    product_title: string;
    seller_name: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
  }[];
};

function newId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function loadStoredBuyerTransactions(): Promise<StoredBuyerTransaction[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p as StoredBuyerTransaction[];
  } catch {
    return [];
  }
}

export async function appendStoredBuyerTransaction(
  tx: Omit<StoredBuyerTransaction, 'id'> & { id?: string }
): Promise<void> {
  const prev = await loadStoredBuyerTransactions();
  const id = tx.id ?? newId();
  const next = [{ ...tx, id }, ...prev].slice(0, 150);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export function storedToOrderDetail(s: StoredBuyerTransaction): MarketplaceOrderDetail {
  const lines: MarketplaceOrderLineDetail[] = s.lines.map((l) => ({
    product_id: l.product_id,
    product_title: l.product_title,
    seller_id: '',
    seller_name: l.seller_name || '—',
    quantity: l.quantity,
    unit_price_cents: l.unit_price_cents,
    line_total_cents: l.line_total_cents,
  }));
  return {
    id: s.server_order_id ?? s.id,
    status: s.status,
    total_cents: s.total_cents,
    currency: s.currency,
    created_at: s.created_at,
    line_count: lines.length,
    lines,
  };
}

/** Fusionne API + locales : pas de doublon si `server_order_id` déjà présent dans l’API. */
export function mergeBuyerOrdersWithLocal(
  apiOrders: MarketplaceOrderDetail[],
  stored: StoredBuyerTransaction[]
): MarketplaceOrderDetail[] {
  const apiIds = new Set(apiOrders.map((o) => o.id));
  const fromLocal = stored
    .filter((s) => {
      if (s.server_order_id && apiIds.has(s.server_order_id)) return false;
      const syntheticId = s.server_order_id ?? s.id;
      if (apiIds.has(syntheticId)) return false;
      return true;
    })
    .map(storedToOrderDetail);
  const combined = [...apiOrders, ...fromLocal];
  combined.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return combined;
}

/** Identifiants de commandes fusionnées correspondant à une réservation (historique acheteur). */
export function reservationOrderIdsFromStored(stored: StoredBuyerTransaction[]): Set<string> {
  return new Set(
    stored
      .filter(
        (s) =>
          s.kind === 'reservation' ||
          (s.lines[0]?.product_title?.startsWith('Réservation') ?? false)
      )
      .map((s) => s.server_order_id ?? s.id)
  );
}
