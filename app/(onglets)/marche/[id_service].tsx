import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

const MAX_WIDTH = 500;

export default function ServiceDetailScreen() {
    const router = useRouter();
    const { width: windowWidth } = useWindowDimensions();

    const CONTAINER_WIDTH = Math.min(windowWidth, MAX_WIDTH);

    const COLORS = {
        primary: '#065F46',
        accent: '#10B981',
        bg: '#FFFFFF',
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

    if (!fontsLoaded) return null;

    return (
        <View style={[styles.outerContainer, { backgroundColor: COLORS.outerBg }]}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: COLORS.bg }]}>
                
                {/* --- HEADER FLOTTANT CORRIGÉ --- */}
                <View style={styles.floatingHeader}>
                    <TouchableOpacity 
                        onPress={() => router.push('/marche/service')} // Cette fonction est maintenant bien accessible
                        style={styles.backBtn}
                        activeOpacity={0.7}
                    >
                        <Feather name="arrow-left" size={24} color="white" />
                    </TouchableOpacity>

                    <View style={styles.headerRightActions}>
                        <TouchableOpacity style={styles.circleBtn} activeOpacity={0.7}>
                            <Feather name="heart" size={20} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.circleBtn, { marginLeft: 10 }]} activeOpacity={0.7}>
                            <Feather name="share-2" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
                    
                    {/* 1. SECTION IMAGE HERO */}
                    <View style={styles.imageWrapper}>
                        <Image 
                            source={require('../../../assets/images/T2.jpg')} 
                            style={styles.mainImage} 
                            resizeMode="cover"
                        />
                        <LinearGradient 
                            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']} 
                            style={styles.imageOverlay} 
                        />
                        <View style={styles.statusBadge}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.statusText}>VÉRIFIÉ</Text>
                        </View>
                        <View style={styles.paginationDots}>
                            <View style={[styles.dot, styles.activeDot]} />
                            <View style={styles.dot} />
                            <View style={styles.dot} />
                        </View>
                    </View>

                    {/* 2. INFOS PRINCIPALES */}
                    <View style={[styles.contentCard, { backgroundColor: COLORS.bg }]}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.title, { color: COLORS.text }]}>John Deere 8R 410</Text>
                            <View style={styles.ratingBox}>
                                <Ionicons name="star" size={16} color="#F59E0B" />
                                <Text style={[styles.ratingText, { color: COLORS.text }]}>4.9</Text>
                            </View>
                        </View>

                        <View style={styles.locationRow}>
                            <Feather name="map-pin" size={14} color={COLORS.primary} />
                            <Text style={[styles.locationText, { color: COLORS.textMuted }]}>Dakar, Sénégal • 2.5km</Text>
                        </View>

                        {/* 3. GRILLE DE SPÉCIFICATIONS */}
                        <View style={styles.specGrid}>
                            <View style={[styles.specBox, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
                                <MaterialCommunityIcons name="lightning-bolt-outline" size={22} color={COLORS.primary} />
                                <Text style={[styles.specLabel, { color: COLORS.textMuted }]}>PUISSANCE</Text>
                                <Text style={[styles.specValue, { color: COLORS.text }]}>410 CV</Text>
                            </View>
                            <View style={[styles.specBox, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
                                <MaterialCommunityIcons name="engine-outline" size={22} color={COLORS.primary} />
                                <Text style={[styles.specLabel, { color: COLORS.textMuted }]}>MOTEUR</Text>
                                <Text style={[styles.specValue, { color: COLORS.text }]}>Diesel</Text>
                            </View>
                            <View style={[styles.specBox, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
                                <MaterialCommunityIcons name="calendar-check" size={22} color={COLORS.primary} />
                                <Text style={[styles.specLabel, { color: COLORS.textMuted }]}>ANNÉE</Text>
                                <Text style={[styles.specValue, { color: COLORS.text }]}>2023</Text>
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Description</Text>
                        <Text style={[styles.description, { color: COLORS.textMuted }]}>
                            Tracteur haute performance John Deere idéal pour les grandes surfaces. Équipé du système AutoTrac™ et d'une cabine climatisée premium. Entretien certifié AgroConnect Africa.
                        </Text>

                        {/* 4. LOCALISATION */}
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: COLORS.text }]}>Emplacement</Text>
                            <TouchableOpacity><Text style={{color: COLORS.primary, fontFamily: 'PJS-Bold'}}>Voir Maps</Text></TouchableOpacity>
                        </View>
                        <View style={[styles.mapContainer, { backgroundColor: COLORS.surface }]}>
                            <Image 
                                source={require('../../../assets/images/parcel2.jpg')} 
                                style={[styles.mapImage, { opacity: 0.6 }]}
                            />
                            <View style={styles.mapPin}>
                                <View style={[styles.pinCircle, { backgroundColor: COLORS.primary }]} />
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* 5. FOOTER DE RÉSERVATION */}
                <View style={[styles.bottomBar, { backgroundColor: COLORS.bg, borderTopColor: COLORS.border }]}>
                    <View style={styles.priceInfo}>
                        <Text style={[styles.priceSub, { color: COLORS.textMuted }]}>Prix par jour</Text>
                        <Text style={[styles.totalPrice, { color: COLORS.primary }]}>150.000 <Text style={styles.currency}>CFA</Text></Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.reserveBtn} 
                        activeOpacity={0.8}
                        onPress={() => router.push('/marche/reserver')}
                    >
                        <LinearGradient 
                            colors={[COLORS.accent, COLORS.primary]} 
                            start={{x:0, y:0}} end={{x:1, y:0}}
                            style={styles.reserveGradient}
                        >
                            <Text style={styles.reserveText}>Réserver</Text>
                            <Feather name="chevron-right" size={20} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, alignItems: 'center' },
    innerContainer: { flex: 1, overflow: 'hidden' },
    flex: { flex: 1 },

    // Correction du Header
    floatingHeader: { 
        position: 'absolute', 
        top: Platform.OS === 'ios' ? 50 : 20, // Positionnement manuel pour éviter les bugs de SafeAreaView
        left: 0, 
        right: 0, 
        zIndex: 999, // Priorité absolue sur le reste
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20,
    },
    backBtn: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)', // Couleur légèrement plus visible
    },
    headerRightActions: { flexDirection: 'row' },
    circleBtn: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },

    imageWrapper: { width: '100%', height: 400 },
    mainImage: { width: '100%', height: '100%' },
    imageOverlay: { ...StyleSheet.absoluteFillObject },
    statusBadge: { position: 'absolute', bottom: 50, left: 20, backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', elevation: 5 },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
    statusText: { fontFamily: 'PJS-ExtraBold', fontSize: 10, color: '#065F46' },
    paginationDots: { position: 'absolute', bottom: 50, right: 20, flexDirection: 'row', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    activeDot: { backgroundColor: 'white', width: 18 },
    contentCard: { flex: 1, marginTop: -35, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontFamily: 'PJS-ExtraBold' },
    ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingText: { marginLeft: 4, fontFamily: 'PJS-Bold', fontSize: 14 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    locationText: { marginLeft: 6, fontSize: 14, fontFamily: 'PJS-Medium' },
    specGrid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 30 },
    specBox: { width: '30%', paddingVertical: 18, borderRadius: 24, alignItems: 'center', borderWidth: 1 },
    specLabel: { fontSize: 9, fontFamily: 'PJS-ExtraBold', marginTop: 10, letterSpacing: 1 },
    specValue: { fontSize: 15, fontFamily: 'PJS-Bold', marginTop: 4 },
    sectionTitle: { fontSize: 18, fontFamily: 'PJS-ExtraBold', marginBottom: 12 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 15 },
    description: { fontSize: 15, lineHeight: 24, fontFamily: 'PJS-Medium' },
    mapContainer: { width: '100%', height: 180, borderRadius: 30, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    mapImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    mapPin: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center' },
    pinCircle: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: 'white' },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, paddingBottom: 20, borderTopWidth: 1 },
    priceInfo: { flex: 1 },
    priceSub: { fontSize: 12, fontFamily: 'PJS-SemiBold' },
    totalPrice: { fontSize: 22, fontFamily: 'PJS-ExtraBold' },
    currency: { fontSize: 14, fontFamily: 'PJS-Bold' },
    reserveBtn: { width: '55%', height: 58, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#065F46', shadowOpacity: 0.3, shadowRadius: 10 },
    reserveGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    reserveText: { color: 'white', fontFamily: 'PJS-ExtraBold', fontSize: 16 }
});