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
import React, { useState } from 'react';
import {
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

const MAX_WIDTH = 500;

export default function LandDetailsScreen() {
    const router = useRouter();
    const { width: windowWidth } = useWindowDimensions();
    const CONTAINER_WIDTH = Math.min(windowWidth, MAX_WIDTH);

    const [selectedPeriod, setSelectedPeriod] = useState(0);

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

    if (!fontsLoaded) return null;

    const PERIODS = [
        { label: 'Saison A', dates: 'Mars - Juin' },
        { label: 'Saison B', dates: 'Juillet - Oct' },
        { label: 'Annuel', dates: '2026 - 2027' },
    ];

    return (
        <View style={[styles.outerContainer, { backgroundColor: COLORS.outerBg }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: COLORS.background }]}>
                
                <SafeAreaView style={styles.flex}>
                    {/* Header Flottant */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Feather name="arrow-left" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Détails de la Terre</Text>
                        <TouchableOpacity style={styles.backBtn}>
                            <Feather name="share-2" size={20} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        
                        {/* 1. IMAGE HERO & BADGE */}
                        <View style={styles.imageWrapper}>
                            <Image 
                                source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000' }} 
                                style={styles.mainImage}
                            />
                            <View style={styles.overlayBadge}>
                                <MaterialCommunityIcons name="Check-decagram" size={16} color="white" />
                                <Text style={styles.badgeText}>TITRE FONCIER VÉRIFIÉ</Text>
                            </View>
                        </View>

                        {/* 2. INFOS GÉNÉRALES */}
                        <View style={styles.infoSection}>
                            <View style={styles.titleRow}>
                                <Text style={styles.landTitle}>Vallée de la Teranga</Text>
                                <View style={styles.priceTag}>
                                    <Text style={styles.priceText}>12.5 Ha</Text>
                                </View>
                            </View>
                            <View style={styles.locationRow}>
                                <Ionicons name="location" size={16} color={COLORS.accent} />
                                <Text style={styles.locationText}>Région de Thiès, Sénégal</Text>
                            </View>
                        </View>

                        {/* 3. GRILLE TECHNIQUE (DESIGN SPÉCIFICATIONS) */}
                        <Text style={styles.sectionTitle}>Analyse du Sol</Text>
                        <View style={styles.specGrid}>
                            <View style={styles.specBox}>
                                <MaterialCommunityIcons name="ph" size={22} color={COLORS.primary} />
                                <Text style={styles.specLabel}>PH DU SOL</Text>
                                <Text style={styles.specValue}>6.5 (Idéal)</Text>
                            </View>
                            <View style={styles.specBox}>
                                <MaterialCommunityIcons name="water-percent" size={22} color={COLORS.primary} />
                                <Text style={styles.specLabel}>HUMIDITÉ</Text>
                                <Text style={styles.specValue}>45% Avg.</Text>
                            </View>
                            <View style={styles.specBox}>
                                <MaterialCommunityIcons name="texture-box" size={22} color={COLORS.primary} />
                                <Text style={styles.specLabel}>TYPE</Text>
                                <Text style={styles.specValue}>Limoneux</Text>
                            </View>
                        </View>

                        {/* 4. CHOIX DE LA PÉRIODE DE LOCATION */}
                        <Text style={styles.sectionTitle}>Disponibilité de location</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodList}>
                            {PERIODS.map((item, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    onPress={() => setSelectedPeriod(index)}
                                    style={[
                                        styles.periodCard,
                                        selectedPeriod === index && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                                    ]}
                                >
                                    <Text style={[styles.periodLabel, selectedPeriod === index && { color: 'rgba(255,255,255,0.8)' }]}>{item.label}</Text>
                                    <Text style={[styles.periodDates, selectedPeriod === index && { color: 'white' }]}>{item.dates}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* 5. DESCRIPTION */}
                        <Text style={styles.sectionTitle}>Description foncière</Text>
                        <View style={styles.descriptionCard}>
                            <Text style={styles.descriptionText}>
                                Terre arable de haute qualité, anciennement utilisée pour la culture arachidière. 
                                Accès direct à une source d'eau (forage à 50m). Terrain plat, sécurisé par clôture naturelle. 
                                Certifié par AgroConnect Africa pour l'agriculture biologique.
                            </Text>
                        </View>

                    </ScrollView>

                    {/* FOOTER ACTION */}
                    <View style={styles.footer}>
                        <View style={styles.footerInfo}>
                            <Text style={styles.footerLabel}>Loyer mensuel</Text>
                            <Text style={styles.footerPrice}>85.000 <Text style={styles.currency}>CFA/Ha</Text></Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.reserveBtn}
                            onPress={() => router.push('/marche/louer_terrain')}
                        >
                            <LinearGradient
                                colors={[COLORS.accent, COLORS.primary]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.btnGradient}
                            >
                                <Text style={styles.btnText}>Louer la Terre</Text>
                                <Feather name="arrow-right" size={20} color="white" />
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
    innerContainer: { flex: 1, overflow: 'hidden' },
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
    headerTitle: { fontSize: 17, fontFamily: 'PJS-ExtraBold', color: '#0F172A' },
    
    scrollContent: { paddingBottom: 120 },
    imageWrapper: { width: '100%', height: 250, position: 'relative' },
    mainImage: { width: '100%', height: '100%' },
    overlayBadge: { position: 'absolute', bottom: 15, left: 20, backgroundColor: '#065F46', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
    badgeText: { color: 'white', fontFamily: 'PJS-ExtraBold', fontSize: 10, letterSpacing: 0.5 },

    infoSection: { padding: 25 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    landTitle: { fontSize: 24, fontFamily: 'PJS-ExtraBold', color: '#0F172A', flex: 1 },
    priceTag: { backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    priceText: { color: '#065F46', fontFamily: 'PJS-Bold', fontSize: 16 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 5 },
    locationText: { color: '#64748B', fontFamily: 'PJS-Medium', fontSize: 14 },

    sectionTitle: { fontSize: 16, fontFamily: 'PJS-ExtraBold', color: '#0F172A', marginTop: 10, marginHorizontal: 25, marginBottom: 15 },
    
    specGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, marginBottom: 25 },
    specBox: { width: '30%', padding: 15, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
    specLabel: { fontSize: 9, fontFamily: 'PJS-ExtraBold', color: '#64748B', marginTop: 8, letterSpacing: 1 },
    specValue: { fontSize: 13, fontFamily: 'PJS-Bold', color: '#0F172A', marginTop: 2 },

    periodList: { paddingHorizontal: 25, gap: 12, marginBottom: 25 },
    periodCard: { paddingHorizontal: 20, paddingVertical: 15, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#F8FAFC', minWidth: 120 },
    periodLabel: { fontSize: 11, fontFamily: 'PJS-SemiBold', color: '#64748B', textTransform: 'uppercase' },
    periodDates: { fontSize: 15, fontFamily: 'PJS-ExtraBold', color: '#0F172A', marginTop: 4 },

    descriptionCard: { marginHorizontal: 25, padding: 20, backgroundColor: '#F8FAFC', borderRadius: 24, borderWidth: 1, borderColor: '#F1F5F9' },
    descriptionText: { fontSize: 14, fontFamily: 'PJS-Medium', color: '#475569', lineHeight: 22 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 25, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
    footerInfo: { flex: 1 },
    footerLabel: { fontSize: 12, fontFamily: 'PJS-Medium', color: '#64748B' },
    footerPrice: { fontSize: 20, fontFamily: 'PJS-ExtraBold', color: '#065F46' },
    currency: { fontSize: 12, fontFamily: 'PJS-Bold' },
    reserveBtn: { width: '55%', height: 58, borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#065F46', shadowOpacity: 0.2, shadowRadius: 8 },
    btnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    btnText: { color: 'white', fontSize: 16, fontFamily: 'PJS-ExtraBold' }
});