import MapView, { Marker, Polyline } from '@/components/map/MapPrimitives';
import {
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Package, Truck } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const MAX_WIDTH = 500;
const COLORS = {
    primary: '#065F46',
    text: '#0F172A',
    muted: '#64748B',
    line: '#10B981',
};

/** Trajet démo (Abidjan → entrepôt périphérie). */
const ROUTE = [
    { latitude: 5.3600, longitude: -4.0083 },
    { latitude: 5.345, longitude: -3.99 },
    { latitude: 5.33, longitude: -3.97 },
    { latitude: 5.318, longitude: -3.955 },
];

const STEPS = [
    { label: 'Commande confirmée', done: true, time: '09:12' },
    { label: 'Préparation entrepôt', done: true, time: '11:40' },
    { label: 'En route', done: true, time: '14:05' },
    { label: 'Livraison estimée', done: false, time: '17:30' },
];

export default function SuiviLivraisonPage() {
    const router = useRouter();
    const params = useLocalSearchParams<{ orderRef?: string | string[] }>();
    const orderRef = useMemo(() => {
        const v = params.orderRef;
        const s = Array.isArray(v) ? v[0] : v;
        return s?.trim() || '—';
    }, [params.orderRef]);

    const [fontsLoaded] = useFonts({
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
    });
    const f = fontsLoaded ? { semi: { fontFamily: 'PJS-SemiBold' as const }, bold: { fontFamily: 'PJS-Bold' as const } } : { semi: {}, bold: {} };

    const initialRegion = {
        latitude: 5.335,
        longitude: -3.98,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
    };

    if (!fontsLoaded) return null;

    return (
        <View style={styles.outer}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, f.bold]}>Suivi de livraison</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                    <View style={styles.refCard}>
                        <Package color={COLORS.primary} size={22} strokeWidth={2} />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={[styles.refLabel, f.semi]}>Référence commande</Text>
                            <Text style={[styles.refValue, f.bold]}>{orderRef}</Text>
                        </View>
                        <Truck color={COLORS.muted} size={20} />
                    </View>

                    <View style={styles.mapWrap}>
                        <MapView style={styles.map} initialRegion={initialRegion} scrollEnabled={false} pitchEnabled={false}>
                            <Polyline coordinates={ROUTE} strokeColor={COLORS.line} strokeWidth={4} />
                            <Marker coordinate={ROUTE[0]} title="Départ" pinColor={COLORS.primary} />
                            <Marker coordinate={ROUTE[ROUTE.length - 1]} title="Destination" pinColor="#F59E0B" />
                        </MapView>
                        <Text style={[styles.mapHint, f.semi]}>
                            Trajet illustratif — la position réelle sera reliée au transporteur.
                        </Text>
                    </View>

                    <Text style={[styles.sectionTitle, f.bold]}>Étapes</Text>
                    {STEPS.map((s, i) => (
                        <View key={i} style={styles.stepRow}>
                            <View style={[styles.dot, s.done ? styles.dotOk : styles.dotPending]} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.stepLabel, f.semi, !s.done && { color: COLORS.muted }]}>
                                    {s.label}
                                </Text>
                                <Text style={[styles.stepTime, f.semi]}>{s.time}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: { flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center' },
    safe: { flex: 1, width: '100%', maxWidth: MAX_WIDTH },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEF2F6',
        backgroundColor: '#fff',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: { fontSize: 17, color: COLORS.text },
    scroll: { paddingBottom: 120 },
    refCard: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        padding: 16,
        borderRadius: 18,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EEF2F6',
    },
    refLabel: { fontSize: 12, color: COLORS.muted },
    refValue: { fontSize: 16, color: COLORS.text, marginTop: 4 },
    mapWrap: { marginHorizontal: 16, marginBottom: 8 },
    map: { width: '100%', height: 220, borderRadius: 18 },
    mapHint: { fontSize: 11, color: COLORS.muted, marginTop: 8, lineHeight: 15 },
    sectionTitle: { fontSize: 15, color: COLORS.text, marginHorizontal: 16, marginBottom: 12 },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 16, marginBottom: 14 },
    dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 12 },
    dotOk: { backgroundColor: COLORS.primary },
    dotPending: { backgroundColor: '#E2E8F0' },
    stepLabel: { fontSize: 15, color: COLORS.text },
    stepTime: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
});
