import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

const MAX_WIDTH = 480;

export default function IdentityVerification() {
    const router = useRouter();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    const CONTAINER_WIDTH = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;

    // Chargement des polices
    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    // Thème CLAIR uniquement
    const THEME = {
        primary: '#065F46', 
        primaryLight: '#F0FDF4',
        bg: '#FFFFFF',
        card: '#F8FAFC',
        text: '#0F172A',
        muted: '#64748B',
        border: '#F1F5F9',
    };

    const STEPS = [
        { id: 1, title: 'Scanner le document', sub: 'Carte ID, Passeport ou Permis', icon: 'card-account-details-outline' },
        { id: 2, title: 'Prendre un Selfie', sub: 'Vérification biométrique faciale', icon: 'face-recognition' },
        { id: 3, title: 'Validation IA', sub: 'Approbation instantanée par IA', icon: 'robot-outline' },
    ];

    if (!fontsLoaded) return null;

    return (
        <View style={styles.outerContainer}>
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: THEME.bg }]}>
                <StatusBar barStyle="dark-content" />
                <SafeAreaView style={styles.flex}>
                    
                    {/* Header Moderne */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            onPress={() => router.back()} 
                            style={[styles.backBtn, { borderColor: THEME.border, backgroundColor: THEME.bg }]}
                        >
                            <Ionicons name="chevron-back" size={24} color={THEME.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: THEME.text }]}>Sécurité</Text>
                        <View style={styles.headerRight}>
                             <MaterialCommunityIcons name="shield-check" size={22} color={THEME.primary} />
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        
                        {/* Illustration Hero - Style Minimaliste */}
                        <View style={styles.heroContainer}>
                            <View style={[styles.blob, { backgroundColor: THEME.primaryLight }]} />
                            <View style={[styles.idCardPrimary, { backgroundColor: '#FFF' }]}>
                                <LinearGradient
                                    colors={['#FFFFFF', '#F9FAFB']}
                                    style={styles.cardGradient}
                                >
                                    <MaterialCommunityIcons name="account-details" size={44} color={THEME.primary} />
                                    <View style={styles.cardLines}>
                                        <View style={[styles.lineLong, { backgroundColor: THEME.border }]} />
                                        <View style={[styles.lineShort, { backgroundColor: THEME.border }]} />
                                    </View>
                                </LinearGradient>
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark" size={16} color="#FFF" />
                                </View>
                            </View>
                        </View>

                        {/* Titre Section */}
                        <View style={styles.titleSection}>
                            <Text style={[styles.mainTitle, { color: THEME.text }]}>
                                Vérification{"\n"}
                                <Text style={{ color: THEME.primary }}>Sécurisée</Text>
                            </Text>
                            <Text style={[styles.subtitle, { color: THEME.muted }]}>
                                Nous devons confirmer votre identité pour sécuriser vos transactions agricoles.
                            </Text>
                        </View>

                        {/* Liste des étapes style Timeline */}
                        <View style={styles.stepsContainer}>
                            {STEPS.map((step, index) => (
                                <View key={step.id} style={styles.stepWrapper}>
                                    <View style={styles.stepRow}>
                                        <View style={[styles.iconWrapper, { backgroundColor: THEME.card }]}>
                                            <MaterialCommunityIcons 
                                                name={step.icon as any} 
                                                size={22} 
                                                color={index === 0 ? THEME.primary : THEME.muted} 
                                            />
                                        </View>
                                        <View style={styles.stepTextContent}>
                                            <Text style={[styles.stepTitleText, { color: THEME.text }]}>{step.title}</Text>
                                            <Text style={[styles.stepSubText, { color: THEME.muted }]}>{step.sub}</Text>
                                        </View>
                                        {index === 0 && (
                                            <View style={styles.activeStepBadge}>
                                                <Text style={styles.activeStepText}>À FAIRE</Text>
                                            </View>
                                        )}
                                    </View>
                                    {index < STEPS.length - 1 && <View style={[styles.connector, { backgroundColor: THEME.border }]} />}
                                </View>
                            ))}
                        </View>

                        {/* Bouton d'Action Principal */}
                        <TouchableOpacity 
                            activeOpacity={0.9}
                            onPress={() => router.push('/scanner-document')}
                            style={styles.actionBtn}
                        >
                            <LinearGradient
                                colors={[THEME.primary, '#064E3B']}
                                style={styles.btnGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.btnText}>DÉMARRER LA VÉRIFICATION</Text>
                                <View style={styles.btnCircle}>
                                    <Ionicons name="camera" size={20} color={THEME.primary} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Security Footer */}
                        <View style={styles.securityRow}>
                            <Ionicons name="lock-closed-outline" size={14} color={THEME.muted} />
                            <Text style={[styles.securityLabel, { color: THEME.muted }]}>CRYPTAGE DE BOUT EN BOUT • AES-256</Text>
                        </View>

                    </ScrollView>
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
    innerContainer: { flex: 1, overflow: 'hidden' },
    flex: { flex: 1 },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, height: 70 },
    backBtn: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
    headerTitle: { fontSize: 16, fontFamily: 'PJS-Bold' },
    headerRight: { width: 42, alignItems: 'center' },

    scrollContent: { paddingHorizontal: 30, paddingTop: 10, paddingBottom: 40 },

    heroContainer: { height: 180, justifyContent: 'center', alignItems: 'center', marginVertical: 15 },
    blob: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
    idCardPrimary: {
        width: 100, height: 130, borderRadius: 24,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20 },
            android: { elevation: 10 },
        })
    },
    cardGradient: { flex: 1, borderRadius: 24, justifyContent: 'center', alignItems: 'center', padding: 15 },
    cardLines: { marginTop: 15, width: '100%', gap: 5 },
    lineLong: { height: 3.5, width: '75%', borderRadius: 2 },
    lineShort: { height: 3.5, width: '45%', borderRadius: 2 },
    verifiedBadge: { 
        position: 'absolute', bottom: -5, right: -5, backgroundColor: '#10B981', 
        width: 32, height: 32, borderRadius: 16, justifyContent: 'center', 
        alignItems: 'center', borderWidth: 4, borderColor: '#FFF' 
    },

    titleSection: { alignItems: 'center', marginBottom: 35 },
    mainTitle: { fontSize: 32, fontFamily: 'PJS-ExtraBold', textAlign: 'center', lineHeight: 38, letterSpacing: -1 },
    subtitle: { fontSize: 15, fontFamily: 'PJS-Regular', textAlign: 'center', marginTop: 12, lineHeight: 22 },

    stepsContainer: { marginBottom: 40 },
    stepWrapper: { marginBottom: 5 },
    stepRow: { flexDirection: 'row', alignItems: 'center' },
    iconWrapper: { width: 48, height: 48, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    stepTextContent: { flex: 1, marginLeft: 16 },
    stepTitleText: { fontSize: 16, fontFamily: 'PJS-Bold' },
    stepSubText: { fontSize: 13, fontFamily: 'PJS-Regular', marginTop: 2 },
    activeStepBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    activeStepText: { color: '#059669', fontSize: 10, fontFamily: 'PJS-ExtraBold' },
    connector: { width: 2, height: 20, marginLeft: 23, marginVertical: 4, opacity: 0.5 },

    actionBtn: { 
        height: 68, borderRadius: 24, overflow: 'hidden',
        shadowColor: '#065F46', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 8 
    },
    btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 25, paddingRight: 8 },
    btnText: { color: '#FFF', fontSize: 14, fontFamily: 'PJS-ExtraBold', flex: 1, letterSpacing: 0.5 },
    btnCircle: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },

    securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, opacity: 0.7 },
    securityLabel: { fontSize: 9, fontFamily: 'PJS-Bold', marginLeft: 8, letterSpacing: 0.8 }
});