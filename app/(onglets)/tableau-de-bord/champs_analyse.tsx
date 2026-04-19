import { PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, Path, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 500;
const ACTUAL_WIDTH = WINDOW_WIDTH > MAX_WIDTH ? MAX_WIDTH : WINDOW_WIDTH;

const COLORS = {
    primary: '#065F46', // Vert foncé signature
    accent: '#10B981',  // Vert émeraude
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#0F172A',
    subText: '#64748B',
    border: '#F1F5F9',
    blue: '#3b82f6',
    orange: '#f59e0b',
};

export default function FieldAnalyticsScreen() {
    const router = useRouter();
    const { user, isReady } = useAuth();

    useEffect(() => {
        if (!isReady || !user) return;
        if (user.role === 'client') {
            router.replace('/tableau-de-bord');
        }
    }, [isReady, user, router]);

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    if (!fontsLoaded) return null;

    return (
        <View style={styles.outerContainer}>
            <SafeAreaView style={[styles.container, { width: ACTUAL_WIDTH }]}>
                <StatusBar barStyle="dark-content" />

                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Analyse Parcelle</Text>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Capteurs en direct</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.headerBtn}>
                        <Ionicons name="share-outline" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    
                    {/* YIELD SECTION */}
                    <View style={styles.heroSection}>
                        <Text style={styles.tagline}>RENDEMENT PRÉVU</Text>
                        <View style={styles.yieldRow}>
                            <Text style={styles.mainValue}>12.4</Text>
                            <View style={styles.unitContainer}>
                                <Text style={styles.mainUnit}>Tons/Ha</Text>
                                <View style={styles.trendBadge}>
                                    <Ionicons name="trending-up" size={12} color={COLORS.accent} />
                                    <Text style={styles.trendText}>+15%</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* CHART BENTO */}
                    <View style={styles.chartBento}>
                        <View style={styles.chartHeader}>
                            <View>
                                <Text style={styles.chartTitle}>Indice de Croissance</Text>
                                <Text style={styles.chartSub}>Santé foliaire (NDVI)</Text>
                            </View>
                            <View style={styles.timePills}>
                                <TouchableOpacity style={[styles.pill, styles.pillActive]}>
                                    <Text style={styles.pillTextActive}>1M</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.pill}>
                                    <Text style={styles.pillText}>3M</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        <View style={styles.svgWrapper}>
                            <Svg height="140" width={ACTUAL_WIDTH - 80} viewBox="0 0 400 120">
                                <Defs>
                                    <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <Stop offset="0" stopColor={COLORS.accent} stopOpacity="0.2" />
                                        <Stop offset="1" stopColor={COLORS.accent} stopOpacity="0" />
                                    </SvgGradient>
                                </Defs>
                                <Path
                                    d="M0 100 Q 50 80, 100 20 T 200 60 T 300 90 T 400 20 V 120 H 0 Z"
                                    fill="url(#grad)"
                                />
                                <Path
                                    d="M0 100 Q 50 80, 100 20 T 200 60 T 300 90 T 400 20"
                                    stroke={COLORS.accent}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </Svg>
                        </View>
                    </View>

                    {/* COMPOSITION SOL */}
                    <Text style={styles.sectionLabel}>COMPOSITION DU SOL</Text>
                    <View style={styles.soilGrid}>
                        <SoilBento label="Nitrogène" value="42" unit="mg" progress={0.8} color={COLORS.accent} />
                        <SoilBento label="Phosphore" value="28" unit="mg" progress={0.6} color="#6366F1" />
                    </View>
                    <View style={[styles.soilGrid, {marginTop: 12}]}>
                        <SoilBento label="Potassium" value="35" unit="mg" progress={0.7} color={COLORS.orange} />
                        <View style={styles.riskSmallCard}>
                             <Ionicons name="water" size={24} color={COLORS.blue} />
                             <Text style={styles.riskSmallValue}>72%</Text>
                             <Text style={styles.riskSmallLabel}>Humidité</Text>
                        </View>
                    </View>

                    {/* AI RECOMMENDATION */}
                    <View style={styles.aiCard}>
                        <LinearGradient colors={['#065F46', '#044231']} style={styles.aiGradient}>
                            <View style={styles.aiHeader}>
                                <View style={styles.aiIconBg}>
                                    <MaterialIcons name="auto-awesome" size={16} color={COLORS.accent} />
                                </View>
                                <Text style={styles.aiTitle}>RECOMMANDATION IA</Text>
                            </View>
                            <Text style={styles.aiText}>
                                Les capteurs détectent un stress hydrique léger. Augmentez l'irrigation de <Text style={{color: COLORS.accent, fontWeight: '700'}}>5%</Text> ce soir.
                            </Text>
                            <TouchableOpacity style={styles.aiBtn}>
                                <Text style={styles.aiBtnText}>Appliquer l'optimisation</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>

                    <View style={{height: 40}} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const SoilBento = ({ label, value, unit, progress, color }: any) => (
    <View style={styles.soilBento}>
        <Text style={styles.soilBentoLabel}>{label}</Text>
        <Text style={styles.soilBentoValue}>{value}<Text style={styles.soilBentoUnit}> {unit}</Text></Text>
        <View style={styles.miniProgress}>
            <View style={[styles.miniProgressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center' },
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 15, paddingBottom: 10 },
    headerBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 16, fontFamily: 'PJS-Bold', color: COLORS.text },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
    statusText: { fontSize: 11, fontFamily: 'PJS-SemiBold', color: COLORS.subText },
    
    scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
    
    heroSection: { marginBottom: 30 },
    tagline: { fontSize: 11, fontFamily: 'PJS-ExtraBold', color: COLORS.subText, letterSpacing: 1.5 },
    yieldRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
    mainValue: { fontSize: 58, fontFamily: 'PJS-ExtraBold', color: COLORS.text, lineHeight: 65, letterSpacing: -2 },
    unitContainer: { marginLeft: 12, justifyContent: 'center', paddingTop: 8 },
    mainUnit: { fontSize: 16, fontFamily: 'PJS-Bold', color: COLORS.subText },
    trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
    trendText: { fontSize: 12, fontFamily: 'PJS-Bold', color: COLORS.accent },

    chartBento: { backgroundColor: COLORS.surface, borderRadius: 30, padding: 24, borderWidth: 1, borderColor: COLORS.border },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    chartTitle: { fontSize: 17, fontFamily: 'PJS-Bold', color: COLORS.text },
    chartSub: { fontSize: 12, fontFamily: 'PJS-Medium', color: COLORS.subText, marginTop: 2 },
    timePills: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4 },
    pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    pillActive: { backgroundColor: '#FFF' },
    pillText: { fontSize: 11, fontFamily: 'PJS-Bold', color: COLORS.subText },
    pillTextActive: { fontSize: 11, fontFamily: 'PJS-Bold', color: COLORS.text },
    svgWrapper: { alignItems: 'center', marginTop: 10 },

    sectionLabel: { fontSize: 12, fontFamily: 'PJS-ExtraBold', color: COLORS.text, marginTop: 35, marginBottom: 15, letterSpacing: 1 },
    soilGrid: { flexDirection: 'row', gap: 12 },
    soilBento: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border },
    soilBentoLabel: { fontSize: 12, fontFamily: 'PJS-Bold', color: COLORS.subText, marginBottom: 10 },
    soilBentoValue: { fontSize: 26, fontFamily: 'PJS-ExtraBold', color: COLORS.text },
    soilBentoUnit: { fontSize: 13, fontFamily: 'PJS-Bold', color: COLORS.subText },
    miniProgress: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 15 },
    miniProgressFill: { height: '100%', borderRadius: 3 },

    riskSmallCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 24, padding: 20, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
    riskSmallValue: { fontSize: 22, fontFamily: 'PJS-ExtraBold', color: COLORS.text, marginTop: 6 },
    riskSmallLabel: { fontSize: 12, fontFamily: 'PJS-Bold', color: COLORS.subText },

    aiCard: { marginTop: 25, borderRadius: 30, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    aiGradient: { padding: 24 },
    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    aiIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center' },
    aiTitle: { fontSize: 12, fontFamily: 'PJS-ExtraBold', color: COLORS.accent, letterSpacing: 1 },
    aiText: { color: '#F1F5F9', fontSize: 15, fontFamily: 'PJS-Medium', lineHeight: 24 },
    aiBtn: { backgroundColor: COLORS.accent, marginTop: 20, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
    aiBtnText: { fontFamily: 'PJS-ExtraBold', fontSize: 14, color: COLORS.primary },
});