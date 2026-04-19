import type { ApiProduct } from '@/lib/agroconnectApi';

export type MarketplaceSegment = 'all' | 'recoltes' | 'semences' | 'materiel' | 'services';

const SEMENCES_KEYS = /semence|graine|seed|maïs|mais|riz|blé|ble|soja|engrais bio|bio/i;
const RECOLTES_KEYS = /fruit|légume|legume|avocat|mangue|poivron|oignon|manioc|igname|récolte|recolte|frais|tomate/i;
const MATERIEL_KEYS = /tracteur|charrue|moisson|pulvé|pulve|pompe|irrigation|outil|matériel|materiel|john deere|kubota/i;
const SERVICES_KEYS = /service|formation|conseil|livraison|transport|terrain|louer|location|irrigation|gps/i;

export function inferSegmentFromText(name: string, description?: string | null): MarketplaceSegment | null {
    const t = `${name} ${description ?? ''}`.toLowerCase();
    if (SEMENCES_KEYS.test(t)) return 'semences';
    if (MATERIEL_KEYS.test(t)) return 'materiel';
    if (SERVICES_KEYS.test(t)) return 'services';
    if (RECOLTES_KEYS.test(t)) return 'recoltes';
    return null;
}

export function productMatchesSegment(p: ApiProduct, segment: MarketplaceSegment): boolean {
    if (segment === 'all') return true;
    const inferred = inferSegmentFromText(p.name, p.description);
    if (inferred === segment) return true;
    if (segment === 'recoltes') {
        return inferred === null || inferred === 'recoltes';
    }
    return inferred === segment;
}

export function scoreSearchMatch(query: string, p: ApiProduct): number {
    const q = query.trim().toLowerCase();
    if (!q) return 1;
    const hay = `${p.name} ${p.variety ?? ''} ${p.description ?? ''} ${p.location ?? ''}`.toLowerCase();
    if (hay.includes(q)) return 10;
    const parts = q.split(/\s+/).filter(Boolean);
    let s = 0;
    for (const w of parts) {
        if (hay.includes(w)) s += 3;
    }
    return s;
}

export function sortBySearchRelevance(products: ApiProduct[], query: string): ApiProduct[] {
    const q = query.trim();
    if (!q) return products;
    return [...products].sort(
        (a, b) => scoreSearchMatch(q, b) - scoreSearchMatch(q, a)
    );
}
