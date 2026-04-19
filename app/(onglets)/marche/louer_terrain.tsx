import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import {
    fetchParcellesSync,
    type ParcelleSyncRow,
} from '@/lib/agroconnectApi';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_WIDTH = 500;
/** Réserve pour la barre d’onglets `(onglets)` — même logique que panier / profil. */
const TAB_BAR_RESERVE = 88;

type TerrainListing = {
    id: string;
    name: string;
    region: string;
    hectares: number;
    soil: string;
    /** 0 = non renseigné côté base (affichage « à convenir ») */
    pricePerHaMonth: number;
    /** Approximation affichage (démo si pas de géoloc client) */
    distanceKm: number;
    culture?: string;
};

const SOIL_OPTIONS = ['Tous', 'Limoneux', 'Argileux', 'Sablonneux', 'Lateritique'] as const;

/** Secours si l’API parcelles est injoignable. */
const MOCK_TERRAINS: TerrainListing[] = [
    { id: '1', name: 'Vallée Teranga — riz & maraîchage', region: 'Kaolack', hectares: 4.5, soil: 'Limoneux', pricePerHaMonth: 82000, distanceKm: 8 },
    { id: '2', name: 'Plateau cacao ombragé', region: 'Abidjan', hectares: 2, soil: 'Argileux', pricePerHaMonth: 95000, distanceKm: 15 },
    {
        id: '4',
        name: 'Colline arachide & cultures associées',
        region: 'Korhogo',
        hectares: 3.5,
        soil: 'Sablonneux',
        pricePerHaMonth: 71000,
        distanceKm: 35,
        culture: 'Arachide',
    },
    { id: '5', name: 'Parcelle coton — rotation', region: 'Odienné', hectares: 8, soil: 'Lateritique', pricePerHaMonth: 65000, distanceKm: 42 },
    { id: '6', name: 'Jachère régénérée', region: 'Kaolack', hectares: 12, soil: 'Limoneux', pricePerHaMonth: 58000, distanceKm: 11 },
];

type Scored = TerrainListing & { score: number };

type PrefsSnapshot = {
    region: string;
    hectares: number;
    maxPrice: number | null;
    soil: string;
    durationMonths: number;
};

function parseSurfaceHa(surface: string | undefined | null): number {
    if (!surface) return 1;
    const m = String(surface).replace(',', '.').match(/[\d.]+/);
    if (!m) return 1;
    const n = parseFloat(m[0]);
    return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Parcelles dont le statut indique une mise en location. */
function isLouable(statutLocation: string): boolean {
    const s = statutLocation.toLowerCase();
    return s.includes('lou') || s.includes('location') || s === 'a_louer' || s === 'à_louer';
}

function normalizeSoilLabel(qualite: string | undefined | null): string {
    const q = (qualite ?? '').trim();
    if (!q) return '—';
    const x = q.toLowerCase();
    if (x.includes('limon')) return 'Limoneux';
    if (x.includes('argil')) return 'Argileux';
    if (x.includes('sabl')) return 'Sablonneux';
    if (x.includes('later')) return 'Lateritique';
    return q;
}

function soilFuzzyMatch(listingSoil: string, pref: string): boolean {
    if (pref === 'Tous') return true;
    const a = listingSoil.toLowerCase();
    const b = pref.toLowerCase();
    if (a === '—') return false;
    return a.includes(b) || b.includes(a);
}

function parcelleRowToTerrain(row: ParcelleSyncRow): TerrainListing {
    return {
        id: row.id_local,
        name: row.nom?.trim() || row.lieu || 'Parcelle',
        region: row.lieu?.trim() || '—',
        hectares: parseSurfaceHa(row.surface),
        soil: normalizeSoilLabel(row.qualite_sol),
        pricePerHaMonth: 0,
        distanceKm: 10,
        culture: row.culture?.trim() || undefined,
    };
}

function scoreTerrain(
    t: TerrainListing,
    prefs: Pick<PrefsSnapshot, 'region' | 'hectares' | 'maxPrice' | 'soil'>
): number {
    let s = 72;
    const haWant = Math.max(0.1, prefs.hectares);
    const haDiff = Math.abs(t.hectares - haWant) / haWant;
    s += Math.max(0, 28 - haDiff * 40);

    if (prefs.maxPrice != null && t.pricePerHaMonth > 0) {
        if (t.pricePerHaMonth <= prefs.maxPrice) {
            s += 12;
        } else {
            s -= 25;
        }
    }

    const reg = prefs.region.trim().toLowerCase();
    if (reg.length >= 2) {
        if (t.region.toLowerCase().includes(reg) || t.name.toLowerCase().includes(reg)) {
            s += 18;
        } else {
            s -= 5;
        }
    }

    if (prefs.soil !== 'Tous' && soilFuzzyMatch(t.soil, prefs.soil)) {
        s += 14;
    }

    s += Math.max(0, 15 - t.distanceKm / 5);

    return Math.max(0, Math.min(100, Math.round(s)));
}

export default function RentLandScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const CONTAINER_WIDTH = Math.min(windowWidth, MAX_WIDTH);
    const bottomPad = TAB_BAR_RESERVE + Math.max(insets.bottom, 8);

    const [region, setRegion] = useState('');
    const [hectares, setHectares] = useState('3');
    const [duration, setDuration] = useState(6);
    const [maxPrice, setMaxPrice] = useState('');
    const [soil, setSoil] = useState<(typeof SOIL_OPTIONS)[number]>('Tous');
    const [hasSearched, setHasSearched] = useState(false);

    /** Parcelles « à louer » issues de GET /api/parcelles/sync (ou secours démo si erreur réseau). */
    const [listingsForRent, setListingsForRent] = useState<TerrainListing[]>([]);
    const [parcellesReady, setParcellesReady] = useState(false);
    const [loadingParcelles, setLoadingParcelles] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const COLORS = {
        primary: '#065F46',
        accent: '#10B981',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        text: '#0F172A',
        textMuted: '#64748B',
        border: '#F1F5F9',
        outerBg: '#F1F5F9',
    };

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-Medium': PlusJakartaSans_500Medium,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    const prefs = useMemo(() => {
        const ha = parseFloat(hectares.replace(',', '.')) || 1;
        const mp = maxPrice.trim().replace(/\s/g, '');
        const maxP = mp ? parseInt(mp, 10) : null;
        return {
            region,
            hectares: ha,
            maxPrice: maxP != null && !Number.isNaN(maxP) ? maxP : null,
            soil,
        };
    }, [region, hectares, maxPrice, soil]);

    /** Critères figés au clic « Rechercher » (pas le tri à chaque frappe). */
    const [frozenPrefs, setFrozenPrefs] = useState<PrefsSnapshot | null>(null);

    const loadParcelles = useCallback(async () => {
        setLoadingParcelles(true);
        setLoadError(null);
        setParcellesReady(false);
        try {
            const { parcelles } = await fetchParcellesSync();
            const louables = parcelles.filter((p) => isLouable(p.statut_location));
            setListingsForRent(louables.map(parcelleRowToTerrain));
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setLoadError(msg);
            setListingsForRent(MOCK_TERRAINS);
        } finally {
            setParcellesReady(true);
            setLoadingParcelles(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadParcelles();
        }, [loadParcelles])
    );

    const results = useMemo((): Scored[] => {
        if (!frozenPrefs || !parcellesReady) return [];
        const scored = listingsForRent.map((t) => ({
            ...t,
            score: scoreTerrain(t, frozenPrefs),
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored;
    }, [frozenPrefs, listingsForRent, parcellesReady]);

    const runSearch = useCallback(() => {
        setFrozenPrefs({
            ...prefs,
            durationMonths: duration,
        });
        setHasSearched(true);
    }, [prefs, duration]);

    if (!fontsLoaded) return null;

    return (
        <View style={[styles.outerContainer, { backgroundColor: COLORS.outerBg }]}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                style={[styles.flex, { width: CONTAINER_WIDTH, alignSelf: 'center' }]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.innerContainer, { backgroundColor: COLORS.background }]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Feather name="arrow-left" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Location de terrain</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 28 }]}
                    >
                        <View style={styles.intro}>
                            <MaterialCommunityIcons name="map-search" size={28} color={COLORS.primary} />
                            <Text style={styles.introTitle}>Trouvez le terrain le plus adapté</Text>
                            <Text style={styles.introSub}>
                                Les offres proviennent des parcelles enregistrées sur le serveur dont le statut
                                indique une location (voir champ « statut_location » en base). Saisissez vos
                                critères puis lancez la recherche : tri par score de correspondance.
                            </Text>
                        </View>

                        {loadingParcelles ? (
                            <View style={styles.apiRow}>
                                <ActivityIndicator color={COLORS.primary} />
                                <Text style={styles.apiMuted}>Chargement des parcelles…</Text>
                            </View>
                        ) : loadError ? (
                            <View style={styles.warnBanner}>
                                <Ionicons name="warning-outline" size={18} color="#B45309" />
                                <Text style={styles.warnText}>
                                    Connexion API impossible — affichage des exemples hors base. ({loadError})
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.apiOk}>
                                {listingsForRent.length} parcelle
                                {listingsForRent.length > 1 ? 's' : ''} à louer dans la base
                                {listingsForRent.length === 0
                                    ? ' — ajoutez des parcelles avec statut « à louer » ou vérifiez PostgreSQL.'
                                    : ''}
                            </Text>
                        )}

                        <Text style={styles.sectionTitle}>Région ou ville souhaitée</Text>
                        <TextInput
                            style={styles.textField}
                            placeholder="ex. Kaolack, Abidjan…"
                            placeholderTextColor={COLORS.textMuted}
                            value={region}
                            onChangeText={setRegion}
                            autoCapitalize="words"
                        />

                        <Text style={styles.sectionTitle}>Superficie visée (ha)</Text>
                        <View style={styles.inputWrapper}>
                            <MaterialCommunityIcons name="arrow-expand-all" size={20} color={COLORS.primary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                keyboardType="decimal-pad"
                                value={hectares}
                                onChangeText={setHectares}
                                placeholder="ex. 3,5"
                            />
                        </View>

                        <Text style={styles.sectionTitle}>Durée du bail</Text>
                        <View style={styles.durationContainer}>
                            {[1, 3, 6, 12].map((m) => (
                                <TouchableOpacity
                                    key={m}
                                    onPress={() => setDuration(m)}
                                    style={[
                                        styles.durationChip,
                                        duration === m && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                                    ]}
                                >
                                    <Text style={[styles.durationText, duration === m && { color: 'white' }]}>{m} m</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.sectionTitle}>Budget max (CFA / ha / mois)</Text>
                        <TextInput
                            style={styles.textField}
                            placeholder="Optionnel — ex. 85000"
                            placeholderTextColor={COLORS.textMuted}
                            value={maxPrice}
                            onChangeText={setMaxPrice}
                            keyboardType="number-pad"
                        />

                        <Text style={styles.sectionTitle}>Type de sol préféré</Text>
                        <View style={styles.soilRow}>
                            {SOIL_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={() => setSoil(opt)}
                                    style={[
                                        styles.soilChip,
                                        soil === opt && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                                    ]}
                                >
                                    <Text
                                        style={[styles.soilChipText, soil === opt && { color: '#fff' }]}
                                        numberOfLines={1}
                                    >
                                        {opt}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.searchBtnWrap, (!parcellesReady || loadingParcelles) && { opacity: 0.55 }]}
                            activeOpacity={0.9}
                            onPress={runSearch}
                            disabled={!parcellesReady || loadingParcelles}
                        >
                            <LinearGradient
                                colors={[COLORS.accent, COLORS.primary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.searchBtn}
                            >
                                <Ionicons name="search" size={22} color="#fff" />
                                <Text style={styles.searchBtnText}>Rechercher les terrains</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {hasSearched && frozenPrefs ? (
                            <View style={styles.resultsBlock}>
                                <Text style={styles.resultsTitle}>Résultats (tri par correspondance)</Text>
                                <Text style={styles.resultsSummary}>
                                    {frozenPrefs.region.trim() || 'Région libre'} · {frozenPrefs.hectares} ha · bail{' '}
                                    {frozenPrefs.durationMonths} mois
                                    {frozenPrefs.maxPrice != null
                                        ? ` · max ${frozenPrefs.maxPrice.toLocaleString('fr-FR')} CFA/ha/mois`
                                        : ''}{' '}
                                    · sol {frozenPrefs.soil}
                                </Text>
                                {results.length === 0 ? (
                                    <View style={styles.emptyResults}>
                                        <Text style={styles.emptyResultsText}>
                                            Aucun terrain ne correspond à vos critères, ou aucune parcelle « à louer »
                                            n’est disponible. Élargissez la région ou la surface, ou vérifiez les données
                                            côté serveur.
                                        </Text>
                                    </View>
                                ) : (
                                    results.map((t) => (
                                    <View key={t.id} style={styles.resultCard}>
                                        <View style={styles.resultTop}>
                                            <View style={styles.scoreBadge}>
                                                <Text style={styles.scoreText}>{t.score}%</Text>
                                            </View>
                                            <Text style={styles.matchLabel}>correspondance</Text>
                                        </View>
                                        <Text style={styles.resultName}>{t.name}</Text>
                                        <Text style={styles.resultMeta}>
                                            {t.region} · {t.hectares.toFixed(1)} ha · {t.soil}
                                            {t.culture ? ` · ${t.culture}` : ''}
                                        </Text>
                                        <Text style={styles.resultPrice}>
                                            {t.pricePerHaMonth > 0
                                                ? `${t.pricePerHaMonth.toLocaleString('fr-FR')} CFA/ha/mois`
                                                : 'Loyer : à convenir (non renseigné en base)'}
                                            {` · ~${t.distanceKm} km`}
                                        </Text>
                                        <View style={styles.resultActions}>
                                            <TouchableOpacity
                                                style={styles.secondaryBtn}
                                                onPress={() =>
                                                    router.push({
                                                        pathname: '/marche/reserver',
                                                        params: { title: `Terrain · ${t.name}` },
                                                    })
                                                }
                                            >
                                                <Text style={styles.secondaryBtnText}>Visite / réservation</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.primaryMini}
                                                onPress={() => router.push('/tableau-de-bord/maps')}
                                            >
                                                <Text style={styles.primaryMiniText}>Carte</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    ))
                                )}
                            </View>
                        ) : (
                            <View style={styles.hintBox}>
                                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.hintText}>
                                    Renseignez vos critères puis lancez la recherche pour voir les terrains les plus proches
                                    de votre profil.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, alignItems: 'center' },
    flex: { flex: 1, width: '100%' },
    innerContainer: { flex: 1, overflow: 'hidden', width: '100%', maxWidth: MAX_WIDTH },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    headerTitle: { fontSize: 17, fontFamily: 'PJS-ExtraBold', color: '#0F172A' },

    scrollContent: { padding: 20, paddingTop: 8 },

    intro: {
        backgroundColor: '#ECFDF5',
        padding: 16,
        borderRadius: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    introTitle: { fontFamily: 'PJS-Bold', fontSize: 17, color: '#065F46', marginTop: 10 },
    introSub: { fontFamily: 'PJS-Medium', fontSize: 13, color: '#64748B', marginTop: 8, lineHeight: 19 },

    apiRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    apiMuted: { fontFamily: 'PJS-Medium', fontSize: 13, color: '#64748B' },
    apiOk: {
        fontFamily: 'PJS-SemiBold',
        fontSize: 13,
        color: '#065F46',
        marginBottom: 16,
        lineHeight: 18,
    },
    warnBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 14,
        padding: 12,
        marginBottom: 16,
    },
    warnText: { flex: 1, fontFamily: 'PJS-Medium', fontSize: 12, color: '#92400E', lineHeight: 17 },

    sectionTitle: { fontSize: 14, fontFamily: 'PJS-ExtraBold', color: '#0F172A', marginBottom: 10, marginTop: 6 },

    textField: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontFamily: 'PJS-Medium',
        fontSize: 15,
        color: '#0F172A',
        marginBottom: 14,
    },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        paddingHorizontal: 15,
        marginBottom: 14,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, height: 52, fontFamily: 'PJS-Bold', fontSize: 16, color: '#065F46' },

    durationContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, gap: 6 },
    durationChip: {
        flex: 1,
        minWidth: 0,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationText: { fontSize: 13, fontFamily: 'PJS-Bold', color: '#64748B' },

    soilRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
    soilChip: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    soilChipText: { fontFamily: 'PJS-SemiBold', fontSize: 12, color: '#475569' },

    searchBtnWrap: { marginTop: 4, marginBottom: 8, borderRadius: 18, overflow: 'hidden', elevation: 4 },
    searchBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    searchBtnText: { color: 'white', fontSize: 16, fontFamily: 'PJS-ExtraBold' },

    resultsBlock: { marginTop: 20 },
    resultsTitle: { fontFamily: 'PJS-Bold', fontSize: 16, color: '#0F172A', marginBottom: 6 },
    resultsSummary: {
        fontFamily: 'PJS-Medium',
        fontSize: 12,
        color: '#64748B',
        marginBottom: 14,
        lineHeight: 17,
    },

    resultCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    resultTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    scoreBadge: {
        backgroundColor: '#065F46',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    scoreText: { fontFamily: 'PJS-ExtraBold', fontSize: 13, color: '#fff' },
    matchLabel: { fontFamily: 'PJS-Medium', fontSize: 12, color: '#94A3B8' },
    resultName: { fontFamily: 'PJS-Bold', fontSize: 16, color: '#0F172A' },
    resultMeta: { fontFamily: 'PJS-Medium', fontSize: 13, color: '#64748B', marginTop: 4 },
    resultPrice: { fontFamily: 'PJS-SemiBold', fontSize: 13, color: '#065F46', marginTop: 8 },

    resultActions: { flexDirection: 'row', marginTop: 14, gap: 10 },
    secondaryBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    secondaryBtnText: { fontFamily: 'PJS-Bold', fontSize: 13, color: '#0F172A' },
    primaryMini: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
    },
    primaryMiniText: { fontFamily: 'PJS-Bold', fontSize: 13, color: '#065F46' },

    hintBox: { flexDirection: 'row', gap: 10, marginTop: 16, padding: 14, backgroundColor: '#F8FAFC', borderRadius: 14 },
    hintText: { flex: 1, fontFamily: 'PJS-Medium', fontSize: 13, color: '#64748B', lineHeight: 19 },

    emptyResults: {
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    emptyResultsText: { fontFamily: 'PJS-Medium', fontSize: 13, color: '#64748B', lineHeight: 19 },
});
