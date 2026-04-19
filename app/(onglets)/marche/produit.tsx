import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchProducts, productImageUrl, type ApiProduct } from '@/lib/agroconnectApi';
import {
    type MarketplaceSegment,
    productMatchesSegment,
    sortBySearchRelevance,
} from '@/lib/marketplaceSearch';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';

// Import de la police Inter
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    useFonts,
} from '@expo-google-fonts/inter';

const MAX_WIDTH = 500;

const PRODUCTS_DATA = [
    { id: '1', name: 'Avocats Hass', price: '4.00', unit: 'kg', origin: 'KENYA', isBio: true, isLocal: false, image: require('../../../assets/images/i1.jpg') },
    { id: '2', name: 'Poivrons Rouges', price: '2.50', unit: 'kg', origin: 'NIGERIA', isBio: false, isLocal: true, image: require('../../../assets/images/i2.jpg') },
    { id: '3', name: 'Mangues Douces', price: '3.00', unit: 'pc', origin: 'S. AFRICA', isBio: true, isLocal: false, image: require('../../../assets/images/i3.jpg') },
    { id: '4', name: 'Oignons Rouges', price: '1.80', unit: 'kg', origin: 'ÉGYPTE', isBio: false, isLocal: true, image: require('../../../assets/images/i4.jpg') },
    { id: '5', name: 'Maïs Jaune', price: '1.20', unit: 'pc', origin: 'MALI', isBio: true, isLocal: true, image: require('../../../assets/images/i5.jpg') },
    { id: '6', name: 'Brocoli Bio', price: '3.50', unit: 'kg', origin: 'MAROC', isBio: true, isLocal: false, image: require('../../../assets/images/i6.jpg') },
];

const FAMILY_FILTERS = ['Tous types', 'Fruits', 'Légumes', 'Graines', 'Tubercules'] as const;

function matchesProductFamily(name: string, family: (typeof FAMILY_FILTERS)[number]): boolean {
    if (family === 'Tous types') return true;
    const n = name.toLowerCase();
    if (family === 'Fruits') {
        return /avocat|mangue|fruit|pomme|banane|orange|citron|papaye|ananas/i.test(n);
    }
    if (family === 'Légumes') {
        return /poivron|oignon|brocoli|tomate|légume|legume|salade|carotte|courgette|chou/i.test(n);
    }
    if (family === 'Graines') {
        return /maïs|mais|riz|soja|graine|semence|sésame|sesame/i.test(n);
    }
    if (family === 'Tubercules') {
        return /manioc|igname|patate|taro|gombo/i.test(n);
    }
    return true;
}

export default function MarketplacePage() {
    const { q: qParam, segment: segParam } = useLocalSearchParams<{ q?: string; segment?: string }>();
    const [activeFamily, setActiveFamily] = useState<(typeof FAMILY_FILTERS)[number]>('Tous types');
    const [filterBio, setFilterBio] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [apiRows, setApiRows] = useState<ApiProduct[]>([]);
    const [segment, setSegment] = useState<MarketplaceSegment>('all');
    const router = useRouter();

    useEffect(() => {
        const s = typeof qParam === 'string' ? qParam : Array.isArray(qParam) ? qParam[0] : '';
        if (s) setSearchQuery(s);
        const seg = typeof segParam === 'string' ? segParam : Array.isArray(segParam) ? segParam[0] : '';
        if (seg === 'recoltes' || seg === 'semences' || seg === 'materiel' || seg === 'services' || seg === 'all') {
            setSegment(seg);
        }
    }, [qParam, segParam]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(searchQuery.trim()), 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => {
        let alive = true;
        fetchProducts(0, 80, debouncedQ || undefined)
            .then((list) => {
                if (alive) setApiRows(list);
            })
            .catch(() => {
                if (alive) setApiRows([]);
            });
        return () => {
            alive = false;
        };
    }, [debouncedQ]);

    const listData = useMemo(() => {
        const fromApi = sortBySearchRelevance(
            apiRows.filter((p) => productMatchesSegment(p, segment)),
            searchQuery
        );
        const mapped = fromApi
            .filter((p) => matchesProductFamily(p.name, activeFamily))
            .map((p) => ({
                id: `api-${p.id}`,
                name: p.name,
                price: String(p.price_per_unit ?? '—'),
                unit: p.unit,
                origin: p.location || '—',
                isBio: /bio/i.test(p.name + (p.description || '')),
                isLocal: false,
                image: productImageUrl(p.image_url)
                    ? { uri: productImageUrl(p.image_url)! }
                    : PRODUCTS_DATA[0].image,
                productId: p.id,
            }));
        const mockFiltered =
            segment === 'materiel' || segment === 'services'
                ? []
                : PRODUCTS_DATA.filter((row) => {
                      const hay = `${row.name} ${row.origin}`.toLowerCase();
                      if (debouncedQ && !hay.includes(debouncedQ.toLowerCase())) return false;
                      if (filterBio && !row.isBio) return false;
                      if (!matchesProductFamily(row.name, activeFamily)) return false;
                      return true;
                  }).map((row) => ({ ...row, productId: undefined as string | undefined }));
        return [...mapped, ...mockFiltered];
    }, [apiRows, segment, searchQuery, debouncedQ, filterBio, activeFamily]);

    // Thème CLAIR fixé
    const COLORS = {
        primary: '#156f51',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        textDark: '#0F172A',
        textMuted: '#64748B',
        white: '#FFFFFF',
        border: '#F1F5F9',
        outerContainer: '#EDF2F7',
    };

    // Chargement de la police Inter
    let [fontsLoaded] = useFonts({
        'Inter-Regular': Inter_400Regular,
        'Inter-Medium': Inter_500Medium,
        'Inter-SemiBold': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
    });
    
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH, MAX_WIDTH);
    const COLUMN_WIDTH = (CONTAINER_WIDTH - 52) / 2;

    const toggleFavorite = (id: string) => {
        setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };

    if (!fontsLoaded) return null;

    const renderProduct = ({
        item,
    }: {
        item: (typeof PRODUCTS_DATA)[0] & { productId?: string };
    }) => {
        const isFav = favorites.includes(item.id);
        const detailId =
            item.productId != null && item.productId !== ''
                ? String(item.productId)
                : String(item.id).replace(/^api-/, '');
        return (
            <TouchableOpacity 
                style={[styles.productCard, { width: COLUMN_WIDTH, backgroundColor: COLORS.white }]}
                activeOpacity={0.95}
                onPress={() => router.push(`/marche/product/${detailId}`)}
            >
                <View style={[styles.imageContainer, { backgroundColor: '#F1F5F9' }]}>
                    <Image source={item.image} style={styles.productImage} />
                    
                    <View style={styles.originBadge}>
                        <Text style={[styles.originText, { color: COLORS.textDark }]}>{item.origin}</Text>
                    </View>
                    
                    {item.isBio && (
                        <View style={styles.bioTag}>
                            <MaterialCommunityIcons name="leaf" size={10} color="white" />
                            <Text style={styles.bioTagText}>BIO</Text>
                        </View>
                    )}

                    <TouchableOpacity 
                        style={styles.favCircle} 
                        onPress={() => toggleFavorite(item.id)}
                    >
                        <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#EF4444" : COLORS.textDark} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: COLORS.textDark }]} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceText}>{item.price}€</Text>
                        <Text style={[styles.unitText, { color: COLORS.textMuted }]}>/{item.unit}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.outerContainer, { backgroundColor: COLORS.outerContainer }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: COLORS.background }]}>
                <SafeAreaView style={styles.flex}>
                    
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: COLORS.white }]}>
                            <Feather name="chevron-left" size={24} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <View style={styles.titleWrapper}>
                            <Text style={[styles.headerTitle, { color: COLORS.textDark }]}>Récoltes & produits</Text>
                            <View style={styles.onlineDot} />
                        </View>
                        <TouchableOpacity 
                            style={[styles.headerBtn, { backgroundColor: COLORS.white }]}
                            onPress={() => router.push('/marche/panier')}
                        >
                            <Feather name="shopping-cart" size={20} color={COLORS.textDark} />
                            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
                        </TouchableOpacity>
                    </View>

                    {/* Barre de recherche */}
                    <View style={styles.actionRow}>
                        <View style={[styles.searchBar, { backgroundColor: COLORS.surface }]}>
                            <Feather name="search" size={18} color={COLORS.textMuted} />
                            <TextInput 
                                placeholder="Rechercher (nom, origine)…" 
                                style={[styles.input, { color: COLORS.textDark }]}
                                placeholderTextColor={COLORS.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <TouchableOpacity style={styles.filterBtn}>
                            <MaterialCommunityIcons name="tune-variant" size={22} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.filterBlock}>
                        <Text style={styles.filterHeading}>Origine du catalogue</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.scrollGap}
                            keyboardShouldPersistTaps="handled"
                        >
                            {(
                                [
                                    ['all', 'Tout'],
                                    ['recoltes', 'Récoltes'],
                                    ['semences', 'Semences'],
                                ] as const
                            ).map(([key, label]) => (
                                <TouchableOpacity
                                    key={key}
                                    onPress={() => setSegment(key)}
                                    style={[
                                        styles.catChip,
                                        { backgroundColor: COLORS.surface, borderColor: COLORS.border },
                                        segment === key && styles.catChipActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.catText,
                                            { color: COLORS.textMuted },
                                            segment === key && styles.catTextActive,
                                        ]}
                                    >
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                onPress={() => router.push('/marche/materiel')}
                                style={[styles.catChip, styles.chipLinkMuted]}
                            >
                                <Text style={[styles.catText, { color: '#0f172a' }]}>Matériel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push('/marche/services')}
                                style={[styles.catChip, styles.chipLinkBlue]}
                            >
                                <Text style={[styles.catText, { color: '#1d4ed8' }]}>Services</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        <Text style={[styles.filterHeading, styles.filterHeadingSpaced]}>Famille de produit</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.scrollGap}
                            keyboardShouldPersistTaps="handled"
                        >
                            {FAMILY_FILTERS.map((fam) => (
                                <TouchableOpacity
                                    key={fam}
                                    onPress={() => setActiveFamily(fam)}
                                    style={[
                                        styles.catChip,
                                        { backgroundColor: COLORS.surface, borderColor: COLORS.border },
                                        activeFamily === fam && styles.catChipActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.catText,
                                            { color: COLORS.textMuted },
                                            activeFamily === fam && styles.catTextActive,
                                        ]}
                                    >
                                        {fam}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <View style={[styles.vDivider, { backgroundColor: '#E2E8F0' }]} />
                            <TouchableOpacity
                                onPress={() => setFilterBio(!filterBio)}
                                style={[
                                    styles.pillFilter,
                                    { backgroundColor: COLORS.surface, borderColor: COLORS.border },
                                    filterBio && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                                ]}
                            >
                                <MaterialCommunityIcons name="leaf" size={14} color={filterBio ? 'white' : COLORS.primary} />
                                <Text style={[styles.pillText, { color: COLORS.textDark }, filterBio && { color: 'white' }]}>
                                    Bio
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    <FlatList
                        data={listData}
                        renderItem={renderProduct}
                        keyExtractor={(item) => String(item.id)}
                        ListEmptyComponent={
                            segment === 'materiel' ? (
                                <Text style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>
                                    Le matériel se gère sur l’espace dédié (tracteurs, location).
                                </Text>
                            ) : segment === 'services' ? (
                                <Text style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>
                                    Les services se réservent depuis l’écran Services.
                                </Text>
                            ) : null
                        }
                        numColumns={2}
                        contentContainerStyle={styles.listContent}
                        columnWrapperStyle={styles.columnGap}
                        showsVerticalScrollIndicator={false}
                    />

                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, alignItems: 'center' },
    innerContainer: { flex: 1 },
    flex: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 10
    },
    headerBtn: { 
        width: 44, 
        height: 44, 
        borderRadius: 14, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5
    },
    titleWrapper: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontFamily: 'Inter-Bold', letterSpacing: -0.5 },
    onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#156f51', marginLeft: 5 },
    badge: { 
        position: 'absolute', 
        top: 8, 
        right: 8, 
        backgroundColor: '#18bd86', 
        borderRadius: 10, 
        minWidth: 18, 
        height: 18, 
        justifyContent: 'center', 
        alignItems: 'center', 
        borderWidth: 2, 
        borderColor: 'white' 
    },
    badgeText: { color: 'white', fontSize: 9, fontFamily: 'Inter-Bold' },
    actionRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 15, gap: 12 },
    searchBar: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderRadius: 16, 
        paddingHorizontal: 15, 
        height: 52,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    input: { flex: 1, marginLeft: 10, fontSize: 15, fontFamily: 'Inter-Medium' },
    filterBtn: { 
        width: 52, 
        height: 52, 
        backgroundColor: '#156f51', 
        borderRadius: 16, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    filterBlock: {
        paddingHorizontal: 20,
        marginTop: 8,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEF2F6',
    },
    filterHeading: {
        fontSize: 11,
        fontFamily: 'Inter-Bold',
        color: '#64748B',
        letterSpacing: 0.6,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    filterHeadingSpaced: { marginTop: 14 },
    chipLinkMuted: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
    chipLinkBlue: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
    scrollGap: { gap: 8, paddingRight: 8, alignItems: 'center' },
    catChip: { 
        paddingHorizontal: 18, 
        paddingVertical: 10, 
        borderRadius: 100, 
        borderWidth: 1, 
    },
    catChipActive: { backgroundColor: '#156f51', borderColor: '#156f51' },
    catText: { fontSize: 13, fontFamily: 'Inter-SemiBold' },
    catTextActive: { color: 'white' },
    vDivider: { width: 1, height: 20, alignSelf: 'center', marginHorizontal: 4 },
    pillFilter: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 14, 
        paddingVertical: 10, 
        borderRadius: 12, 
        gap: 6, 
        borderWidth: 1, 
    },
    pillText: { fontSize: 13, fontFamily: 'Inter-SemiBold' },
    listContent: { paddingBottom: 30, paddingHorizontal: 20 }, 
    columnGap: { justifyContent: 'space-between' },
    productCard: { 
        borderRadius: 24, 
        marginBottom: 16, 
        padding: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    imageContainer: { height: 160, width: '100%', borderRadius: 18, overflow: 'hidden' },
    productImage: { width: '100%', height: '100%' },
    originBadge: { 
        position: 'absolute', 
        top: 8, 
        left: 8, 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.85)'
    },
    originText: { fontSize: 8, fontFamily: 'Inter-Bold', textTransform: 'uppercase' },
    bioTag: { 
        position: 'absolute', 
        bottom: 8, 
        left: 8, 
        backgroundColor: '#156f51', 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 6, 
        gap: 3 
    },
    bioTagText: { color: 'white', fontSize: 8, fontFamily: 'Inter-Bold' },
    favCircle: { 
        position: 'absolute', 
        top: 8, 
        right: 8, 
        width: 32, 
        height: 32, 
        borderRadius: 10, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'white',
        elevation: 2
    },
    productInfo: { paddingVertical: 12, paddingHorizontal: 4 },
    productName: { fontSize: 15, fontFamily: 'Inter-SemiBold', marginBottom: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline' },
    priceText: { color: '#156f51', fontFamily: 'Inter-Bold', fontSize: 17 },
    unitText: { fontSize: 11, fontFamily: 'Inter-Medium', marginLeft: 2 },
});