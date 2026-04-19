import { useAuth } from '@/contexts/AuthContext';
import { sendV1AnthropicChat } from '@/lib/agroconnectApi';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AssistantIaScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const [input, setInput] = useState('');
    const [reply, setReply] = useState('');
    const [busy, setBusy] = useState(false);

    const send = async () => {
        const msg = input.trim();
        if (!msg) return;
        if (!token) {
            Alert.alert('Connexion', 'L’assistant Anthropic nécessite un compte connecté.', [
                { text: 'OK', onPress: () => router.push('/connexion') },
            ]);
            return;
        }
        setBusy(true);
        setReply('');
        try {
            const res = await sendV1AnthropicChat(token, msg);
            setReply(res.reply);
            setInput('');
        } catch (e) {
            Alert.alert('Assistant IA', e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.back}>
                        <Ionicons name="chevron-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                    <Text style={styles.title}>AgroBot (Claude)</Text>
                    <View style={{ width: 40 }} />
                </View>
                <Text style={styles.hint}>
                    Nécessite ANTHROPIC_API_KEY côté serveur. Réponses orientées agriculture (Afrique subsaharienne).
                </Text>
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>
                    {reply ? (
                        <View style={styles.bubble}>
                            <Text style={styles.bubbleText}>{reply}</Text>
                        </View>
                    ) : (
                        <Text style={styles.placeholder}>Posez une question agricole…</Text>
                    )}
                </ScrollView>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
                >
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Votre message"
                            placeholderTextColor="#94A3B8"
                            value={input}
                            onChangeText={setInput}
                            editable={!busy}
                            multiline
                        />
                        <TouchableOpacity style={styles.send} onPress={send} disabled={busy}>
                            {busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F1F5F9' },
    safe: { flex: 1, maxWidth: 520, width: '100%', alignSelf: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    back: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 17, fontWeight: '700', color: '#065F46' },
    hint: {
        fontSize: 12,
        color: '#64748B',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#ECFDF5',
    },
    scroll: { flex: 1 },
    scrollInner: { padding: 20, paddingBottom: 40 },
    placeholder: { color: '#94A3B8', fontSize: 15 },
    bubble: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    bubbleText: { fontSize: 15, color: '#0F172A', lineHeight: 22 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        gap: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 16,
        color: '#0F172A',
    },
    send: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#065F46',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
