import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    hydrateImage,
    loadCartFromStorage,
    saveCartToStorage,
    type PersistedCartLine,
} from '@/lib/cartStorage';
import { isClientBuyer } from '@/lib/userDisplay';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    Image,
    ImageSourcePropType,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    useFonts,
} from '@expo-google-fonts/inter';

/** Espace réservé pour la barre d’onglets globale (layout `(onglets)`). */
const TAB_BAR_RESERVE = 88;

const MAX_WIDTH = 500;

type CartLine = {
    id: string;
    name: string;
    /** Prix unitaire (€) */
    price: number;
    qty: number;
    image: ImageSourcePropType;
    detail?: string;
    imageSlot?: 1 | 2 | 3 | 4 | 5 | 6;
    imageUri?: string;
};

function lineFromPersisted(p: PersistedCartLine): CartLine {
    return {
        id: p.id,
        name: p.name,
        price: p.price,
        qty: p.qty,
        detail: p.detail,
        image: hydrateImage(p),
        imageSlot: p.imageSlot,
        imageUri: p.imageUri,
    };
}

function lineToPersisted(line: CartLine): PersistedCartLine {
    return {
        id: line.id,
        name: line.name,
        price: line.price,
        qty: line.qty,
        detail: line.detail,
        imageSlot: line.imageSlot,
        imageUri: line.imageUri,
    };
}

export default function OrderSummaryPage() {
    const router = useRouter();
    const { user, isReady } = useAuth();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    /** Hauteur entre le bas de l’écran et la zone utile (barre app + encoche). */
    const bottomBarOffset = TAB_BAR_RESERVE + Math.max(insets.bottom, 8);

    const CONTAINER_WIDTH = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;

    // THÈME CLAIR FIXÉ
    const COLORS = {
        primary: '#146248',
        primaryDark: '#059669',
        background: '#F8FAFC',
        card: '#FFFFFF',
        text: '#1E293B',
        textMuted: '#64748B',
        border: '#F1F5F9',
        iconBg: '#F1F5F9',
        outerBg: '#F1F5F9',
    };

    let [fontsLoaded] = useFonts({
        'Inter-Regular': Inter_400Regular,
        'Inter-Medium': Inter_500Medium,
        'Inter-SemiBold': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
    });

    const [lines, setLines] = useState<CartLine[]>([]);
    const [cartReady, setCartReady] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            void (async () => {
                const stored = await loadCartFromStorage();
                if (cancelled) return;
                if (stored === null) {
                    setLines([]);
                } else {
                    setLines(stored.map(lineFromPersisted));
                }
                setCartReady(true);
            })();
            return () => {
                cancelled = true;
            };
        }, [])
    );

    useEffect(() => {
        if (!cartReady) return;
        saveCartToStorage(lines.map(lineToPersisted));
    }, [lines, cartReady]);

    useFocusEffect(
        useCallback(() => {
            if (!isReady) return;
            if (user && !isClientBuyer(user)) {
                router.replace('/marche');
            }
        }, [isReady, user, router])
    );

    const bumpQty = useCallback((id: string, delta: number) => {
        setLines((prev) =>
            prev.flatMap((line) => {
                if (line.id !== id) return [line];
                const q = line.qty + delta;
                if (q < 1) return [];
                return [{ ...line, qty: q }];
            })
        );
    }, []);

    const removeLine = useCallback((id: string) => {
        setLines((prev) => prev.filter((l) => l.id !== id));
    }, []);

    const clearCart = useCallback(() => {
        setLines([]);
    }, []);

    const subtotal = useMemo(() => lines.reduce((acc, line) => acc + line.price * line.qty, 0), [lines]);
    const tax = subtotal * 0.05;
    /** Frais fixes + léger supplément si volume important (ex. palettes). */
    const logistics = useMemo(() => {
        const units = lines.reduce((a, l) => a + l.qty, 0);
        return 15 + Math.max(0, units - 3) * 2;
    }, [lines]);
    const total = subtotal + tax + logistics;

    if (!fontsLoaded || !cartReady) return null;

    return (
        <View style={[styles.outerContainer, { backgroundColor: COLORS.outerBg }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: COLORS.background }]}>
                <SafeAreaView style={{ flex: 1 }}>
                    
                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: 'white' }]}>
                        <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: COLORS.iconBg }]}>
                            <Feather name="chevron-left" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: COLORS.text }]}>Résumé de commande</Text>
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: COLORS.iconBg }]}
                            onPress={clearCart}
                            accessibilityLabel="Vider le panier"
                        >
                            <Feather name="trash-2" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

                    {/* Progress Stepper */}
                    <View style={[styles.stepperContainer, { backgroundColor: 'white' }]}>
                        {[1, 2, 3, 4, 5, 6].map((step) => (
                            <View key={step} style={styles.stepWrapper}>
                                <View style={[styles.stepDot, { backgroundColor: '#E2E8F0' }, step <= 5 ? styles.stepDotActive : null]} />
                                {step < 6 && <View style={[styles.stepLine, { backgroundColor: '#E2E8F0' }, step < 5 ? styles.stepLineActive : null]} />}
                            </View>
                        ))}
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: 300 + bottomBarOffset }]}
                    >
                        
                        {/* Section Items */}
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Articles sélectionnés</Text>
                            <TouchableOpacity onPress={() => router.push('/marche')}>
                                <Text style={styles.addMoreText}>Ajouter plus</Text>
                            </TouchableOpacity>
                        </View>

                        {lines.length === 0 ? (
                            <Text style={[styles.emptyHint, { color: COLORS.textMuted }]}>
                                Panier vide. Ajoutez des articles depuis le marché.
                            </Text>
                        ) : (
                            lines.map((item) => {
                                const lineTotal = item.price * item.qty;
                                return (
                                    <View key={item.id} style={[styles.productCard, { backgroundColor: COLORS.card }]}>
                                        <Image source={item.image} style={styles.productImage} />
                                        <View style={styles.productDetails}>
                                            <Text style={[styles.productName, { color: COLORS.text }]} numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                            <Text style={[styles.productPrice, { color: COLORS.textMuted }]}>
                                                {item.price.toFixed(2)} € / unité {item.detail ?? ''}
                                            </Text>
                                            <Text style={[styles.lineTotal, { color: COLORS.primary }]}>
                                                Sous-total : {lineTotal.toFixed(2)} €
                                            </Text>

                                            <View style={styles.qtySelector}>
                                                <TouchableOpacity
                                                    style={[styles.qtyBtn, { backgroundColor: COLORS.iconBg }]}
                                                    onPress={() => bumpQty(item.id, -1)}
                                                >
                                                    <Feather name="minus" size={16} color={COLORS.text} />
                                                </TouchableOpacity>
                                                <Text style={[styles.qtyText, { color: COLORS.text }]}>{item.qty}</Text>
                                                <TouchableOpacity
                                                    style={[styles.qtyBtn, { backgroundColor: COLORS.primary }]}
                                                    onPress={() => bumpQty(item.id, 1)}
                                                >
                                                    <Feather name="plus" size={16} color="white" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.removeLineBtn}
                                                    onPress={() => removeLine(item.id)}
                                                    accessibilityLabel="Retirer"
                                                >
                                                    <Feather name="x" size={18} color="#94A3B8" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}

                        {/* Section Logistique */}
                        <Text style={[styles.sectionTitleSpaced, { color: COLORS.text }]}>Logistique & Livraison</Text>
                        <View style={[styles.logisticsCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
                            <View style={[styles.deliveryIconBg, { backgroundColor: '#F0FDF4' }]}>
                                <MaterialCommunityIcons name="truck-delivery-outline" size={24} color={COLORS.primary} />
                            </View>
                            <View style={{flex: 1, marginLeft: 12}}>
                                <Text style={[styles.deliveryTitle, { color: COLORS.text }]}>Livraison Standard</Text>
                                <Text style={[styles.deliverySub, { color: COLORS.textMuted }]}>Arrivée estimée : 2-3 jours</Text>
                            </View>
                            <Text style={[styles.deliveryPrice, { color: COLORS.text }]}>{logistics.toFixed(2)}€</Text>
                        </View>

                    </ScrollView>

                    {/* Bottom Checkout Card — au-dessus de la barre d’onglets globale */}
                    <View style={[styles.checkoutCard, { backgroundColor: COLORS.card, bottom: bottomBarOffset }]}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Sous-total</Text>
                            <Text style={[styles.summaryValue, { color: COLORS.text }]}>{subtotal.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <View style={styles.labelWithInfo}>
                                <Text style={styles.summaryLabel}>Taxe (TVA 5%)</Text>
                                <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} style={{marginLeft: 4}} />
                            </View>
                            <Text style={[styles.summaryValue, { color: COLORS.text }]}>{tax.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Frais logistiques</Text>
                            <Text style={[styles.summaryValue, { color: COLORS.text }]}>{logistics.toFixed(2)}€</Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: COLORS.border }]} />

                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, { color: COLORS.text }]}>Montant Total</Text>
                            <Text style={styles.totalPrice}>{total.toFixed(2)}€</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.payBtnContainer, lines.length === 0 && styles.payBtnDisabled]}
                            activeOpacity={0.8}
                            disabled={lines.length === 0}
                            onPress={() => router.push('/marche/paiement')}
                        >
                            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.payBtnGradient}>
                                <Text style={styles.payBtnText}>Procéder au paiement</Text>
                                <MaterialCommunityIcons name="wallet-outline" size={20} color="white" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, alignItems: 'center' },
    innerContainer: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    headerTitle: { fontSize: 18, fontFamily: 'Inter-Bold', letterSpacing: -0.5 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    stepperContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
    stepWrapper: { flexDirection: 'row', alignItems: 'center' },
    stepDot: { width: 8, height: 8, borderRadius: 4 },
    stepDotActive: { backgroundColor: '#146248' },
    stepLine: { width: 15, height: 2, marginHorizontal: 4 },
    stepLineActive: { backgroundColor: '#146248' },
    scrollContent: { padding: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontFamily: 'Inter-Bold', letterSpacing: -0.5 },
    sectionTitleSpaced: { fontSize: 18, fontFamily: 'Inter-Bold', marginTop: 30, marginBottom: 15, letterSpacing: -0.5 },
    addMoreText: { color: '#146248', fontFamily: 'Inter-Bold' },
    productCard: { flexDirection: 'row', borderRadius: 24, padding: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    productImage: { width: 90, height: 90, borderRadius: 18 },
    productDetails: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
    productName: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
    productPrice: { fontSize: 14, fontFamily: 'Inter-Medium', marginTop: 2 },
    qtySelector: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    qtyBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    qtyText: { marginHorizontal: 12, fontFamily: 'Inter-Bold', fontSize: 16, minWidth: 28, textAlign: 'center' },
    lineTotal: { fontSize: 14, fontFamily: 'Inter-Bold', marginTop: 6 },
    removeLineBtn: { marginLeft: 'auto' as const, padding: 6 },
    emptyHint: { fontSize: 14, fontFamily: 'Inter-Medium', textAlign: 'center', paddingVertical: 24 },
    payBtnDisabled: { opacity: 0.45 },
    logisticsCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
    deliveryIconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    deliveryTitle: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
    deliverySub: { fontSize: 12, fontFamily: 'Inter-Medium' },
    deliveryPrice: { fontSize: 15, fontFamily: 'Inter-Bold' },
    checkoutCard: {
        position: 'absolute',
        left: 0,
        right: 0,
        width: '100%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 28,
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    labelWithInfo: { flexDirection: 'row', alignItems: 'center' },
    summaryLabel: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#94A3B8' },
    summaryValue: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
    divider: { height: 1, marginVertical: 15 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    totalLabel: { fontSize: 18, fontFamily: 'Inter-Bold', letterSpacing: -0.5 },
    totalPrice: { fontSize: 24, fontFamily: 'Inter-Bold', color: '#146248', letterSpacing: -1 },
    payBtnContainer: { height: 60, borderRadius: 20, overflow: 'hidden' },
    payBtnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    payBtnText: { color: 'white', fontSize: 16, fontFamily: 'Inter-Bold' }
});