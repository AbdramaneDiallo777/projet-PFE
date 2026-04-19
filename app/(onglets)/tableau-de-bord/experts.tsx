import { EXPERTS } from '@/lib/experts';
import {
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Headphones } from 'lucide-react-native';
import React from 'react';
import {
    Image,
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

export default function ExpertsListPage() {
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
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
                        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, f.bold]}>Experts agricoles</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                >
                    <View style={styles.hero}>
                        <Headphones color={COLORS.primary} size={28} strokeWidth={2.2} />
                        <Text style={[styles.heroText, f.semi]}>
                            Conseils techniques par messagerie — sols, maladies, mécanisation, export.
                        </Text>
                    </View>

                    {EXPERTS.map((e) => (
                        <TouchableOpacity
                            key={e.id}
                            style={[styles.card, { borderColor: COLORS.border }]}
                            activeOpacity={0.9}
                            onPress={() =>
                                router.push({
                                    pathname: '/tableau-de-bord/expert-chat',
                                    params: { expertId: e.id },
                                })
                            }
                        >
                            <Image
                                source={{ uri: `https://i.pravatar.cc/120?u=${encodeURIComponent(e.avatarSeed)}` }}
                                style={styles.avatar}
                            />
                            <View style={styles.cardBody}>
                                <Text style={[styles.name, f.bold]}>{e.name}</Text>
                                <Text style={[styles.sub, f.semi]}>{e.title}</Text>
                                <Text style={[styles.spec, f.semi]} numberOfLines={2}>
                                    {e.specialty}
                                </Text>
                                <View style={styles.metaRow}>
                                    <Text style={styles.meta}>{e.region}</Text>
                                    <Text style={styles.meta}>{e.languages}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
                        </TouchableOpacity>
                    ))}
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
    scroll: { padding: 16, paddingBottom: 120 },
    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 16,
        backgroundColor: '#ECFDF5',
        marginBottom: 16,
    },
    heroText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 18 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 18,
        borderWidth: 1,
        padding: 14,
        marginBottom: 12,
        gap: 12,
    },
    avatar: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#E2E8F0' },
    cardBody: { flex: 1, minWidth: 0 },
    name: { fontSize: 16, color: COLORS.text },
    sub: { fontSize: 13, color: COLORS.primary, marginTop: 2 },
    spec: { fontSize: 12, color: COLORS.muted, marginTop: 6, lineHeight: 16 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    meta: { fontSize: 11, color: '#94A3B8' },
});
