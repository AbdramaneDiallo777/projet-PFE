import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 500;
const CONTAINER_WIDTH = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;

export default function LoginScreen() {
    const router = useRouter();
    const { login, isReady } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState<string | null>(null);

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    // COULEURS FIXÉES EN MODE CLAIR
    const COLORS = {
        primary: '#065F46', 
        accent: '#10B981',
        bg: '#FFFFFF',
        outerBg: '#F8FAFC',
        text: '#0F172A',
        textMuted: '#64748B',
        inputBg: '#F8FAFC',
        border: '#F1F5F9',
    };

    // En mode tunnel/public, le chargement des polices peut échouer ; on laisse l'écran s'afficher.
    if (!isReady) return null;

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert('Champs requis', 'Renseignez votre email et votre mot de passe.');
            return;
        }
        setSubmitting(true);
        try {
            await login(email.trim(), password);
            router.replace('/tableau-de-bord');
        } catch (e) {
            Alert.alert('Connexion impossible', e instanceof Error ? e.message : String(e));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[styles.outerContainer, { backgroundColor: COLORS.outerBg }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: COLORS.bg }]}>
                <SafeAreaView style={{ flex: 1 }}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            
                            {/* --- SECTION HERO --- */}
                            <View style={styles.heroWrapper}>
                                <View style={[styles.imageFloatingCard, { shadowColor: '#065F46' }]}>
                                    <Image 
                                        source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000' }} 
                                        style={styles.heroImage}
                                    />
                                    <LinearGradient 
                                        colors={['rgba(6, 95, 70, 0.8)', 'transparent']}
                                        style={styles.imageOverlay}
                                    />
                                    <View style={styles.heroBadge}>
                                        <MaterialCommunityIcons name="leaf" size={14} color="#065F46" />
                                        <Text style={styles.heroBadgeText}>AGRO AI ACTIVE</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formContainer}>
                                {/* --- HEADER --- */}
                                <View style={styles.headerText}>
                                    <Text style={[styles.title, { color: COLORS.text }]}>
                                        Heureux de vous{"\n"}
                                        <Text style={{ color: COLORS.primary }}>revoir.</Text>
                                    </Text>
                                    <Text style={[styles.subtitle, { color: COLORS.textMuted }]}>
                                        Pilotez votre exploitation avec l'intelligence de demain.
                                    </Text>
                                </View>

                                {/* --- FORMULAIRE --- */}
                                <View style={styles.inputStack}>
                                    <View style={[
                                        styles.inputBox, 
                                        { backgroundColor: COLORS.inputBg, borderColor: isFocused === 'id' ? COLORS.primary : COLORS.border }
                                    ]}>
                                        <Ionicons name="mail-unread-outline" size={20} color={isFocused === 'id' ? COLORS.primary : COLORS.textMuted} />
                                        <TextInput 
                                            placeholder="Email"
                                            placeholderTextColor={COLORS.textMuted}
                                            onFocus={() => setIsFocused('id')}
                                            onBlur={() => setIsFocused(null)}
                                            style={[styles.textInput, { color: COLORS.text }]}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            value={email}
                                            onChangeText={setEmail}
                                            editable={!submitting}
                                        />
                                    </View>

                                    <View style={[
                                        styles.inputBox, 
                                        { backgroundColor: COLORS.inputBg, borderColor: isFocused === 'pass' ? COLORS.primary : COLORS.border }
                                    ]}>
                                        <Ionicons name="key-outline" size={20} color={isFocused === 'pass' ? COLORS.primary : COLORS.textMuted} />
                                        <TextInput 
                                            placeholder="Mot de passe"
                                            placeholderTextColor={COLORS.textMuted}
                                            secureTextEntry={!showPassword}
                                            onFocus={() => setIsFocused('pass')}
                                            onBlur={() => setIsFocused(null)}
                                            style={[styles.textInput, { color: COLORS.text }]}
                                            value={password}
                                            onChangeText={setPassword}
                                            editable={!submitting}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.textMuted} />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity style={styles.forgotBtn}>
                                        <Text style={[styles.forgotText, { color: COLORS.primary }]}>Identifiants oubliés ?</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* --- BOUTON DE CONNEXION --- */}
                                <TouchableOpacity 
                                    activeOpacity={0.9} 
                                    style={styles.loginBtnWrapper} 
                                    onPress={handleLogin}
                                    disabled={submitting}
                                >
                                    <LinearGradient 
                                        colors={[COLORS.primary, '#044231']} 
                                        start={{x: 0, y: 0}} end={{x: 1, y: 0}} 
                                        style={styles.loginBtn}
                                    >
                                        {submitting ? (
                                            <ActivityIndicator color="#FFF" style={{ marginLeft: 38 }} />
                                        ) : (
                                            <>
                                                <Text style={styles.loginBtnText}>Se connecter</Text>
                                                <View style={styles.btnCircle}>
                                                    <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
                                                </View>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* --- SÉPARATEUR --- */}
                                <View style={styles.separatorContainer}>
                                    <View style={[styles.line, { backgroundColor: COLORS.border }]} />
                                    <Text style={[styles.separatorText, { color: COLORS.textMuted }]}>OU VIA</Text>
                                    <View style={[styles.line, { backgroundColor: COLORS.border }]} />
                                </View>

                                {/* --- RÉSEAUX SOCIAUX --- */}
                                <View style={styles.socialRow}>
                                    <TouchableOpacity style={[styles.socialCircle, { backgroundColor: COLORS.bg, borderColor: COLORS.border }]}>
                                        <Image 
                                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
                                            style={styles.socialIcon} 
                                        />
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity style={[styles.socialCircle, { backgroundColor: '#ECFDF5', borderColor: COLORS.accent }]}>
                                        <Ionicons name="finger-print" size={28} color={COLORS.accent} />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.socialCircle, { backgroundColor: COLORS.bg, borderColor: COLORS.border }]}>
                                        <Ionicons name="logo-apple" size={28} color={COLORS.text} />
                                    </TouchableOpacity>
                                </View>

                                {/* --- FOOTER --- */}
                                <TouchableOpacity 
                                    style={styles.footerLink}
                                    onPress={() => router.push('/inscription')}
                                >
                                    <Text style={[styles.footerText, { color: COLORS.textMuted }]}>
                                        Pas encore de compte ? <Text style={{ color: COLORS.primary, fontFamily: 'PJS-Bold' }}>Créer un profil</Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>

                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    innerContainer: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    
    heroWrapper: { height: 260, padding: 24, alignItems: 'center' },
    imageFloatingCard: { 
        width: '100%', height: '100%', borderRadius: 32, overflow: 'hidden', 
        elevation: 15, shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }
    },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    imageOverlay: { ...StyleSheet.absoluteFillObject },
    heroBadge: { 
        position: 'absolute', top: 20, left: 20, 
        flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
        alignItems: 'center', gap: 6,
    },
    heroBadgeText: { fontSize: 10, color: '#065F46', fontFamily: 'PJS-ExtraBold', letterSpacing: 0.5 },

    formContainer: { paddingHorizontal: 32 },
    headerText: { marginBottom: 30 },
    title: { fontSize: 32, fontFamily: 'PJS-ExtraBold', letterSpacing: -1, lineHeight: 38 },
    subtitle: { fontSize: 15, fontFamily: 'PJS-Regular', marginTop: 10, lineHeight: 24 },

    inputStack: { gap: 16 },
    inputBox: { 
        flexDirection: 'row', alignItems: 'center', height: 62, 
        borderRadius: 20, paddingHorizontal: 20,
        borderWidth: 1.5,
    },
    textInput: { flex: 1, marginLeft: 12, fontSize: 16, fontFamily: 'PJS-SemiBold' },
    forgotBtn: { alignSelf: 'flex-end', marginTop: 5 },
    forgotText: { fontSize: 13, fontFamily: 'PJS-Bold' },

    loginBtnWrapper: { 
        marginTop: 35, borderRadius: 24, overflow: 'hidden', 
        elevation: 8, shadowColor: '#065F46', shadowOpacity: 0.3, shadowRadius: 15 
    },
    loginBtn: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, paddingHorizontal: 20 },
    loginBtnText: { color: '#FFF', fontSize: 17, fontFamily: 'PJS-ExtraBold', flex: 1, textAlign: 'center', marginLeft: 38 },
    btnCircle: { width: 38, height: 38, backgroundColor: '#FFF', borderRadius: 19, justifyContent: 'center', alignItems: 'center' },

    separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 35 },
    line: { flex: 1, height: 1.2, opacity: 0.5 },
    separatorText: { paddingHorizontal: 15, fontSize: 10, fontFamily: 'PJS-ExtraBold', letterSpacing: 1.5 },

    socialRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
    socialCircle: {
        width: 60, height: 60, borderRadius: 20, 
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5,
    },
    socialIcon: { width: 24, height: 24 },

    footerLink: { marginTop: 40, marginBottom: 20, alignItems: 'center' },
    footerText: { fontSize: 15, fontFamily: 'PJS-Regular' }
});