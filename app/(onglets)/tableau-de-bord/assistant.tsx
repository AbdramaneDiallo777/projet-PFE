import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Bot,
    ChevronLeft,
    ChevronRight,
    CloudSun,
    HelpCircle,
    Leaf,
    MapPin,
    Send,
    Sparkles,
    Store,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ChatIntent } from '@/lib/agroconnectApi';
import { fetchChatEngineInfo, sendInsightsChat } from '@/lib/agroconnectApi';

const MAX_WIDTH = 500;

/** Aligné sur `tableau-de-bord/index.tsx` */
const COLORS = {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    primary: '#065F46',
    accent: '#10B981',
    textPrimary: '#0F172A',
    textMuted: '#64748B',
    border: '#F1F5F9',
};

type Msg = {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    time: string;
    intent?: ChatIntent;
};

function nowTime(): string {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function intentLabel(intent: ChatIntent | undefined): string | null {
    if (!intent) return null;
    const m: Record<ChatIntent, string> = {
        weather_analysis: 'Météo',
        disease_detection: 'Maladies',
        map: 'Carte',
        marketplace: 'Marché',
        logistics: 'Logistique',
        help: 'Aide',
    };
    return m[intent] ?? null;
}

function intentNavigation(
    intent: ChatIntent | undefined
): { title: string; subtitle: string } | null {
    switch (intent) {
        case 'weather_analysis':
            return {
                title: 'Espace météo',
                subtitle: 'Prévisions, humidité, vent',
            };
        case 'disease_detection':
            return {
                title: 'Scan IA',
                subtitle: 'Photo de feuille — diagnostic',
            };
        case 'map':
            return {
                title: 'Carte parcelles',
                subtitle: 'Tracés et synchronisation',
            };
        case 'marketplace':
            return {
                title: 'Marché AgroConnect Africa',
                subtitle: 'Produits et commandes',
            };
        case 'logistics':
            return {
                title: 'Logistique',
                subtitle: 'Suivi livraisons',
            };
        default:
            return null;
    }
}

/** Raccourcis cohérents avec l’ancienne démo HTML du collègue */
const QUICK_PROMPTS: { label: string; message: string }[] = [
    { label: 'Météo', message: 'Je veux analyser la météo pour mes cultures' },
    { label: 'Maladies', message: 'Mes plantes ont des taches ou jaunissent' },
    { label: 'Carte', message: 'Je veux voir mes parcelles sur la carte' },
    { label: 'Marché', message: 'Je veux vendre ou acheter des produits agricoles' },
    { label: 'Aide', message: "Comment utiliser l'application AgroConnect Africa ?" },
];

const SUGGESTIONS = [
    'Quelle irrigation après 3 jours sans pluie ?',
    'Risque de mildiou sur tomates si humidité élevée ?',
    'Où suivre ma livraison ?',
];

export default function AgrobotAIScreen() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH, MAX_WIDTH);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);
    const inputRef = useRef<TextInput>(null);

    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [engineLine, setEngineLine] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchChatEngineInfo()
            .then((info) => {
                if (cancelled) return;
                const label = info.provider === 'openai' ? 'OpenAI' : 'Ollama';
                setEngineLine(`${label} · ${info.model}`);
            })
            .catch(() => {
                if (!cancelled) setEngineLine('AgroConnect Africa · serveur');
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-Medium': PlusJakartaSans_500Medium,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    const goToFeature = useCallback(
        async (intent: ChatIntent) => {
            try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {
                /* */
            }
            switch (intent) {
                case 'weather_analysis':
                    router.push('/tableau-de-bord/meteo');
                    break;
                case 'disease_detection':
                    router.push('/tableau-de-bord/scan');
                    break;
                case 'map':
                    router.push('/tableau-de-bord/maps');
                    break;
                case 'marketplace':
                    router.push('/marche');
                    break;
                case 'logistics':
                    router.push('(logistique)/suivi');
                    break;
                default:
                    break;
            }
        },
        [router]
    );

    const sendMessage = useCallback(
        async (textOverride?: string) => {
            const trimmed = (textOverride ?? input).trim();
            if (!trimmed || sending) return;

            try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {
                /* */
            }

            const userMsg: Msg = {
                id: String(Date.now()),
                role: 'user',
                text: trimmed,
                time: nowTime(),
            };
            setMessages((m) => [...m, userMsg]);
            setInput('');
            setSending(true);

            try {
                const { reply, intent } = await sendInsightsChat(trimmed);
                const intentSafe = intent as ChatIntent | undefined;
                const bot: Msg = {
                    id: `${Date.now()}-b`,
                    role: 'assistant',
                    text: reply,
                    time: nowTime(),
                    intent: intentSafe,
                };
                setMessages((m) => [...m, bot]);
            } catch (e) {
                const bot: Msg = {
                    id: `${Date.now()}-e`,
                    role: 'assistant',
                    text:
                        e instanceof Error
                            ? e.message
                            : "Impossible de joindre le serveur. Vérifiez EXPO_PUBLIC_API_URL et le backend (Ollama ou OpenAI).",
                    time: nowTime(),
                };
                setMessages((m) => [...m, bot]);
            } finally {
                setSending(false);
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
            }
        },
        [input, sending]
    );

    const applySuggestion = (t: string) => {
        setInput(t);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    if (!fontsLoaded) {
        return (
            <View style={[styles.kavRoot, styles.bootCenter]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.kavRoot, { maxWidth: MAX_WIDTH, width: '100%', alignSelf: 'center' }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 2 : 0}
        >
        <View style={[styles.root, { width: CONTAINER_WIDTH, flex: 1, alignSelf: 'center' }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: COLORS.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.headerBtn}
                    activeOpacity={0.85}
                >
                    <ChevronLeft color={COLORS.textPrimary} size={26} />
                </TouchableOpacity>

                <View style={styles.headerTitleBlock}>
                    <View style={styles.titleRow}>
                        <LinearGradient
                            colors={[COLORS.accent, COLORS.primary]}
                            style={styles.orb}
                        >
                            <Bot size={22} color="#fff" />
                        </LinearGradient>
                        <View>
                            <Text style={styles.brand}>Agrobot AI</Text>
                            <View style={styles.subRow}>
                                <Sparkles size={12} color={COLORS.accent} />
                                <Text style={styles.subBrand}>
                                    {engineLine ?? 'Chargement du moteur…'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.chatScroll, { paddingBottom: 24 + insets.bottom }]}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.length === 0 && !sending ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyTitle}>Par où commencer ?</Text>
                        <Text style={styles.emptySub}>
                            Vous pouvez taper librement dans le champ en bas de l’écran. Les raccourcis
                            ci-dessous sont optionnels.
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.quickRow}
                        >
                            {QUICK_PROMPTS.map((q, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.quickChip}
                                    onPress={() => void sendMessage(q.message)}
                                    activeOpacity={0.88}
                                >
                                    <QuickIcon index={i} />
                                    <Text style={styles.quickChipText}>{q.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <Text style={styles.suggestionsTitle}>Suggestions</Text>
                        <View style={styles.emptyChips}>
                            {SUGGESTIONS.map((t, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.chip}
                                    onPress={() => applySuggestion(t)}
                                    activeOpacity={0.88}
                                >
                                    <Text style={styles.chipText}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ) : null}

                {messages.map((msg) =>
                    msg.role === 'assistant' ? (
                        <View key={msg.id} style={styles.botRow}>
                            <View style={styles.botBubble}>
                                <Text style={styles.botText}>{msg.text}</Text>
                                <View style={styles.metaRow}>
                                    <Text style={styles.time}>{msg.time}</Text>
                                    {intentLabel(msg.intent) ? (
                                        <View style={styles.intentPill}>
                                            <Text style={styles.intentText}>{intentLabel(msg.intent)}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                {msg.intent && msg.intent !== 'help' && intentNavigation(msg.intent) ? (
                                    <TouchableOpacity
                                        style={styles.navCta}
                                        onPress={() => void goToFeature(msg.intent!)}
                                        activeOpacity={0.92}
                                    >
                                        <LinearGradient
                                            colors={[COLORS.accent, COLORS.primary]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.navCtaInner}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.navCtaTitle}>
                                                    {intentNavigation(msg.intent)!.title}
                                                </Text>
                                                <Text style={styles.navCtaSub}>
                                                    {intentNavigation(msg.intent)!.subtitle}
                                                </Text>
                                            </View>
                                            <ChevronRight color="#fff" size={22} />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>
                    ) : (
                        <View key={msg.id} style={styles.userRow}>
                            <LinearGradient
                                colors={[COLORS.accent, COLORS.primary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.userBubble}
                            >
                                <Text style={styles.userText}>{msg.text}</Text>
                                <Text style={styles.userTime}>{msg.time}</Text>
                            </LinearGradient>
                        </View>
                    )
                )}

                {sending ? (
                    <View style={styles.typingRow}>
                        <ActivityIndicator color={COLORS.primary} />
                        <Text style={styles.typingText}>Agrobot réfléchit…</Text>
                    </View>
                ) : null}
            </ScrollView>

                <View style={[styles.inputDock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <Text style={styles.composerHint}>Votre message — saisie libre</Text>
                    <View style={styles.inputBar}>
                        <TextInput
                            ref={inputRef}
                            style={styles.textInput}
                            placeholder="Écrivez ici votre question (aucune phrase imposée)…"
                            placeholderTextColor={COLORS.textMuted}
                            multiline
                            value={input}
                            onChangeText={setInput}
                            editable={!sending}
                            blurOnSubmit={false}
                            underlineColorAndroid="transparent"
                            textAlignVertical={Platform.OS === 'android' ? 'top' : 'center'}
                            autoCorrect
                            {...(Platform.OS === 'android'
                                ? { importantForAutofill: 'no' as const }
                                : {})}
                            returnKeyType="default"
                        />
                        <TouchableOpacity
                            style={styles.sendWrap}
                            onPress={() => void sendMessage()}
                            disabled={sending || !input.trim()}
                            activeOpacity={0.9}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <LinearGradient
                                colors={
                                    sending || !input.trim()
                                        ? ['#94a3b8', '#64748b']
                                        : [COLORS.accent, COLORS.primary]
                                }
                                style={styles.sendBtn}
                            >
                                {sending ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Send size={20} color="#fff" />
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
        </View>
        </KeyboardAvoidingView>
    );
}

function QuickIcon({ index }: { index: number }) {
    const props = { size: 16, color: '#065F46' as const };
    switch (index) {
        case 0:
            return <CloudSun {...props} />;
        case 1:
            return <Leaf {...props} />;
        case 2:
            return <MapPin {...props} />;
        case 3:
            return <Store {...props} />;
        default:
            return <HelpCircle {...props} />;
    }
}

const styles = StyleSheet.create({
    kavRoot: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    bootCenter: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    root: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingBottom: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleBlock: { flex: 1, alignItems: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    orb: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brand: {
        fontSize: 20,
        fontFamily: 'PJS-ExtraBold',
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    subRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    subBrand: {
        fontSize: 11,
        fontFamily: 'PJS-SemiBold',
        color: COLORS.textMuted,
        letterSpacing: 0.2,
    },
    chatScroll: {
        paddingHorizontal: 18,
        paddingTop: 8,
        flexGrow: 1,
    },
    empty: {
        paddingVertical: 20,
        paddingHorizontal: 4,
    },
    emptyTitle: {
        fontSize: 22,
        fontFamily: 'PJS-Bold',
        color: COLORS.textPrimary,
        marginBottom: 10,
        letterSpacing: -0.3,
    },
    emptySub: {
        fontSize: 14,
        fontFamily: 'PJS-Medium',
        color: COLORS.textMuted,
        lineHeight: 22,
        marginBottom: 16,
    },
    quickRow: {
        gap: 10,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    quickChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.surface,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 4,
    },
    quickChipText: {
        fontSize: 13,
        fontFamily: 'PJS-Bold',
        color: COLORS.primary,
    },
    suggestionsTitle: {
        fontSize: 13,
        fontFamily: 'PJS-SemiBold',
        color: COLORS.textMuted,
        marginTop: 12,
        marginBottom: 10,
    },
    emptyChips: { gap: 10 },
    chip: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chipText: {
        fontSize: 14,
        fontFamily: 'PJS-Medium',
        color: COLORS.textPrimary,
        lineHeight: 20,
    },
    botRow: {
        marginBottom: 16,
        alignSelf: 'flex-start',
        maxWidth: '92%',
    },
    botBubble: {
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        padding: 16,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    botText: {
        fontSize: 15,
        fontFamily: 'PJS-Medium',
        color: COLORS.textPrimary,
        lineHeight: 23,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    time: {
        fontSize: 10,
        fontFamily: 'PJS-Regular',
        color: COLORS.textMuted,
    },
    intentPill: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    intentText: {
        fontSize: 10,
        fontFamily: 'PJS-SemiBold',
        color: COLORS.primary,
        letterSpacing: 0.3,
    },
    navCta: {
        marginTop: 14,
        borderRadius: 14,
        overflow: 'hidden',
    },
    navCtaInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 10,
    },
    navCtaTitle: {
        fontSize: 15,
        fontFamily: 'PJS-Bold',
        color: '#fff',
        letterSpacing: -0.2,
    },
    navCtaSub: {
        fontSize: 11,
        fontFamily: 'PJS-Medium',
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
        lineHeight: 15,
    },
    userRow: { alignSelf: 'flex-end', marginBottom: 16, maxWidth: '90%' },
    userBubble: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderBottomRightRadius: 4,
    },
    userText: {
        fontSize: 15,
        fontFamily: 'PJS-Medium',
        color: '#fff',
        lineHeight: 22,
    },
    userTime: {
        fontSize: 10,
        fontFamily: 'PJS-Regular',
        color: 'rgba(255,255,255,0.85)',
        marginTop: 8,
        alignSelf: 'flex-end',
    },
    typingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
        marginLeft: 4,
    },
    typingText: {
        fontSize: 13,
        fontFamily: 'PJS-Medium',
        color: COLORS.textMuted,
    },
    inputDock: {
        paddingHorizontal: 14,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.surface,
        zIndex: 20,
        elevation: 12,
    },
    composerHint: {
        fontSize: 12,
        fontFamily: 'PJS-SemiBold',
        color: COLORS.textMuted,
        marginBottom: 8,
        paddingHorizontal: 2,
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        backgroundColor: COLORS.background,
        borderRadius: 24,
        paddingLeft: 16,
        paddingRight: 6,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textInput: {
        flex: 1,
        minHeight: 48,
        maxHeight: 140,
        fontSize: 15,
        fontFamily: 'PJS-Medium',
        color: COLORS.textPrimary,
        paddingVertical: Platform.OS === 'android' ? 10 : 8,
    },
    sendWrap: { borderRadius: 20, overflow: 'hidden' },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
