import { useAuth } from '@/contexts/AuthContext';
import { userAvatarSource, userDisplayName } from '@/lib/userDisplay';
import {
    fetchConversationMessages,
    fetchConversations,
    sendApiMessage,
    type ApiMessage,
    type ConversationSummary,
} from '@/lib/agroconnectApi';
import { SpaceGrotesk_400Regular, SpaceGrotesk_700Bold, useFonts } from '@expo-google-fonts/space-grotesk';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';

const MAX_WIDTH = 500;

type ChatPeer = ConversationSummary & { avatar: string };

function peerFromApi(c: ConversationSummary): ChatPeer {
    return {
        ...c,
        avatar: `https://i.pravatar.cc/150?u=${c.other_user_id}`,
    };
}

export default function UnifiedMessagesPage() {
    const router = useRouter();
    const { receiverId } = useLocalSearchParams<{
        receiverId?: string;
    }>();
    const { token, user } = useAuth();
    const [conversations, setConversations] = useState<ChatPeer[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatPeer | null>(null);
    const selectedChatId = selectedChat?.other_user_id;
    const [thread, setThread] = useState<ApiMessage[]>([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState('');
    const inputRef = useRef<TextInput>(null);
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH, MAX_WIDTH);

    // THÈME CLAIR FIXÉ
    const COLORS = {
        primary: '#156f51',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        surfaceAlt: '#F1F5F9',
        text: '#0F172A',
        textMuted: '#64748B',
        border: '#E2E8F0',
        online: '#156f51',
        outerBg: '#EDF2F7',
    };

    let [fontsLoaded] = useFonts({
        'Space-Reg': SpaceGrotesk_400Regular,
        'Space-Bold': SpaceGrotesk_700Bold,
    });

    const loadConversations = useCallback(async () => {
        if (!token) {
            setConversations([]);
            return;
        }
        try {
            const list = await fetchConversations(token);
            setConversations(list.map(peerFromApi));
        } catch {
            setConversations([]);
        }
    }, [token]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (!token || receiverId == null || receiverId === '') return;
        const rid = Number(Array.isArray(receiverId) ? receiverId[0] : receiverId);
        if (!Number.isFinite(rid)) return;
        setSelectedChat({
            other_user_id: rid,
            other_user_name: `Utilisateur ${rid}`,
            last_message: '',
            last_message_at: new Date().toISOString(),
            unread_count: 0,
            avatar: `https://i.pravatar.cc/150?u=${rid}`,
        });
    }, [receiverId, token]);

    useEffect(() => {
        if (selectedChatId != null) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [selectedChatId]);

    useEffect(() => {
        if (!token || selectedChatId == null) {
            setThread([]);
            return;
        }
        let cancel = false;
        fetchConversationMessages(token, selectedChatId)
            .then((msgs) => {
                if (!cancel) setThread(msgs);
            })
            .catch(() => {
                if (!cancel) setThread([]);
            });
        return () => {
            cancel = true;
        };
    }, [token, selectedChatId]);

    const font = (f: string) => fontsLoaded ? f : (Platform.OS === 'ios' ? 'System' : 'sans-serif');

    if (!fontsLoaded) return null;

    const filtered = conversations.filter((c) =>
        c.other_user_name.toLowerCase().includes(search.trim().toLowerCase())
    );

    const sendDraft = async () => {
        const text = draft.trim();
        if (!token || !selectedChat || !text || sending) return;
        setSending(true);
        try {
            await sendApiMessage(token, selectedChat.other_user_id, text);
            setDraft('');
            const msgs = await fetchConversationMessages(token, selectedChat.other_user_id);
            setThread(msgs);
            await loadConversations();
        } catch {
            /* ignore */
        } finally {
            setSending(false);
        }
    };

    const renderChatItem = ({ item }: { item: ChatPeer }) => (
        <TouchableOpacity 
            style={[styles.chatCard, { backgroundColor: COLORS.surface }]} 
            onPress={() => setSelectedChat(item)}
            activeOpacity={0.6}
        >
            <View style={styles.avatarContainer}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
            </View>
            <View style={styles.chatInfo}>
                <View style={styles.chatHeaderRow}>
                    <View style={styles.nameContainer}>
                        <Text style={[styles.userName, { fontFamily: font('Space-Bold'), color: COLORS.text }]} numberOfLines={1}>{item.other_user_name}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: COLORS.primary + '15' }]}>
                            <Text style={[styles.userRole, { fontFamily: font('Space-Bold'), color: COLORS.primary }]}>Contact</Text>
                        </View>
                    </View>
                    <Text style={[styles.timeText, { fontFamily: font('Space-Reg'), color: COLORS.textMuted }]} numberOfLines={1}>
                        {item.last_message_at ? String(item.last_message_at).slice(0, 16).replace('T', ' ') : ''}
                    </Text>
                </View>
                <View style={styles.messageRow}>
                    <Text 
                        style={[
                            styles.lastMessage, 
                            { 
                                fontFamily: font(item.unread_count > 0 ? 'Space-Bold' : 'Space-Reg'), 
                                color: item.unread_count > 0 ? COLORS.text : COLORS.textMuted 
                            }
                        ]} 
                        numberOfLines={1}
                    >
                        {item.last_message}
                    </Text>
                    {item.unread_count > 0 && (
                        <View style={[styles.badge, { backgroundColor: COLORS.primary }]}>
                            <Text style={[styles.badgeText, { fontFamily: font('Space-Bold') }]}>{item.unread_count}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.outerContainer, { backgroundColor: COLORS.outerBg }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: COLORS.background }]}>
                <SafeAreaView style={styles.flex}>
                    
                    {!selectedChat ? (
                        <View style={styles.flex}>
                            <View style={styles.mainHeader}>
                                <View>
                                    <Text style={[styles.mainTitle, { fontFamily: font('Space-Bold'), color: COLORS.text }]}>Discussions</Text>
                                    <View style={styles.statusChip}>
                                        <View style={[styles.statusDot, { backgroundColor: COLORS.primary }]} />
                                        <Text style={[styles.subTitle, { fontFamily: font('Space-Reg'), color: COLORS.textMuted }]}>{filtered.length} conversation(s)</Text>
                                    </View>
                                    {token && user ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 }}>
                                            <Image source={userAvatarSource(user)} style={{ width: 36, height: 36, borderRadius: 18 }} />
                                            <Text style={[styles.subTitle, { fontFamily: font('Space-Bold'), color: COLORS.text }]} numberOfLines={1}>
                                                {userDisplayName(user)}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                                <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: COLORS.text }]}>
                                    <Feather name="plus" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.searchWrapper}>
                                <View style={[styles.searchBox, { backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.border }]}>
                                    <Feather name="search" size={18} color={COLORS.textMuted} />
                                    <TextInput 
                                        placeholder="Rechercher un contact..." 
                                        style={[styles.searchInput, { fontFamily: font('Space-Reg'), color: COLORS.text }]} 
                                        value={search} 
                                        onChangeText={setSearch} 
                                        placeholderTextColor={COLORS.textMuted}
                                    />
                                </View>
                            </View>

                            {!token ? (
                                <View style={{ padding: 24 }}>
                                    <Text style={{ fontFamily: font('Space-Reg'), color: COLORS.text, marginBottom: 12 }}>
                                        Connectez-vous pour voir vos messages.
                                    </Text>
                                    <TouchableOpacity onPress={() => router.push('/connexion')} style={{ backgroundColor: COLORS.primary, padding: 14, borderRadius: 16, alignItems: 'center' }}>
                                        <Text style={{ color: '#fff', fontFamily: font('Space-Bold') }}>Connexion</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <FlatList
                                    data={filtered}
                                    keyExtractor={(item) => String(item.other_user_id)}
                                    renderItem={renderChatItem}
                                    contentContainerStyle={styles.listPadding}
                                    showsVerticalScrollIndicator={false}
                                    ListEmptyComponent={
                                        <Text style={{ paddingHorizontal: 25, color: COLORS.textMuted, fontFamily: font('Space-Reg') }}>
                                            Aucune conversation pour le moment.
                                        </Text>
                                    }
                                />
                            )}
                        </View>
                    ) : (
                        <View style={styles.flex}>
                            {/* Header Chat individuel fixé en mode clair */}
                            <View style={[styles.chatHeaderPremium, { borderBottomColor: COLORS.border, backgroundColor: '#FFF' }]}>
                                <TouchableOpacity onPress={() => setSelectedChat(null)} style={[styles.backBtn, { backgroundColor: COLORS.surfaceAlt }]}>
                                    <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                                </TouchableOpacity>
                                <View style={styles.headerProfile}>
                                    <Image source={{ uri: selectedChat.avatar }} style={styles.smallAvatar} />
                                    <View>
                                        <Text style={[styles.chatName, { fontFamily: font('Space-Bold'), color: COLORS.text }]}>{selectedChat.other_user_name}</Text>
                                        <Text style={[styles.chatStatus, { fontFamily: font('Space-Reg'), color: COLORS.primary }]}>• Messagerie</Text>
                                    </View>
                                </View>
                                <View style={styles.headerActions}>
                                    <TouchableOpacity style={[styles.headerActionBtn, { backgroundColor: COLORS.surfaceAlt }]}><Feather name="more-horizontal" size={20} color={COLORS.text} /></TouchableOpacity>
                                </View>
                            </View>

                            <ScrollView style={styles.flex} contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
                                <View style={styles.dateDividerContainer}>
                                    <View style={[styles.line, { backgroundColor: COLORS.border }]} />
                                    <Text style={[styles.dateDivider, { fontFamily: font('Space-Reg'), color: COLORS.textMuted }]}>CONVERSATION</Text>
                                    <View style={[styles.line, { backgroundColor: COLORS.border }]} />
                                </View>
                                {thread.map((m) => {
                                    const mine = user?.id === m.sender_id;
                                    return mine ? (
                                        <View key={m.id} style={[styles.sentBubble, { backgroundColor: COLORS.primary }]}>
                                            <Text style={[styles.sentText, { fontFamily: font('Space-Reg') }]}>{m.content}</Text>
                                            <Text style={[styles.bubbleTime, { color: 'rgba(255,255,255,0.7)' }]}>
                                                {String(m.created_at).slice(11, 16)}
                                            </Text>
                                        </View>
                                    ) : (
                                        <View key={m.id} style={[styles.receivedBubble, { backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.border }]}>
                                            <Text style={[styles.receivedText, { fontFamily: font('Space-Reg'), color: COLORS.text }]}>{m.content}</Text>
                                            <Text style={[styles.bubbleTime, { color: COLORS.textMuted }]}>
                                                {String(m.created_at).slice(11, 16)}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </ScrollView>

                            <KeyboardAvoidingView 
                                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                            >
                                <View style={[styles.inputArea, { backgroundColor: COLORS.background, borderTopColor: COLORS.border }]}>
                                    <TouchableOpacity style={[styles.addMedia, { backgroundColor: COLORS.surfaceAlt }]}><Feather name="paperclip" size={20} color={COLORS.textMuted} /></TouchableOpacity>
                                    <View style={[styles.textInputWrapper, { backgroundColor: COLORS.surfaceAlt }]}>
                                        <TextInput 
                                            ref={inputRef} 
                                            placeholder="Écrire un message..." 
                                            style={[styles.textInput, { fontFamily: font('Space-Reg'), color: COLORS.text }]} 
                                            placeholderTextColor={COLORS.textMuted}
                                            multiline 
                                            value={draft}
                                            onChangeText={setDraft}
                                            editable={!sending && !!token}
                                        />
                                    </View>
                                    <TouchableOpacity style={[styles.sendBtn, { backgroundColor: COLORS.primary }]} onPress={sendDraft} disabled={sending || !token}>
                                        {sending ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="white" />}
                                    </TouchableOpacity>
                                </View>
                            </KeyboardAvoidingView>
                        </View>
                    )}
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    outerContainer: { flex: 1, alignItems: 'center' },
    innerContainer: { flex: 1, overflow: 'hidden' },
    
    mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 20, marginBottom: 20 },
    mainTitle: { fontSize: 32, letterSpacing: -1.5 },
    statusChip: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: 'rgba(21, 111, 81, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    subTitle: { fontSize: 12, fontWeight: '700' },
    headerIconBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    
    searchWrapper: { paddingHorizontal: 25, marginBottom: 20 },
    searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 16, height: 56, borderWidth: 1 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 16 },
    
    listPadding: { paddingHorizontal: 20, paddingBottom: 40 },
    chatCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 56, height: 56, borderRadius: 28 },
    onlineIndicator: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2.5 },
    chatInfo: { flex: 1, marginLeft: 16 },
    chatHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    nameContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    userName: { fontSize: 16, maxWidth: '60%' },
    roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    userRole: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
    timeText: { fontSize: 11, fontWeight: '600' },
    messageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lastMessage: { fontSize: 14, flex: 1, marginRight: 10 },
    badge: { borderRadius: 8, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
    badgeText: { color: 'white', fontSize: 10 },

    chatHeaderPremium: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
    headerProfile: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    smallAvatar: { width: 42, height: 42, borderRadius: 14, marginRight: 12 },
    chatName: { fontSize: 16 },
    chatStatus: { fontSize: 11, fontWeight: '700', marginTop: 1 },
    headerActions: { flexDirection: 'row' },
    headerActionBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

    chatScroll: { padding: 20 },
    dateDividerContainer: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25, opacity: 0.5 },
    line: { flex: 1, height: 1 },
    dateDivider: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    
    receivedBubble: { padding: 16, borderRadius: 22, borderBottomLeftRadius: 4, maxWidth: '85%', marginBottom: 16, borderWidth: 1 },
    receivedText: { fontSize: 15, lineHeight: 22 },
    
    sentBubble: { padding: 16, borderRadius: 22, borderBottomRightRadius: 4, maxWidth: '85%', alignSelf: 'flex-end', marginBottom: 16 },
    sentText: { fontSize: 15, lineHeight: 22, color: 'white' },
    
    bubbleTime: { fontSize: 9, textAlign: 'right', marginTop: 6, fontWeight: '700' },

    inputArea: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, borderTopWidth: 1 },
    textInputWrapper: { flex: 1, borderRadius: 18, paddingHorizontal: 15, marginHorizontal: 10, minHeight: 48, justifyContent: 'center' },
    textInput: { fontSize: 15, maxHeight: 100, paddingVertical: 8 },
    addMedia: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    sendBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 2 }
});