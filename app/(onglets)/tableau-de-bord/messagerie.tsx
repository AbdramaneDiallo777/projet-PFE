import {
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Globe2, Headphones, MessageCircle, Truck } from 'lucide-react-native';
import React from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 480;
const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH, MAX_WIDTH);

const COLORS = {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    primary: '#065F46',
    accent: '#10B981',
    textPrimary: '#0F172A',
    textMuted: '#64748B',
    border: '#F1F5F9',
};

type Canal = {
    id: string;
    title: string;
    subtitle: string;
    icon: typeof Truck;
    tint: string;
};

const CANAUX: Canal[] = [
    {
        id: 'transport',
        title: 'Transporteurs',
        subtitle: 'Livraisons, enlèvements, suivi des expéditions',
        icon: Truck,
        tint: '#0EA5E9',
    },
    {
        id: 'experts',
        title: 'Experts agricoles',
        subtitle: 'Conseils techniques, maladies, fertilisation',
        icon: Headphones,
        tint: '#8B5CF6',
    },
    {
        id: 'clients',
        title: 'Clients & commandes (Occident)',
        subtitle: 'Acheteurs internationaux, négociation, statut des commandes',
        icon: Globe2,
        tint: '#F59E0B',
    },
];

export default function MessagerieHubPage() {
    const router = useRouter();
    const [fontsLoaded] = useFonts({
        'PJS-Medium': PlusJakartaSans_500Medium,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
    });

    const f = {
        medium: fontsLoaded ? ({ fontFamily: 'PJS-Medium' } as const) : undefined,
        semi: fontsLoaded ? ({ fontFamily: 'PJS-SemiBold' } as const) : undefined,
        bold: fontsLoaded ? ({ fontFamily: 'PJS-Bold' } as const) : undefined,
    };

    return (
        <View style={styles.outer}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safe}>
                <View style={[styles.inner, { width: CONTAINER_WIDTH }]}>
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}
                            accessibilityRole="button"
                            accessibilityLabel="Retour"
                        >
                            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.screenTitle, f.bold]}>Messagerie</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <LinearGradient
                            colors={['#065F46', '#10B981']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.hero}
                        >
                            <MessageCircle color="#FFFFFF" size={32} strokeWidth={2.2} />
                            <Text style={[styles.heroTitle, f.bold]}>
                                Échanger avec tout l’écosystème
                            </Text>
                            <Text style={[styles.heroSub, f.medium]}>
                                Un seul fil pour parler aux transporteurs, aux services experts et aux
                                clients qui commandent depuis l’étranger — en plus de vos contacts
                                habituels sur le marché.
                            </Text>
                        </LinearGradient>

                        <Text style={[styles.sectionLabel, f.semi]}>Vos canaux</Text>

                        {CANAUX.map((c) => {
                            const Icon = c.icon;
                            return (
                                <TouchableOpacity
                                    key={c.id}
                                    style={styles.card}
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        if (c.id === 'experts') {
                                            router.push('/tableau-de-bord/experts');
                                            return;
                                        }
                                        if (c.id === 'transport') {
                                            router.push('/suivi');
                                            return;
                                        }
                                        router.push('/marche/message');
                                    }}
                                >
                                    <View style={[styles.cardIconWrap, { backgroundColor: `${c.tint}18` }]}>
                                        <Icon color={c.tint} size={22} strokeWidth={2} />
                                    </View>
                                    <View style={styles.cardTextCol}>
                                        <Text style={[styles.cardTitle, f.bold]} numberOfLines={2}>
                                            {c.title}
                                        </Text>
                                        <Text
                                            style={[styles.cardSub, f.medium]}
                                            numberOfLines={3}
                                        >
                                            {c.subtitle}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                                </TouchableOpacity>
                            );
                        })}

                        <TouchableOpacity
                            style={styles.cta}
                            activeOpacity={0.92}
                            onPress={() => router.push('/marche/message')}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, '#047857']}
                                style={styles.ctaGradient}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                            >
                                <Ionicons name="chatbubbles" size={22} color="#FFF" />
                                <Text style={[styles.ctaText, f.bold]}>
                                    Ouvrir toutes mes conversations
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={[styles.note, f.medium]}>
                            Les discussions sont centralisées dans l’écran « Discussions ». Les filtres par
                            type de contact pourront être branchés sur l’API quand les rôles seront
                            exposés côté serveur.
                        </Text>

                        <View style={{ height: 120 }} />
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center' },
    safe: { flex: 1, width: '100%' },
    inner: { flex: 1, alignSelf: 'center' },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
    },
    screenTitle: {
        fontSize: 18,
        color: COLORS.textPrimary,
        letterSpacing: -0.3,
    },
    scrollContent: { paddingBottom: 24 },
    hero: {
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 20,
        padding: 22,
        borderRadius: 24,
        gap: 10,
    },
    heroTitle: {
        fontSize: 20,
        color: '#FFFFFF',
        marginTop: 4,
        letterSpacing: -0.4,
    },
    heroSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.92)',
        lineHeight: 19,
    },
    sectionLabel: {
        fontSize: 13,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginHorizontal: 24,
        marginBottom: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 14,
    },
    cardIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTextCol: { flex: 1 },
    cardTitle: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    cardSub: {
        fontSize: 13,
        color: COLORS.textMuted,
        lineHeight: 18,
    },
    cta: {
        marginHorizontal: 20,
        marginTop: 8,
        borderRadius: 18,
        overflow: 'hidden',
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    ctaText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    note: {
        marginHorizontal: 24,
        marginTop: 18,
        fontSize: 12,
        color: COLORS.textMuted,
        lineHeight: 17,
    },
});
