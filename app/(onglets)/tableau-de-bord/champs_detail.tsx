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
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import {
    ImageBackground,
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

const COLORS = {
    primary: '#065F46', // Vert foncé signature
    accent: '#076546',
    bgLight: '#FFFFFF',
    surface: '#F8FAFC',
    textDark: '#0F172A',
    muted: '#64748B',
    border: '#F1F5F9',
    warning: '#F59E0B',
    error: '#EF4444',
};

export default function CropDetails() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const CONTAINER_WIDTH = useMemo(() => Math.min(SCREEN_WIDTH, MAX_WIDTH), [SCREEN_WIDTH]);
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
        'PJS-Medium': PlusJakartaSans_500Medium,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    if (!fontsLoaded) return null;

    return (
        <View style={styles.outerContainer}>
            <StatusBar barStyle="dark-content" />
            
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH }]}>
                
                {/* Header Premium */}
                <SafeAreaView style={styles.headerSafe}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="chevron-back" size={24} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Gestion Parcelle</Text>
                        <TouchableOpacity style={styles.moreBtn}>
                            <Feather name="more-vertical" size={20} color={COLORS.textDark} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                    
                    {/* Hero Section */}
                    <View style={styles.heroContainer}>
                        <ImageBackground 
                            source={{ uri: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=600&auto=format&fit=crop' }}
                            style={styles.heroImage}
                            imageStyle={{ borderRadius: 32 }}
                        >
                            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']} style={styles.heroOverlay}>
                                <View style={[styles.heroBadge, { backgroundColor: COLORS.primary }]}>
                                    <Text style={styles.heroBadgeText}>PARCELLE ACTIVE</Text>
                                </View>
                                <Text style={styles.heroMainTitle}>Maïs • Champ Nord</Text>
                                <View style={styles.heroLocationRow}>
                                    <Ionicons name="location-outline" size={14} color="#FFF" opacity={0.8} />
                                    <Text style={styles.heroLocationText}>Secteur B12 • Dakar, SN</Text>
                                </View>
                            </LinearGradient>
                        </ImageBackground>
                    </View>

                    {/* Stats de Santé */}
                    <View style={styles.statsGrid}>
                        <StatCard icon="leaf-outline" label="Santé" value="94%" color={COLORS.primary} />
                        <StatCard icon="water-outline" label="Humidité" value="42%" color="#3B82F6" />
                        <StatCard icon="analytics-outline" label="Prévision" value="+12%" color={COLORS.warning} />
                    </View>

                    {/* Qualité du Sol */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Qualité du Sol</Text>
                        <View style={styles.liveIndicator}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.liveText}>EN DIRECT</Text>
                        </View>
                    </View>

                    <View style={styles.soilCard}>
                        <View style={styles.soilTextRow}>
                            <Text style={styles.soilValue}>Excellente</Text>
                            <Text style={styles.soilSub}>Taux d'azote stable</Text>
                        </View>
                        <View style={styles.chartContainer}>
                            {[45, 60, 45, 75, 50, 90, 65, 80].map((h, i) => (
                                <View 
                                    key={i} 
                                    style={[
                                        styles.chartBar, 
                                        { height: `${h}%`, backgroundColor: i === 5 ? COLORS.primary : '#E2E8F0' }
                                    ]} 
                                />
                            ))}
                        </View>
                    </View>

                    {/* IA Assistant */}
                    <Text style={styles.sectionTitle}>Assistant IA • Actions</Text>
                    <View style={styles.taskContainer}>
                        <TaskItem 
                            title="Irrigation Recommandée" 
                            time="Aujourd'hui à 18:00" 
                            icon="water-outline" 
                            color="#3B82F6" 
                        />
                        <TaskItem 
                            title="Alerte Nutriments" 
                            time="Baisse d'azote détectée" 
                            icon="alert-circle-outline" 
                            color={COLORS.warning} 
                        />
                    </View>

                    {/* Timeline Cultural */}
                    <Text style={styles.sectionTitle}>Calendrier de Croissance</Text>
                    <View style={styles.timelineCard}>
                        <TimelineStep title="Semis" date="15 Mai" status="completed" />
                        <TimelineStep title="Développement" date="En cours" status="active" />
                        <TimelineStep title="Récolte" date="~ 15 Septembre" status="pending" isLast />
                    </View>

                    <View style={{ height: 140 }} />
                </ScrollView>

                {/* Bouton d'analyse flottant avec Vert Foncé Dégradé */}
                <View style={styles.fabWrapper}>
                    <TouchableOpacity 
                        style={styles.fab} 
                        onPress={() => router.push('/tableau-de-bord/champs_analyse')}
                        activeOpacity={0.9}
                    >
                        <LinearGradient 
                            colors={['#065F46', '#044231']} // Vert très foncé premium
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
                            style={styles.fabGradient}
                        >
                            <MaterialCommunityIcons name="auto-fix" size={24} color="#FFF" />
                            <Text style={styles.fabText}>Démarrer Analyse IA</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );
}

// --- Sous-Composants ---

const StatCard = ({ icon, label, value, color }) => (
    <View style={styles.statCard}>
        <View style={[styles.statIconBg, { backgroundColor: color + '12' }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

const TaskItem = ({ title, time, icon, color }) => (
    <View style={[styles.taskItem, { borderLeftColor: color }]}>
        <View style={[styles.taskIconBg, { backgroundColor: color + '10' }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.taskContent}>
            <Text style={styles.taskTitle}>{title}</Text>
            <Text style={styles.taskTime}>{time}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </View>
);

const TimelineStep = ({ title, date, status, isLast }) => (
    <View style={styles.timelineRow}>
        <View style={styles.timelineLeft}>
            <View style={[
                styles.timelineDot, 
                status === 'completed' && { backgroundColor: COLORS.primary },
                status === 'active' && { backgroundColor: COLORS.primary, borderWidth: 3, borderColor: '#ECFDF5' }
            ]} />
            {!isLast && <View style={styles.timelineLine} />}
        </View>
        <View style={styles.timelineRight}>
            <Text style={[styles.timelineTitle, status === 'pending' && { color: COLORS.muted }]}>{title}</Text>
            <Text style={styles.timelineDate}>{date}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center' },
    innerContainer: { flex: 1, backgroundColor: COLORS.bgLight },
    headerSafe: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60 },
    headerTitle: { fontFamily: 'PJS-Bold', fontSize: 16, color: COLORS.textDark },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    moreBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    scrollBody: { paddingTop: 20 },
    heroContainer: { paddingHorizontal: 20, marginBottom: 25 },
    heroImage: { height: 260, justifyContent: 'flex-end', overflow: 'hidden' },
    heroOverlay: { padding: 25, height: '100%', justifyContent: 'flex-end' },
    heroBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
    heroBadgeText: { color: '#FFF', fontSize: 10, fontFamily: 'PJS-ExtraBold', letterSpacing: 1 },
    heroMainTitle: { color: '#FFF', fontSize: 26, fontFamily: 'PJS-ExtraBold' },
    heroLocationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 5 },
    heroLocationText: { color: '#FFF', fontSize: 13, fontFamily: 'PJS-Medium', opacity: 0.8 },
    statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: -45 },
    statCard: { flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
    statIconBg: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    statLabel: { fontSize: 11, color: COLORS.muted, fontFamily: 'PJS-Medium' },
    statValue: { fontSize: 18, fontFamily: 'PJS-ExtraBold', color: COLORS.textDark, marginTop: 2 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginTop: 35, marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontFamily: 'PJS-ExtraBold', color: COLORS.textDark, paddingHorizontal: 25, marginTop: 35, marginBottom: 15 },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginRight: 6 },
    liveText: { fontSize: 10, fontFamily: 'PJS-ExtraBold', color: '#EF4444' },
    soilCard: { marginHorizontal: 20, backgroundColor: COLORS.surface, padding: 20, borderRadius: 28, borderWidth: 1, borderColor: COLORS.border },
    soilTextRow: { marginBottom: 20 },
    soilValue: { fontSize: 22, fontFamily: 'PJS-ExtraBold', color: COLORS.textDark },
    soilSub: { fontSize: 13, color: COLORS.muted, fontFamily: 'PJS-Medium', marginTop: 2 },
    chartContainer: { height: 60, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    chartBar: { flex: 1, borderRadius: 4 },
    taskContainer: { paddingHorizontal: 20, gap: 12 },
    taskItem: { backgroundColor: '#FFF', padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderWidth: 1, borderColor: COLORS.border },
    taskIconBg: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    taskContent: { flex: 1, marginLeft: 15 },
    taskTitle: { fontSize: 15, fontFamily: 'PJS-Bold', color: COLORS.textDark },
    taskTime: { fontSize: 12, color: COLORS.muted, fontFamily: 'PJS-Medium', marginTop: 2 },
    timelineCard: { marginHorizontal: 20, padding: 25, backgroundColor: COLORS.surface, borderRadius: 28 },
    timelineRow: { flexDirection: 'row', minHeight: 60 },
    timelineLeft: { alignItems: 'center', width: 20, marginRight: 15 },
    timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#CBD5E1' },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
    timelineRight: { flex: 1, paddingBottom: 20 },
    timelineTitle: { fontSize: 15, fontFamily: 'PJS-Bold', color: COLORS.textDark },
    timelineDate: { fontSize: 12, color: COLORS.muted, fontFamily: 'PJS-Medium', marginTop: 2 },
    fabWrapper: { position: 'absolute', bottom: 30, left: 0, right: 0, paddingHorizontal: 25 },
    fab: { borderRadius: 22, overflow: 'hidden', elevation: 8, shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 15 },
    fabGradient: { height: 64, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
    fabText: { fontSize: 16, fontFamily: 'PJS-ExtraBold', color: '#FFF' },
});