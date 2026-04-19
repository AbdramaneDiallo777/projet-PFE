import {
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Tractor, Wrench } from 'lucide-react-native';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const MAX_WIDTH = 480;
const COLORS = {
    bg: '#F8FAFC',
    card: '#FFFFFF',
    primary: '#065F46',
    text: '#0F172A',
    muted: '#64748B',
    border: '#EEF2F6',
};

type EquipmentItem = { id: string; name: string; detail: string; type: 'tractor' | 'other' };

const DEMO_TRACTORS: EquipmentItem[] = [
    { id: 't1', name: 'John Deere 5075E', detail: '75 ch · entretien OK · dernière révision 02/2026', type: 'tractor' },
    { id: 't2', name: 'Massey Ferguson 385', detail: '85 ch · disponible pour location interne', type: 'tractor' },
];

const DEMO_OTHER: EquipmentItem[] = [
    { id: 'o1', name: 'Pulvérisateur traîné 800 L', detail: 'Buses anti-derive · calibration 2025', type: 'other' },
    { id: 'o2', name: 'Système goutte-à-goutte — Bloc Nord', detail: '2,4 ha équipés · capteur pression', type: 'other' },
    { id: 'o3', name: 'Charrue à disques', detail: '5 disques · réglage 35 cm', type: 'other' },
];

export default function EquipementsPage() {
    const router = useRouter();
    const [fontsLoaded] = useFonts({
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
    });
    const f = fontsLoaded ? { semi: { fontFamily: 'PJS-SemiBold' as const }, bold: { fontFamily: 'PJS-Bold' as const } } : { semi: {}, bold: {} };

    return (
        <View style={styles.outer}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, f.bold]}>Équipements</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[styles.addBanner, { borderColor: COLORS.primary }]}
                        activeOpacity={0.9}
                        onPress={() => router.push('/tableau-de-bord/ajouter')}
                    >
                        <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.addTitle, f.bold]}>Ajouter parcelle, culture ou photo</Text>
                            <Text style={[styles.addSub, f.semi]}>
                                Les fiches équipement détaillées seront liées à votre exploitation (évolution prévue).
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <Text style={[styles.section, f.bold]}>Tracteurs</Text>
                    {DEMO_TRACTORS.map((item) => (
                        <View key={item.id} style={[styles.card, { borderColor: COLORS.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                                <Tractor color={COLORS.primary} size={22} strokeWidth={2} />
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={[styles.cardName, f.bold]}>{item.name}</Text>
                                <Text style={[styles.cardDetail, f.semi]}>{item.detail}</Text>
                            </View>
                        </View>
                    ))}

                    <Text style={[styles.section, f.bold]}>Autres équipements</Text>
                    {DEMO_OTHER.map((item) => (
                        <View key={item.id} style={[styles.card, { borderColor: COLORS.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: '#F0FDFA' }]}>
                                <Wrench color="#0D9488" size={22} strokeWidth={2} />
                            </View>
                            <View style={styles.cardBody}>
                                <Text style={[styles.cardName, f.bold]}>{item.name}</Text>
                                <Text style={[styles.cardDetail, f.semi]}>{item.detail}</Text>
                            </View>
                        </View>
                    ))}

                    <Text style={[styles.footnote, f.semi]}>
                        Démo : enrichissez via « Ajouter » et le marché pour publier des annonces matériel.
                    </Text>
                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center' },
    safe: { flex: 1, width: '100%', maxWidth: MAX_WIDTH },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
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
    scroll: { padding: 16 },
    addBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
        backgroundColor: '#fff',
    },
    addTitle: { fontSize: 15, color: COLORS.text },
    addSub: { fontSize: 12, color: COLORS.muted, marginTop: 4, lineHeight: 17 },
    section: { fontSize: 13, color: COLORS.muted, marginBottom: 10, marginTop: 8, letterSpacing: 0.5 },
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
        marginBottom: 10,
        gap: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBody: { flex: 1, minWidth: 0 },
    cardName: { fontSize: 15, color: COLORS.text },
    cardDetail: { fontSize: 12, color: COLORS.muted, marginTop: 4, lineHeight: 17 },
    footnote: { fontSize: 11, color: '#94A3B8', marginTop: 16, lineHeight: 16 },
});
