import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchProducts, productImageUrl, type ApiProduct } from '@/lib/agroconnectApi';
import {
    type MarketplaceSegment,
    productMatchesSegment,
    sortBySearchRelevance,
} from '@/lib/marketplaceSearch';
import { useAuth } from '@/contexts/AuthContext';
import { isClientBuyer, userAvatarSource } from '@/lib/userDisplay';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MessageSquareText, Receipt, Search, ShoppingBag, SlidersHorizontal, Star, Zap } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ImageBackground,
    ImageSourcePropType,
    Keyboard,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

const MAX_WIDTH = 480;
const GREEN_PRIMARY = '#065F46'; 

// Assets
const PROMO_BG = require('../../../assets/images/parcel1.jpg'); 
const CAT_RECOLTE = require('../../../assets/images/recolte.jpg'); 
const CAT_MATERIEL = require('../../../assets/images/T1.jpg'); 
const CAT_BETAL = require('../../../assets/images/parcel1.jpg');
const CAT_SEMENCES = require('../../../assets/images/recolte.jpg');

const SEGMENT_CHIPS: { key: MarketplaceSegment; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'recoltes', label: 'Récoltes' },
    { key: 'semences', label: 'Semences' },
    { key: 'materiel', label: 'Matériel' },
    { key: 'services', label: 'Services' },
];

export default function MarketplaceAgroConnect() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const CONTAINER_WIDTH = useMemo(() => Math.min(SCREEN_WIDTH, MAX_WIDTH), [SCREEN_WIDTH]);
    const router = useRouter();
    const params = useLocalSearchParams<{ q?: string | string[] }>();
    const { user } = useAuth();
    const navAvatarSrc = userAvatarSource(user);
    /** Producteur connecté : pas de parcours acheteur (panier / historique). */
    const isFarmerAccount = !!user && !isClientBuyer(user);
    const showBuyerShortcuts = !isFarmerAccount;
    const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [segment, setSegment] = useState<MarketplaceSegment>('all');
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        const raw = params.q;
        const fromDash = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
        if (fromDash.trim()) setSearchInput(fromDash.trim());
    }, [params.q]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        let alive = true;
        setLoadingProducts(true);
        fetchProducts(0, 60, debouncedSearch || undefined)
            .then((list) => {
                if (alive) setApiProducts(list);
            })
            .catch(() => {
                if (alive) setApiProducts([]);
            })
            .finally(() => {
                if (alive) setLoadingProducts(false);
            });
        return () => {
            alive = false;
        };
    }, [debouncedSearch]);

    const filteredProducts = useMemo(() => {
        const bySeg = apiProducts.filter((p) => productMatchesSegment(p, segment));
        return sortBySearchRelevance(bySeg, searchInput);
    }, [apiProducts, segment, searchInput]);

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    // Ne bloque pas l'écran si la police custom tarde à charger via tunnel.

    return (
        <View style={styles.outerContainer}>
            <StatusBar barStyle="dark-content" />
            
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH }]}>
                
                {/* --- TOP NAVBAR --- */}
                <SafeAreaView style={styles.topNavSafe}>
                    <View style={styles.topNav}>
                        <TouchableOpacity onPress={() => router.push('/tableau-de-bord/profil')} style={styles.avatarCircle}>
                            <Image source={navAvatarSrc} style={styles.navAvatar} />
                        </TouchableOpacity>
                        <View style={styles.navTitleCenter}>
                            <Text style={styles.navBrand}>AGRO IA</Text>
                            <Text style={styles.navPageTitle}>Marketplace</Text>
                        </View>
                        {showBuyerShortcuts ? (
                            <>
                                <TouchableOpacity
                                    style={styles.navHistory}
                                    onPress={() => router.push('/marche/historique-transactions')}
                                    accessibilityLabel="Historique des commandes"
                                >
                                    <Receipt color={GREEN_PRIMARY} size={22} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.navCart} onPress={() => router.push('/marche/panier')}>
                                    <ShoppingBag color={GREEN_PRIMARY} size={24} />
                                    <View style={styles.cartBadge} />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.navFarmerActions}>
                                <TouchableOpacity
                                    style={styles.navHistory}
                                    onPress={() => router.push('/marche/historique-transactions')}
                                    accessibilityLabel="Mes ventes"
                                >
                                    <Receipt color={GREEN_PRIMARY} size={22} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.navHistory}
                                    onPress={() => router.push('/tableau-de-bord/assistant')}
                                    accessibilityLabel="Agrobot — conseil agricole"
                                >
                                    <MessageSquareText color={GREEN_PRIMARY} size={22} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </SafeAreaView>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    
                    {/* --- RECHERCHE (API + filtre local) --- */}
                    <View style={styles.searchSection}>
                        <View style={styles.searchBar}>
                            <Search color="#94a3b8" size={20} />
                            <TextInput
                                placeholder="Recherche : cacao, tracteur, semences bio…"
                                style={styles.searchInput}
                                placeholderTextColor="#94a3b8"
                                value={searchInput}
                                onChangeText={setSearchInput}
                                returnKeyType="search"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />
                            {loadingProducts ? (
                                <ActivityIndicator size="small" color={GREEN_PRIMARY} />
                            ) : null}
                        </View>
                        <TouchableOpacity
                            style={styles.filterBtn}
                            onPress={() =>
                                router.push({
                                    pathname: '/marche/produit',
                                    params: { q: debouncedSearch, segment },
                                })
                            }
                        >
                            <SlidersHorizontal color="white" size={20} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.segmentRow}
                    >
                        {SEGMENT_CHIPS.map(({ key, label }) => (
                            <TouchableOpacity
                                key={key}
                                style={[styles.segmentChip, segment === key && styles.segmentChipActive]}
                                onPress={() => setSegment(key)}
                            >
                                <Text style={[styles.segmentChipText, segment === key && styles.segmentChipTextActive]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {searchInput.length > 0 ? (
                        <Text style={styles.searchHint}>
                            {filteredProducts.length} résultat(s) — appuyez sur un article pour commander (récoltes) ou ouvrir le détail.
                        </Text>
                    ) : null}

                    {/* --- BANNIÈRE PROMO --- */}
                    <View style={styles.promoContainer}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.promoTouchable}
                            onPress={() => router.push('/marche/semences')}
                        >
                            <ImageBackground 
                                source={PROMO_BG} 
                                style={styles.promoImageBackground}
                                resizeMode="cover"
                                imageStyle={{ borderRadius: 28 }}
                            >
                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.promoGradient}>
                                    <View style={styles.promoBadge}>
                                        <Zap size={12} color="#FACC15" fill="#FACC15" />
                                        <Text style={styles.promoBadgeText}>OFFRE FLASH</Text>
                                    </View>
                                    <Text style={styles.promoTitle}>-20% sur les semences</Text>
                                    <Text style={styles.promoSub}>Qualité certifiée pour vos sols</Text>
                                </LinearGradient>
                            </ImageBackground>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Parcourir par usage</Text>
                    <Text style={styles.sectionSub}>
                        Chaque espace a un rôle : commander des récoltes, des semences, louer du matériel ou réserver un service.
                    </Text>
                    <View style={styles.bentoGrid}>
                        <View style={styles.bentoCol}>
                            <CategoryCard
                                title="Récoltes"
                                subtitle="Commander au kg"
                                img={CAT_RECOLTE}
                                size="large"
                                onPress={() => router.push({ pathname: '/marche/produit', params: { segment: 'recoltes' } })}
                            />
                        </View>
                        <View style={styles.bentoCol}>
                            <CategoryCard
                                title="Matériel"
                                subtitle="Tracteurs & outils"
                                img={CAT_MATERIEL}
                                size="small"
                                onPress={() => router.push('/marche/materiel')}
                            />
                            <CategoryCard
                                title="Services"
                                subtitle="Terrain, conseil…"
                                img={CAT_BETAL}
                                size="small"
                                onPress={() => router.push('/marche/services')}
                            />
                        </View>
                    </View>
                    <View style={styles.twoColRow}>
                        <View style={styles.twoColCell}>
                            <CategoryCard
                                title="Semences bio"
                                subtitle="Graines certifiées"
                                img={CAT_SEMENCES}
                                size="small"
                                onPress={() => router.push('/marche/semences')}
                            />
                        </View>
                        <View style={styles.twoColCell}>
                            <CategoryCard
                                title="Catalogue complet"
                                subtitle="Tout le marché"
                                img={CAT_MATERIEL}
                                size="small"
                                onPress={() => router.push('/marche/produit')}
                            />
                        </View>
                    </View>
                    {/* --- PRODUITS RÉCENTS --- */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Nouveautés</Text>
                        <TouchableOpacity
                            onPress={() =>
                                router.push({
                                    pathname: '/marche/produit',
                                    params: { q: debouncedSearch },
                                })
                            }
                        >
                            <Text style={styles.seeAll}>Voir tout</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalProducts}>
                        {filteredProducts.length > 0
                            ? filteredProducts.slice(0, 14).map((p) => {
                                  const uri = productImageUrl(p.image_url);
                                  const imgSource: ImageSourcePropType = uri
                                      ? { uri }
                                      : CAT_RECOLTE;
                                  return (
                                      <ProductCard
                                          key={p.id}
                                          name={p.name}
                                          price={`${p.price_per_unit ?? '—'} / ${p.unit}`}
                                          rating="—"
                                          imgSource={imgSource}
                                          onPress={() => router.push(`/marche/product/${p.id}`)}
                                      />
                                  );
                              })
                            : (
                                  <>
                                      <ProductCard
                                          name="Tracteur Pro"
                                          price="12M CFA"
                                          rating="4.9"
                                          imgSource={CAT_MATERIEL}
                                          onPress={() => router.push('/marche/product/1')}
                                      />
                                      <ProductCard
                                          name="Semences Bio"
                                          price="15k CFA"
                                          rating="4.5"
                                          imgSource={CAT_RECOLTE}
                                          onPress={() => router.push('/marche/product/2')}
                                      />
                                  </>
                              )}
                    </ScrollView>

                    <View style={{ height: 24 }} />
                </ScrollView>

            </View>
        </View>
    );
}

const CategoryCard = ({
    title,
    subtitle,
    img,
    size,
    onPress,
}: {
    title: string;
    subtitle?: string;
    img: ImageSourcePropType;
    size: 'large' | 'small';
    onPress: () => void;
}) => (
    <View style={[styles.catCardWrapper, size === 'large' ? { height: 220 } : { height: 105 }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.92}>
            <ImageBackground source={img} style={styles.fullImg} resizeMode="cover" imageStyle={{ borderRadius: 22 }}>
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={styles.catGradient}>
                    <Text style={styles.catTitle}>{title}</Text>
                    {subtitle ? <Text style={styles.catSubtitle}>{subtitle}</Text> : null}
                </LinearGradient>
            </ImageBackground>
        </TouchableOpacity>
    </View>
);

const ProductCard = ({
    name,
    price,
    rating,
    imgSource,
    onPress,
}: {
    name: string;
    price: string;
    rating: string;
    imgSource: ImageSourcePropType;
    onPress: () => void;
}) => (
    <TouchableOpacity style={styles.pCard} onPress={onPress}>
        <Image source={imgSource} style={styles.pImg} resizeMode="cover" />
        <View style={styles.pInfo}>
            <Text style={styles.pName} numberOfLines={1}>{name}</Text>
            <View style={styles.pPriceRow}>
                <Text style={styles.pPrice}>{price}</Text>
                <View style={styles.pRating}>
                    <Star size={12} color="#FACC15" fill="#FACC15" />
                    <Text style={styles.pRatingText}>{rating}</Text>
                </View>
            </View>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center' },
    innerContainer: { flex: 1, backgroundColor: '#FFFFFF', overflow: 'visible' },
    topNavSafe: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    topNav: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
    avatarCircle: { width: 40, height: 40, borderRadius: 12, overflow: 'hidden' },
    navAvatar: { width: '100%', height: '100%' },
    navTitleCenter: { alignItems: 'center' },
    navBrand: { fontFamily: 'PJS-ExtraBold', fontSize: 10, color: '#065F46', letterSpacing: 1.5 },
    navPageTitle: { fontFamily: 'PJS-Bold', fontSize: 18, color: '#0F172A' },
    navFarmerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    navHistory: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    navCart: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
    cartBadge: { position: 'absolute', top: 8, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'white' },
    scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 },
    segmentRow: { paddingHorizontal: 4, gap: 8, marginBottom: 12, flexDirection: 'row' },
    segmentChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    segmentChipActive: { backgroundColor: '#065F46', borderColor: '#065F46' },
    segmentChipText: { fontFamily: 'PJS-SemiBold', fontSize: 12, color: '#64748B' },
    segmentChipTextActive: { color: '#FFFFFF' },
    searchHint: {
        fontFamily: 'PJS-Medium',
        fontSize: 12,
        color: '#64748B',
        marginBottom: 12,
        lineHeight: 18,
    },
    sectionSub: {
        fontFamily: 'PJS-Medium',
        fontSize: 13,
        color: '#64748B',
        marginTop: -8,
        marginBottom: 16,
        lineHeight: 20,
    },
    twoColRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
    twoColCell: { flex: 1 },
    searchSection: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    searchBar: { flex: 1, height: 56, backgroundColor: '#F8FAFC', borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
    searchInput: { flex: 1, fontFamily: 'PJS-SemiBold', fontSize: 14, color: '#0F172A' },
    filterBtn: { width: 56, height: 56, backgroundColor: GREEN_PRIMARY, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    promoContainer: { width: '100%', height: 190, marginBottom: 30, borderRadius: 28, overflow: 'hidden', alignSelf: 'center' },
    promoTouchable: { flex: 1 },
    promoImageBackground: { flex: 1, width: '100%' },
    promoGradient: { flex: 1, padding: 24, justifyContent: 'flex-end' },
    promoBadge: { backgroundColor: 'white', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
    promoBadgeText: { fontFamily: 'PJS-ExtraBold', fontSize: 9, color: GREEN_PRIMARY },
    promoTitle: { fontFamily: 'PJS-ExtraBold', fontSize: 22, color: 'white' },
    promoSub: { fontFamily: 'PJS-Regular', fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    sectionTitle: { fontFamily: 'PJS-ExtraBold', fontSize: 20, color: '#0F172A', marginBottom: 15 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
    seeAll: { fontFamily: 'PJS-Bold', fontSize: 14, color: '#065F46' },
    bentoGrid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    bentoCol: { flex: 1, gap: 15 },
    catCardWrapper: { width: '100%', borderRadius: 22, overflow: 'hidden' },
    fullImg: { flex: 1, width: '100%' },
    catGradient: { flex: 1, padding: 15, justifyContent: 'flex-end' },
    catTitle: { fontFamily: 'PJS-Bold', fontSize: 16, color: 'white' },
    catSubtitle: { fontFamily: 'PJS-Medium', fontSize: 11, color: 'rgba(255,255,255,0.88)', marginTop: 4 },
    horizontalProducts: { gap: 15, paddingRight: 20 },
    pCard: { width: 180, backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden', padding: 10 },
    pImg: { width: '100%', height: 120, borderRadius: 16, marginBottom: 10 },
    pInfo: { gap: 4 },
    pName: { fontFamily: 'PJS-Bold', fontSize: 15, color: '#0F172A' },
    pPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pPrice: { fontFamily: 'PJS-ExtraBold', fontSize: 14, color: GREEN_PRIMARY },
    pRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    pRatingText: { fontFamily: 'PJS-Bold', fontSize: 11, color: '#64748B' },
});