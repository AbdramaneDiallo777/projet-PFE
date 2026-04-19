import { getExpertById } from '@/lib/experts';
import { loadExpertThread, saveExpertThread, type ExpertChatMessage } from '@/lib/expertChatStorage';
import {
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const COLORS = {
    bg: '#F1F5F9',
    primary: '#065F46',
    text: '#0F172A',
    muted: '#64748B',
    bubbleUser: '#065F46',
    bubbleExpert: '#FFFFFF',
};

const AUTO_REPLIES = [
    'Merci pour votre message. Pouvez-vous préciser la surface (ha) et la région ?',
    'Bien reçu. Avez-vous des photos récentes des feuilles ou du sol ?',
    'Je note. Souhaitez-vous un rappel téléphonique ? Indiquez un créneau.',
    "D'accord. Vérifiez aussi l'irrigation ces 7 derniers jours — toute anomalie ?",
];

function newMsg(from: 'user' | 'expert', text: string): ExpertChatMessage {
    return {
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        from,
        text,
        at: new Date().toISOString(),
    };
}

export default function ExpertChatPage() {
    const router = useRouter();
    const { expertId: rawId } = useLocalSearchParams<{ expertId?: string | string[] }>();
    const expertId = Array.isArray(rawId) ? rawId[0] : rawId;
    const expert = expertId ? getExpertById(expertId) : undefined;

    const [fontsLoaded] = useFonts({
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
    });
    const [thread, setThread] = useState<ExpertChatMessage[]>([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const listRef = useRef<FlatList>(null);
    const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const f = fontsLoaded ? { semi: { fontFamily: 'PJS-SemiBold' as const }, bold: { fontFamily: 'PJS-Bold' as const } } : { semi: {}, bold: {} };

    const persist = useCallback(
        async (messages: ExpertChatMessage[]) => {
            if (!expertId) return;
            await saveExpertThread(expertId, messages);
        },
        [expertId]
    );

    useEffect(() => {
        if (!expertId) {
            setLoading(false);
            return;
        }
        let cancel = false;
        void loadExpertThread(expertId).then((t) => {
            if (!cancel) {
                setThread(t);
                setLoading(false);
            }
        });
        return () => {
            cancel = true;
        };
    }, [expertId]);

    useEffect(() => {
        return () => {
            if (replyTimer.current) clearTimeout(replyTimer.current);
        };
    }, []);

    const send = useCallback(async () => {
        const text = draft.trim();
        if (!text || !expertId || sending) return;
        if (replyTimer.current) clearTimeout(replyTimer.current);
        setSending(true);
        setDraft('');
        const userMsg = newMsg('user', text);
        const next = [...thread, userMsg];
        setThread(next);
        await persist(next);

        replyTimer.current = setTimeout(async () => {
            const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
            const bot = newMsg('expert', reply);
            setThread((prev) => {
                const merged = [...prev, bot];
                void persist(merged);
                return merged;
            });
            setSending(false);
        }, 1400);
    }, [draft, expertId, sending, thread, persist]);

    if (!fontsLoaded) return null;

    if (!expert) {
        return (
            <View style={styles.centered}>
                <Text style={[styles.err, f.semi]}>Expert introuvable.</Text>
                <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
                    <Text style={[styles.backLinkText, f.bold]}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeTop}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: `https://i.pravatar.cc/80?u=${encodeURIComponent(expert.avatarSeed)}` }}
                        style={styles.topAvatar}
                    />
                    <View style={styles.topTitles}>
                        <Text style={[styles.topName, f.bold]} numberOfLines={1}>
                            {expert.name}
                        </Text>
                        <Text style={[styles.topSub, f.semi]} numberOfLines={1}>
                            {expert.title}
                        </Text>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator color={COLORS.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={listRef}
                        data={thread}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                        renderItem={({ item }) => (
                            <View
                                style={[
                                    styles.row,
                                    item.from === 'user' ? styles.rowUser : styles.rowExpert,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.bubble,
                                        item.from === 'user' ? styles.bubbleUser : styles.bubbleExpert,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.bubbleText,
                                            item.from === 'user' ? styles.bubbleTextUser : styles.bubbleTextExpert,
                                            f.semi,
                                        ]}
                                    >
                                        {item.text}
                                    </Text>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={
                            <Text style={[styles.empty, f.semi]}>
                                Écrivez votre première question — l’expert répondra sous peu (démo).
                            </Text>
                        }
                    />
                )}

                <View style={styles.inputRow}>
                    <TextInput
                        style={[styles.input, f.semi]}
                        placeholder="Votre message…"
                        placeholderTextColor={COLORS.muted}
                        value={draft}
                        onChangeText={setDraft}
                        multiline
                        maxLength={2000}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, sending && { opacity: 0.6 }]}
                        onPress={() => void send()}
                        disabled={sending || !draft.trim()}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: COLORS.bg },
    safeTop: { flex: 1, maxWidth: 500, width: '100%', alignSelf: 'center' },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        gap: 10,
    },
    iconBtn: { padding: 8 },
    topAvatar: { width: 40, height: 40, borderRadius: 12 },
    topTitles: { flex: 1, minWidth: 0 },
    topName: { fontSize: 16, color: COLORS.text },
    topSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 16, paddingBottom: 24 },
    row: { marginBottom: 10 },
    rowUser: { alignItems: 'flex-end' },
    rowExpert: { alignItems: 'flex-start' },
    bubble: { maxWidth: '88%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
    bubbleUser: { backgroundColor: COLORS.bubbleUser },
    bubbleExpert: { backgroundColor: COLORS.bubbleExpert, borderWidth: 1, borderColor: '#E2E8F0' },
    bubbleText: { fontSize: 15, lineHeight: 21 },
    bubbleTextUser: { color: '#fff' },
    bubbleTextExpert: { color: COLORS.text },
    empty: { textAlign: 'center', color: COLORS.muted, padding: 24, fontSize: 14 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 10,
        paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: COLORS.text,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
    err: { fontSize: 16, color: COLORS.muted },
    backLink: { marginTop: 16 },
    backLinkText: { color: COLORS.primary, fontSize: 16 },
});
