import { useAuth } from '@/contexts/AuthContext';
import { isClientBuyer } from '@/lib/userDisplay';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Image,
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

/** Réserve pour la barre d’onglets `(onglets)`, comme sur le panier. */
const TAB_BAR_RESERVE = 88;

// Import de la police Space Grotesk
import {
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    useFonts
} from '@expo-google-fonts/space-grotesk';

const MAX_WIDTH = 500;

const LOGOS = {
    wave: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Wave_Logo.png/1200px-Wave_Logo.png',
    orange: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1024px-Orange_logo.svg.png',
    mastercard: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png'
};

export default function UltraModernPaymentPage() {
    const [selectedMethod, setSelectedMethod] = useState('card');
    const router = useRouter();
    const { user, isReady } = useAuth();

    useFocusEffect(
        useCallback(() => {
            if (!isReady) return;
            if (user && !isClientBuyer(user)) {
                router.replace('/marche');
            }
        }, [isReady, user, router])
    );
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const bottomBarOffset = TAB_BAR_RESERVE + Math.max(insets.bottom, 8);

    const CONTAINER_WIDTH = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;

    // THÈME CLAIR FIXE
    const COLORS = {
        primary: '#146248',
        primaryDark: '#059669',
        background: '#FFFFFF',
        card: '#FFFFFF',
        text: '#0F172A',
        textMuted: '#64748B',
        border: '#E2E8F0',
        outerBg: '#F1F5F9',
        badgeBg: '#F0FDF4',
    };

    // Chargement de la police
    let [fontsLoaded] = useFonts({
        'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
        'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
        'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
    });

    if (!fontsLoaded) return null;

    return (
        <View style={[styles.outerContainer, { backgroundColor: COLORS.outerBg }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: COLORS.background }]}>
                <SafeAreaView style={{ flex: 1 }}>
                    
                    {/* --- HEADER --- */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={[styles.iconCircle, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
                            <Feather name="chevron-left" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: COLORS.text }]}>Paiement Sécurisé</Text>
                        <View style={{ width: 46 }} />
                    </View>

                    {/* --- STEPPER --- */}
                    <View style={styles.stepperWrapper}>
                        {[1, 2, 3, 4, 5, 6].map((step) => (
                            <View key={step} style={styles.stepContainer}>
                                <View style={[styles.dot, step === 6 ? [styles.dotLong, {backgroundColor: COLORS.primary}] : {backgroundColor: '#CBD5E1'}]} />
                            </View>
                        ))}
                    </View>

                    <ScrollView
                        style={styles.scrollFlex}
                        contentContainerStyle={styles.scrollInner}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* --- TOTAL AMOUNT CARD --- */}
                        <View style={[styles.amountCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
                            <Text style={[styles.amountLabel, { color: COLORS.textMuted }]}>MONTANT TOTAL À RÉGLER</Text>
                            <Text style={[styles.amountValue, { color: COLORS.primary }]}>240.00€</Text>
                            <View style={[styles.secureBadge, { backgroundColor: COLORS.badgeBg }]}>
                                <Ionicons name="lock-closed" size={12} color={COLORS.primary} />
                                <Text style={[styles.secureBadgeText, { color: COLORS.primary }]}>CRYPTAGE SSL ACTIVÉ</Text>
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Méthode de paiement</Text>

                        {/* --- METHODS LIST --- */}
                        <View style={styles.methodsGrid}>
                            
                            {/* Carte Bancaire */}
                            <TouchableOpacity 
                                style={[
                                    styles.methodCard, 
                                    { backgroundColor: COLORS.card, borderColor: COLORS.border },
                                    selectedMethod === 'card' && { borderColor: COLORS.primary, backgroundColor: COLORS.badgeBg }
                                ]} 
                                onPress={() => setSelectedMethod('card')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.logoBox, { backgroundColor: '#1E293B' }]}>
                                    <Image source={{ uri: LOGOS.mastercard }} style={styles.logoImgMaster} resizeMode="contain" />
                                </View>
                                <View style={styles.methodInfo}>
                                    <Text style={[styles.methodName, { color: COLORS.text }]}>Carte Bancaire</Text>
                                    <Text style={[styles.methodSub, { color: COLORS.textMuted }]}>Visa, Mastercard, AMEX</Text>
                                </View>
                                <View style={[styles.radio, { borderColor: '#CBD5E1' }, selectedMethod === 'card' && { borderColor: COLORS.primary }]}>
                                    {selectedMethod === 'card' && <View style={[styles.radioInner, { backgroundColor: COLORS.primary }]} />}
                                </View>
                            </TouchableOpacity>

                            {/* Wave */}
                            <TouchableOpacity 
                                style={[
                                    styles.methodCard, 
                                    { backgroundColor: COLORS.card, borderColor: COLORS.border },
                                    selectedMethod === 'wave' && { borderColor: COLORS.primary, backgroundColor: COLORS.badgeBg }
                                ]} 
                                onPress={() => setSelectedMethod('wave')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.logoBox, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9' }]}>
                                    <Image source={{ uri: LOGOS.wave }} style={styles.logoImg} resizeMode="contain" />
                                </View>
                                <View style={styles.methodInfo}>
                                    <Text style={[styles.methodName, { color: COLORS.text }]}>Wave</Text>
                                    <Text style={[styles.methodSub, { color: COLORS.textMuted }]}>Paiement mobile instantané</Text>
                                </View>
                                <View style={[styles.radio, { borderColor: '#CBD5E1' }, selectedMethod === 'wave' && { borderColor: COLORS.primary }]}>
                                    {selectedMethod === 'wave' && <View style={[styles.radioInner, { backgroundColor: COLORS.primary }]} />}
                                </View>
                            </TouchableOpacity>

                            {/* Orange Money */}
                            <TouchableOpacity 
                                style={[
                                    styles.methodCard, 
                                    { backgroundColor: COLORS.card, borderColor: COLORS.border },
                                    selectedMethod === 'orange' && { borderColor: COLORS.primary, backgroundColor: COLORS.badgeBg }
                                ]} 
                                onPress={() => setSelectedMethod('orange')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.logoBox, { backgroundColor: '#000000' }]}>
                                    <Image source={{ uri: LOGOS.orange }} style={styles.logoImg} resizeMode="contain" />
                                </View>
                                <View style={styles.methodInfo}>
                                    <Text style={[styles.methodName, { color: COLORS.text }]}>Orange Money</Text>
                                    <Text style={[styles.methodSub, { color: COLORS.textMuted }]}>Portefeuille mobile sécurisé</Text>
                                </View>
                                <View style={[styles.radio, { borderColor: '#CBD5E1' }, selectedMethod === 'orange' && { borderColor: COLORS.primary }]}>
                                    {selectedMethod === 'orange' && <View style={[styles.radioInner, { backgroundColor: COLORS.primary }]} />}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* --- FOOTER --- */}
                    <View style={[styles.footer, { backgroundColor: COLORS.card, paddingBottom: 20 + bottomBarOffset }]}>
                        <View style={styles.securityInfo}>
                            <Feather name="shield" size={14} color={COLORS.textMuted} />
                            <Text style={[styles.securityInfoText, { color: COLORS.textMuted }]}>Paiement 100% sécurisé via serveurs bancaires</Text>
                        </View>
                        
                        <TouchableOpacity 
                            activeOpacity={0.9} 
                            style={[styles.mainBtnContainer, { shadowColor: COLORS.primary }]}
                            onPress={() => router.push('/marche/PaymentDetails')}
                        >
                            <LinearGradient 
                                colors={[COLORS.primary, COLORS.primaryDark]} 
                                start={{x:0, y:0}} end={{x:1, y:0}}
                                style={styles.mainBtn}
                            >
                                <Text style={styles.mainBtnText}>Confirmer le paiement</Text>
                                <View style={styles.btnIconCircle}>
                                    <Feather name="arrow-right" size={18} color={COLORS.primary} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.trustIcons}>
                            <MaterialCommunityIcons name="shield-check-outline" size={20} color={COLORS.textMuted} />
                            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
                            <MaterialCommunityIcons name="check-decagram-outline" size={20} color={COLORS.textMuted} />
                        </View>
                    </View>

                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, alignItems: 'center' },
    innerContainer: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 15 },
    headerTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: -0.5 },
    iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1 },
    
    stepperWrapper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10 },
    stepContainer: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 6, height: 6, borderRadius: 3 },
    dotLong: { width: 22, borderRadius: 10 },

    scrollFlex: { flex: 1 },
    scrollInner: { paddingHorizontal: 25, paddingBottom: 16, flexGrow: 1 },
    amountCard: { borderRadius: 28, padding: 25, alignItems: 'center', marginVertical: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 15, borderWidth: 1 },
    amountLabel: { fontSize: 10, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: 1.5 },
    amountValue: { fontSize: 48, fontFamily: 'SpaceGrotesk-Bold', marginVertical: 5, letterSpacing: -1.5 },
    secureBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    secureBadgeText: { fontSize: 9, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: 1 },
    
    sectionTitle: { fontSize: 17, fontFamily: 'SpaceGrotesk-Bold', marginBottom: 20, marginTop: 10, letterSpacing: -0.5 },
    methodsGrid: { gap: 12 },
    methodCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        borderRadius: 22, 
        borderWidth: 1.5, 
        borderColor: 'transparent', 
        shadowColor: '#000', 
        shadowOpacity: 0.03, 
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }
    },
    logoBox: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    logoImg: { width: '70%', height: '70%' },
    logoImgMaster: { width: '65%', height: '65%' },
    methodInfo: { flex: 1, marginLeft: 15 },
    methodName: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 15 },
    methodSub: { fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, marginTop: 2 },
    
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    radioInner: { width: 10, height: 10, borderRadius: 5 },

    footer: { padding: 25, borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
    securityInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 },
    securityInfoText: { fontSize: 11, fontFamily: 'SpaceGrotesk-Medium' },
    
    mainBtnContainer: { height: 68, borderRadius: 22, overflow: 'hidden', elevation: 8, shadowOpacity: 0.3, shadowRadius: 15 },
    mainBtn: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25 },
    mainBtnText: { color: 'white', fontSize: 18, fontFamily: 'SpaceGrotesk-Bold' },
    btnIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    
    trustIcons: { flexDirection: 'row', justifyContent: 'center', gap: 25, marginTop: 25, opacity: 0.4 }
});