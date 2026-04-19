import { useAuth } from '@/contexts/AuthContext';
import {
    fetchProduct,
    productImageUrl,
    type ApiProduct,
} from '@/lib/agroconnectApi';
import { addOrMergeCartLine, imageSlotFromMockProductId } from '@/lib/cartStorage';
import { isClientBuyer } from '@/lib/userDisplay';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageSourcePropType,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

// Import de la police Space Grotesk
import {
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    useFonts
} from '@expo-google-fonts/space-grotesk';

const MAX_WIDTH = 500;

const PRODUCTS_DATABASE: any = {
    '1': { 
        name: 'Avocats Hass', 
        price: '4.00', 
        unit: 'kg', 
        origin: 'KENYA', 
        availability: '5,000kg',
        minOrder: '100kg',
        producer: 'Koffi Mensah',
        rating: '4.9',
        reviews: '128',
        image: require('../../../../assets/images/i1.jpg'), 
        avatar: 'https://images.pexels.com/photos/2169434/pexels-photo-2169434.jpeg?auto=compress&cs=tinysrgb&w=150',
        desc: 'Avocats Hass de première qualité, riches en graisses saines avec une texture crémeuse parfaite. Récoltés à maturité optimale dans les hautes terres du Kenya.' 
    },
    '2': { 
        name: 'Poivrons Rouges', 
        price: '2.50', 
        unit: 'kg', 
        origin: 'NIGERIA', 
        availability: '1,200kg',
        minOrder: '50kg',
        producer: 'Chidi Okoro',
        rating: '4.7',
        reviews: '85',
        image: require('../../../../assets/images/i2.jpg'), 
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
        desc: 'Poivrons rouges croquants et sucrés, cultivés selon des méthodes durables dans les sols riches du Nigeria.' 
    },
    '3': { 
        name: 'Mangues Douces', 
        price: '3.00', 
        unit: 'pc', 
        origin: 'AFRIQUE DU S.', 
        availability: '2,500kg',
        minOrder: '20kg',
        producer: 'Thandiwe Dube',
        rating: '4.8',
        reviews: '210',
        image: require('../../../../assets/images/i3.jpg'), 
        avatar: 'https://images.pexels.com/photos/2709385/pexels-photo-2709385.jpeg?auto=compress&cs=tinysrgb&w=150',
        desc: 'Mangues juteuses et parfumées sélectionnées à la main pour leur saveur exceptionnelle et leur sucrosité naturelle.' 
    },
    '4': { 
        name: 'Oignons Rouges', 
        price: '1.80', 
        unit: 'kg', 
        origin: 'ÉGYPTE', 
        availability: '10,000kg',
        minOrder: '500kg',
        producer: 'Amira Hassan',
        rating: '4.6',
        reviews: '150',
        image: require('../../../../assets/images/i4.jpg'), 
        avatar: 'https://images.pexels.com/photos/3586798/pexels-photo-3586798.jpeg?auto=compress&cs=tinysrgb&w=150',
        desc: 'Oignons rouges fermes avec une saveur piquante, idéaux pour la conservation longue durée et l\'exportation.' 
    },
    '5': { 
        name: 'Maïs Jaune', 
        price: '1.20', 
        unit: 'pc', 
        origin: 'MALI', 
        availability: '15,000kg',
        minOrder: '1000kg',
        producer: 'Moussa Traoré',
        rating: '4.5',
        reviews: '95',
        image: require('../../../../assets/images/i5.jpg'), 
        avatar: 'https://images.pexels.com/photos/2531553/pexels-photo-2531553.jpeg?auto=compress&cs=tinysrgb&w=150',
        desc: 'Maïs jaune de qualité supérieure, sans OGM, parfait pour la consommation directe ou la transformation industrielle.' 
    },
    '6': { 
        name: 'Brocoli Bio', 
        price: '3.50', 
        unit: 'kg', 
        origin: 'MAROC', 
        availability: '800kg',
        minOrder: '10kg',
        producer: 'Malik Sow',
        rating: '4.9',
        reviews: '60',
        image: require('../../../../assets/images/i6.jpg'), 
        avatar: 'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150',
        desc: 'Brocoli certifié bio, cultivé avec soin sans engrais chimiques dans les fermes fertiles du Maroc.' 
    },
};

type UiProduct = {
    name: string;
    price: string;
    unit: string;
    availability: string;
    minOrder: string;
    origin: string;
    desc: string;
    producer: string;
    rating: string;
    reviews: string;
    avatar: string;
    imageSource: ImageSourcePropType;
    api?: ApiProduct;
};

function uiFromApi(p: ApiProduct): UiProduct {
    const img = productImageUrl(p.image_url);
    return {
        name: p.name,
        price: String(p.price_per_unit ?? 0),
        unit: p.unit,
        availability: `${p.quantity} ${p.unit}`,
        minOrder: '1',
        origin: p.location || '—',
        desc: p.description || '—',
        producer: p.seller_name?.trim() || `Vendeur ${String(p.owner_id).slice(0, 8)}…`,
        rating: '—',
        reviews: '0',
        avatar: 'https://images.pexels.com/photos/2169434/pexels-photo-2169434.jpeg?auto=compress&cs=tinysrgb&w=150',
        imageSource: img ? { uri: img } : PRODUCTS_DATABASE['1'].image,
        api: p,
    };
}

function uiFromMock(m: (typeof PRODUCTS_DATABASE)['1']): UiProduct {
    return {
        name: m.name,
        price: m.price,
        unit: m.unit,
        availability: m.availability,
        minOrder: m.minOrder,
        origin: m.origin,
        desc: m.desc,
        producer: m.producer,
        rating: m.rating,
        reviews: m.reviews,
        avatar: m.avatar,
        imageSource: m.image,
    };
}

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { token, user } = useAuth();
    const canUseBuyerCart = !user || isClientBuyer(user);
    const [quantity, setQuantity] = useState(10);
    const [apiProduct, setApiProduct] = useState<ApiProduct | null>(null);
    const [apiLoading, setApiLoading] = useState(false);
    const [apiFailed, setApiFailed] = useState(false);

    // Thème CLAIR fixé
    const COLORS = {
        primary: '#156f51',
        bg: '#F1F5F9',
        card: '#FFFFFF',
        text: '#0F172A',
        textMuted: '#64748B',
        border: '#F1F5F9',
        iconBtn: '#F8FAFC'
    };

    let [fontsLoaded] = useFonts({
        'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
        'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
        'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
    });

    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const CONTAINER_WIDTH = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;

    const rawId = Array.isArray(id) ? id[0] : id;
    const productId = rawId != null ? String(rawId) : '';
    const isMockKey = Boolean(productId && PRODUCTS_DATABASE[productId]);
    const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            productId
        );

    useEffect(() => {
        if (!productId || isMockKey) {
            setApiProduct(null);
            setApiFailed(false);
            setApiLoading(false);
            return;
        }
        if (!isUuid) {
            setApiProduct(null);
            setApiFailed(true);
            setApiLoading(false);
            return;
        }
        let cancelled = false;
        setApiLoading(true);
        setApiFailed(false);
        fetchProduct(productId)
            .then((p) => {
                if (!cancelled) {
                    setApiProduct(p);
                    const maxQ = Math.max(1, Math.floor(p.quantity));
                    setQuantity((q) => Math.min(Math.max(1, q), maxQ));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setApiProduct(null);
                    setApiFailed(true);
                }
            })
            .finally(() => {
                if (!cancelled) setApiLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [productId, isMockKey, isUuid]);

    const product: UiProduct = useMemo(() => {
        if (apiProduct) return uiFromApi(apiProduct);
        const key =
            productId && PRODUCTS_DATABASE[productId] ? productId : '1';
        return uiFromMock(PRODUCTS_DATABASE[key]);
    }, [apiProduct, productId]);

    const maxQty = product.api
        ? Math.max(1, Math.floor(product.api.quantity))
        : 9999;

    const bumpQty = (delta: number) => {
        setQuantity((q) => {
            const n = q + delta;
            return Math.min(maxQty, Math.max(1, n));
        });
    };

    const handleOrder = async () => {
        if (user && !isClientBuyer(user)) {
            Alert.alert(
                'Compte producteur',
                'Vous vendez et échangez avec les experts (Agrobot, messagerie). Les achats sur le marketplace sont réservés aux comptes acheteur.',
                [
                    { text: 'Agrobot', onPress: () => router.push('/tableau-de-bord/assistant') },
                    { text: 'OK', style: 'cancel' },
                ]
            );
            return;
        }
        if (!token) {
            Alert.alert('Connexion requise', 'Connectez-vous pour ajouter au panier.', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Connexion', onPress: () => router.push('/connexion') },
            ]);
            return;
        }
        if (!product.api) {
            const pid = String(productId ?? '1');
            const unitPrice = parseFloat(String(product.price).replace(',', '.')) || 0;
            await addOrMergeCartLine({
                id: `demo-${pid}`,
                name: product.name,
                price: unitPrice,
                qty: quantity,
                detail: product.unit ? ` / ${product.unit}` : undefined,
                imageSlot: imageSlotFromMockProductId(pid),
            });
            Alert.alert('Panier', 'Article ajouté à votre panier.', [
                { text: 'Continuer les achats', style: 'cancel' },
                { text: 'Voir le panier', onPress: () => router.push('/marche/panier') },
            ]);
            return;
        }
        const img = productImageUrl(product.api.image_url);
        await addOrMergeCartLine({
            id: String(product.api.id),
            name: product.name,
            price: product.api.price_per_unit ?? 0,
            qty: quantity,
            detail: product.unit ? ` / ${product.unit}` : undefined,
            imageUri: img || undefined,
        });
        Alert.alert('Panier', 'Article ajouté à votre panier.', [
            { text: 'Continuer les achats', style: 'cancel' },
            { text: 'Voir le panier', onPress: () => router.push('/marche/panier') },
        ]);
    };

    const openChat = () => {
        if (product.api?.owner_id) {
            router.push({
                pathname: '/marche/message',
                params: { receiverId: String(product.api.owner_id) },
            });
        } else {
            router.push('/marche/message');
        }
    };

    if (!fontsLoaded) return null;

    if (isUuid && !isMockKey && apiLoading && !apiProduct) {
        return (
            <View style={[styles.outerContainer, { backgroundColor: COLORS.bg, justifyContent: 'center' }]}>
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (isUuid && !isMockKey && apiFailed && !apiProduct) {
        return (
            <View style={[styles.outerContainer, { backgroundColor: COLORS.bg, padding: 24 }]}>
                <StatusBar barStyle="dark-content" />
                <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: COLORS.iconBtn, borderColor: COLORS.border, alignSelf: 'flex-start' }]}>
                    <Feather name="chevron-left" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={{ marginTop: 24, fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: COLORS.text }}>
                    Produit introuvable ou serveur indisponible.
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.outerContainer, { backgroundColor: COLORS.bg }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: COLORS.card }]}>
                <SafeAreaView style={{ flex: 1 }}>
                    
                    <View style={[styles.header, { backgroundColor: COLORS.card }]}>
                        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: COLORS.iconBtn, borderColor: COLORS.border }]}>
                            <Feather name="chevron-left" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: COLORS.text }]}>Détails du produit</Text>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: COLORS.iconBtn, borderColor: COLORS.border }]}>
                                <Ionicons name="heart-outline" size={22} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
                        <View style={styles.imageWrapper}>
                            <Image source={product.imageSource} style={styles.mainImage} resizeMode="cover" />
                            <View style={styles.premiumLabel}>
                                <MaterialCommunityIcons name="check-decagram" size={16} color="white" />
                                <Text style={styles.premiumText}>QUALITÉ SUPÉRIEURE</Text>
                            </View>
                        </View>

                        <View style={[styles.contentCard, { backgroundColor: COLORS.card }]}>
                            <Text style={[styles.productTitle, { color: COLORS.text }]}>{product.name}</Text>

                            <View style={styles.priceRow}>
                                <Text style={[styles.priceText, { color: COLORS.primary }]}>
                                    {product.price}{product.api ? '' : '€'}{' '}
                                    <Text style={[styles.unitText, { color: COLORS.textMuted }]}>/ {product.unit}</Text>
                                </Text>
                                <View style={[styles.stockBadge, { backgroundColor: product.api && product.api.quantity <= 0 ? '#FEE2E2' : '#ECFDF5' }]}>
                                    <Text style={[styles.stockText, { color: COLORS.primary }]}>
                                        {product.api && product.api.quantity <= 0 ? 'Rupture' : 'En stock'}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.verifiedCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
                                <View style={[styles.verifiedIconBg, { backgroundColor: '#F0FDF4' }]}>
                                    <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.primary} />
                                </View>
                                <View style={{flex: 1, marginLeft: 12}}>
                                    <Text style={[styles.verifiedTitle, { color: COLORS.text }]}>Producteur Vérifié</Text>
                                    <Text style={[styles.verifiedSub, { color: COLORS.textMuted }]}>Certifié conforme aux normes AgroConnect Africa</Text>
                                </View>
                                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                            </View>

                            <View style={styles.infoGrid}>
                                <InfoBox icon="archive-outline" label="DISPONIBILITÉ" value={product.availability} colors={COLORS} />
                                <InfoBox icon="basket-outline" label="MIN. COMMANDE" value={product.minOrder} colors={COLORS} />
                                <InfoBox icon="location-outline" label="ORIGINE" value={product.origin} isIon colors={COLORS} />
                            </View>

                            {canUseBuyerCart ? (
                                <View style={styles.qtyContainer}>
                                    <Text style={[styles.qtyLabel, { color: COLORS.text }]}>Quantité ({product.unit})</Text>
                                    <View style={[styles.qtySelector, { backgroundColor: COLORS.iconBtn, borderColor: COLORS.border }]}>
                                        <TouchableOpacity onPress={() => bumpQty(-1)} style={[styles.qtyBtn, { backgroundColor: COLORS.card }]}>
                                            <Feather name="minus" size={20} color={COLORS.text} />
                                        </TouchableOpacity>
                                        <Text style={[styles.qtyValue, { color: COLORS.text }]}>{quantity}</Text>
                                        <TouchableOpacity onPress={() => bumpQty(1)} style={[styles.qtyBtn, {backgroundColor: COLORS.primary}]}>
                                            <Feather name="plus" size={20} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : null}

                            <View style={[styles.actionRow, !canUseBuyerCart && styles.actionRowFarmer]}>
                                <TouchableOpacity 
                                    style={[styles.chatBtn, { borderColor: COLORS.primary }, !canUseBuyerCart && styles.chatBtnFull]}
                                    onPress={openChat}
                                >
                                    <Ionicons name="chatbubble-outline" size={22} color={COLORS.primary} />
                                    <Text style={[styles.chatBtnText, { color: COLORS.primary }]}>Discuter</Text>
                                </TouchableOpacity>
                                
                                {canUseBuyerCart ? (
                                    <TouchableOpacity style={styles.orderBtnContainer} onPress={handleOrder} activeOpacity={0.9}>
                                        <LinearGradient colors={['#10B981', '#156f51']} style={styles.orderBtnGradient}>
                                            <Feather name="shopping-cart" size={20} color="white" />
                                            <Text style={styles.orderBtnText}>Commander</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            <Text style={[styles.descText, { color: COLORS.textMuted }]}>{product.desc}</Text>

                            <View style={[styles.producerCard, { backgroundColor: COLORS.iconBtn, borderColor: COLORS.border }]}>
                                <Image source={{ uri: product.avatar }} style={styles.avatar} />
                                <View style={{flex: 1, marginLeft: 12}}>
                                    <Text style={[styles.producerName, { color: COLORS.text }]}>{product.producer}</Text>
                                    <View style={styles.ratingRow}>
                                        <Ionicons name="star" size={14} color="#F59E0B" />
                                        <Text style={[styles.ratingText, { color: COLORS.text }]}>{product.rating} <Text style={{color: COLORS.textMuted}}>({product.reviews} avis)</Text></Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={[styles.viewProfile, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
                                    <Text style={[styles.viewProfileText, { color: COLORS.textMuted }]}>Voir Profil</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        </View>
    );
}

const InfoBox = ({ icon, label, value, isIon, colors }: any) => (
    <View style={[styles.infoBox, { backgroundColor: colors.iconBtn, borderColor: colors.border }]}>
        {isIon ? <Ionicons name={icon} size={20} color={colors.primary} /> : <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />}
        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    outerContainer: { flex: 1, alignItems: 'center' },
    innerContainer: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
    iconBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    headerRight: { flexDirection: 'row' },
    imageWrapper: { width: '100%', height: 350 },
    mainImage: { width: '100%', height: '100%' },
    premiumLabel: { position: 'absolute', top: 20, left: 20, backgroundColor: '#156f51', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
    premiumText: { color: 'white', fontSize: 10, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: 1.5 },
    contentCard: { padding: 24, marginTop: -30, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
    productTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    priceText: { fontSize: 26, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: -1 },
    unitText: { fontSize: 16, fontFamily: 'SpaceGrotesk-Medium' },
    stockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    stockText: { fontSize: 12, fontFamily: 'SpaceGrotesk-Bold' },
    verifiedCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginTop: 20, borderWidth: 1 },
    verifiedIconBg: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    verifiedTitle: { fontSize: 16, fontWeight: '700' },
    verifiedSub: { fontSize: 12, fontFamily: 'SpaceGrotesk-Regular' },
    infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, gap: 10 },
    infoBox: { flex: 1, padding: 12, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
    infoLabel: { fontSize: 8, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: 1, marginTop: 8 },
    infoValue: { fontSize: 11, fontFamily: 'SpaceGrotesk-Bold', marginTop: 2 },
    qtyContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 },
    qtyLabel: { fontSize: 16, fontWeight: '700' },
    qtySelector: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 4, borderWidth: 1 },
    qtyBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    qtyValue: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', paddingHorizontal: 20 },
    actionRow: { flexDirection: 'row', marginTop: 30, gap: 12 },
    actionRowFarmer: { marginTop: 20 },
    chatBtn: { flex: 1, height: 60, borderRadius: 20, borderWidth: 2, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
    chatBtnFull: { flex: 1 },
    chatBtnText: { marginLeft: 8, fontFamily: 'SpaceGrotesk-Bold', fontSize: 16 },
    orderBtnContainer: { flex: 1.5, height: 60, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#156f51', shadowOpacity: 0.3 },
    orderBtnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    orderBtnText: { color: 'white', fontFamily: 'SpaceGrotesk-Bold', fontSize: 16 },
    descText: { fontSize: 14, fontFamily: 'SpaceGrotesk-Regular', lineHeight: 22, marginTop: 25 },
    producerCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 24, marginTop: 30, borderWidth: 1 },
    avatar: { width: 55, height: 55, borderRadius: 20, backgroundColor: '#E2E8F0' },
    producerName: { fontSize: 16, fontWeight: '700' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    ratingText: { fontSize: 13, fontFamily: 'SpaceGrotesk-Medium', marginLeft: 4 },
    viewProfile: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
    viewProfileText: { fontSize: 12, fontFamily: 'SpaceGrotesk-Bold' }
});