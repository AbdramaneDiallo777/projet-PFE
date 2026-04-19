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
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    SafeAreaView,
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
/** Réserve pour la barre d’onglets `(onglets)` — même logique que louer_terrain / panier. */
const TAB_BAR_RESERVE = 88;

/** Montant démo affiché sur l’écran ; transmis au paiement (centimes « logiques » ×100 pour formatAmount). */
const RESERVATION_TOTAL_CENTS = 150_000 * 100;

export default function ReservationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const bottomPad = TAB_BAR_RESERVE + Math.max(insets.bottom, 8);
    const { title: titleParam } = useLocalSearchParams<{ title?: string }>();
    const serviceTitle =
        typeof titleParam === 'string' ? titleParam : Array.isArray(titleParam) ? titleParam[0] : '';
    const { width: windowWidth } = useWindowDimensions();
    const CONTAINER_WIDTH = Math.min(windowWidth, MAX_WIDTH);

    const reservationTitleParam = useMemo(
        () => (serviceTitle.trim() ? serviceTitle.trim() : 'Réservation terrain'),
        [serviceTitle]
    );

    const [selectedDate, setSelectedDate] = useState(2);
    const [selectedTime, setSelectedTime] = useState('matin');

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

    const DAYS = [
        { day: 'Lun', date: '24', month: 'Mar' },
        { day: 'Mar', date: '25', month: 'Mar' },
        { day: 'Mer', date: '26', month: 'Mar' },
        { day: 'Jeu', date: '27', month: 'Mar' },
        { day: 'Ven', date: '28', month: 'Mar' },
        { day: 'Sam', date: '29', month: 'Mar' },
    ];

    return (
        <View style={[styles.outerContainer, { backgroundColor: COLORS.outerBg }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: COLORS.background }]}>
                
                <SafeAreaView style={styles.flex}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Feather name="arrow-left" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>
                            {serviceTitle ? `Réservation · ${serviceTitle}` : 'Finaliser la réservation'}
                        </Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 28 }]}
                    >
                        
                        {/* 1. CALENDRIER HORIZONTAL */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Date de début</Text>
                            <Text style={styles.monthText}>Mars 2026</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
                            {DAYS.map((item, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    onPress={() => setSelectedDate(index)}
                                    style={[
                                        styles.dateCard,
                                        selectedDate === index && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                                    ]}
                                >
                                    <Text style={[styles.dayText, selectedDate === index && { color: 'rgba(255,255,255,0.7)' }]}>{item.day}</Text>
                                    <Text style={[styles.dateNumber, selectedDate === index && { color: 'white' }]}>{item.date}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* 2. PLAGE HORAIRE */}
                        <Text style={styles.sectionTitle}>Plage horaire</Text>
                        <View style={styles.timeGrid}>
                            <TouchableOpacity 
                                onPress={() => setSelectedTime('matin')}
                                style={[styles.timeOption, selectedTime === 'matin' && styles.timeOptionActive]}
                            >
                                <MaterialCommunityIcons name="weather-sunset-up" size={20} color={selectedTime === 'matin' ? COLORS.primary : COLORS.textMuted} />
                                <Text style={[styles.timeText, selectedTime === 'matin' && { color: COLORS.primary }]}>Matin (08h - 12h)</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => setSelectedTime('journee')}
                                style={[styles.timeOption, selectedTime === 'journee' && styles.timeOptionActive]}
                            >
                                <MaterialCommunityIcons name="weather-sunny" size={20} color={selectedTime === 'journee' ? COLORS.primary : COLORS.textMuted} />
                                <Text style={[styles.timeText, selectedTime === 'journee' && { color: COLORS.primary }]}>Journée (08h - 18h)</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 3. DÉTAILS SUPPLÉMENTAIRES */}
                        <Text style={styles.sectionTitle}>Options du service</Text>
                        <View style={styles.optionsWrapper}>
                            <View style={styles.optionItem}>
                                <View style={styles.optionInfo}>
                                    <Text style={styles.optionTitle}>Chauffeur inclus</Text>
                                    <Text style={styles.optionSub}>Opérateur certifié John Deere</Text>
                                </View>
                                <Ionicons name="checkbox" size={24} color={COLORS.primary} />
                            </View>

                            <View style={[styles.optionItem, { borderBottomWidth: 0 }]}>
                                <View style={styles.optionInfo}>
                                    <Text style={styles.optionTitle}>Carburant</Text>
                                    <Text style={styles.optionSub}>Plein à la charge du locataire</Text>
                                </View>
                                <Ionicons name="information-circle-outline" size={24} color={COLORS.textMuted} />
                            </View>
                        </View>

                        {/* 4. ZONE DE TEXTE */}
                        <Text style={styles.sectionTitle}>Instructions particulières</Text>
                        <TextInput 
                            style={styles.textArea}
                            placeholder="Ex: Terrain en pente, sol argileux..."
                            placeholderTextColor={COLORS.textMuted}
                            multiline
                            numberOfLines={4}
                        />

                    </ScrollView>

                    {/* FOOTER FIXE */}
                    <View style={[styles.footer, { paddingBottom: 25 + bottomPad }]}>
                        <View style={styles.summaryContainer}>
                            <Text style={styles.summaryLabel}>Total (1 jour)</Text>
                            <Text style={styles.summaryPrice}>150.000 CFA</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.mainBtn}
                            onPress={() =>
                                router.push({
                                    pathname: '/marche/PaymentDetails',
                                    params: {
                                        reservation: '1',
                                        reservationTitle: reservationTitleParam,
                                        reservationTotalCents: String(RESERVATION_TOTAL_CENTS),
                                    },
                                })
                            }
                        >
                            <LinearGradient
                                colors={[COLORS.accent, COLORS.primary]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.btnGradient}
                            >
                                <Text style={styles.btnText}>Continuer</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60 },
    backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    headerTitle: { fontSize: 17, fontFamily: 'PJS-ExtraBold', color: '#0F172A' },
    
    scrollContent: { padding: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 16, fontFamily: 'PJS-ExtraBold', color: '#0F172A', marginTop: 20, marginBottom: 15 },
    monthText: { fontSize: 14, fontFamily: 'PJS-Bold', color: '#065F46' },

    dateList: { gap: 12, paddingRight: 20 },
    dateCard: { width: 65, height: 85, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    dayText: { fontSize: 11, fontFamily: 'PJS-SemiBold', color: '#64748B', textTransform: 'uppercase' },
    dateNumber: { fontSize: 19, fontFamily: 'PJS-ExtraBold', color: '#0F172A', marginTop: 4 },

    timeGrid: { gap: 10 },
    timeOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#F1F5F9', gap: 12 },
    timeOptionActive: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
    timeText: { fontSize: 14, fontFamily: 'PJS-Bold', color: '#64748B' },

    optionsWrapper: { backgroundColor: '#F8FAFC', borderRadius: 22, paddingHorizontal: 18, borderWidth: 1, borderColor: '#F1F5F9' },
    optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    optionInfo: { flex: 1 },
    optionTitle: { fontSize: 15, fontFamily: 'PJS-Bold', color: '#0F172A' },
    optionSub: { fontSize: 12, fontFamily: 'PJS-Medium', color: '#64748B', marginTop: 2 },

    textArea: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 18, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#F1F5F9', fontFamily: 'PJS-Medium', color: '#0F172A' },

    footer: { padding: 25, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', backgroundColor: 'white' },
    summaryContainer: { flex: 1 },
    summaryLabel: { fontSize: 12, fontFamily: 'PJS-Medium', color: '#64748B' },
    summaryPrice: { fontSize: 20, fontFamily: 'PJS-ExtraBold', color: '#065F46' },
    mainBtn: { width: '50%', height: 58, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: '#065F46', shadowOpacity: 0.3, shadowRadius: 10 },
    btnGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    btnText: { color: 'white', fontSize: 16, fontFamily: 'PJS-ExtraBold' }
});