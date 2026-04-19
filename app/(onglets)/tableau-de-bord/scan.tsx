import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
// --- IMPORT CAMÉRA ---
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, getApiConnectionHint } from '@/constants/api';
import {
    fetchMlHealth,
    predictPlantDisease,
    type MlHealthResponse,
} from '@/lib/agroconnectApi';

import { Info, Scan, Zap } from 'lucide-react-native';

const MAX_WIDTH = 500;
const GREEN_PRIMARY = '#065F46'; 
const GREEN_LIGHT = '#10B981'; 
const TEXT_PRIMARY = '#0F172A';
const TEXT_MUTED = '#64748B';

/** Extrait le pourcentage numérique depuis une chaîne du type « 12.34% ». */
function parseMlConfidencePercent(confiance: string): number | null {
    const m = /^([\d.]+)\s*%/.exec(confiance.trim());
    if (!m) return null;
    const n = parseFloat(m[1]);
    return Number.isFinite(n) ? n : null;
}

export default function ScanIAPage() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();
    const { user, isReady } = useAuth();
    const CONTAINER_WIDTH = useMemo(() => Math.min(SCREEN_WIDTH, MAX_WIDTH), [SCREEN_WIDTH]);

    useEffect(() => {
        if (!isReady || !user) return;
        if (user.role === 'client') {
            router.replace('/tableau-de-bord');
        }
    }, [isReady, user, router]);
    
    // --- ÉTAT ET RÉFÉRENCE CAMÉRA ---
    const cameraRef = useRef<any>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [mlResult, setMlResult] = useState<{
        maladie: string;
        confiance: string;
        maladieCode?: string;
    } | null>(null);
    const [mlError, setMlError] = useState<string | null>(null);
    const [mlHealth, setMlHealth] = useState<MlHealthResponse | null>(null);
    const [mlHealthLoading, setMlHealthLoading] = useState(false);
    const [mlHealthError, setMlHealthError] = useState<string | null>(null);

    const refreshMlHealth = useCallback(async () => {
        setMlHealthLoading(true);
        setMlHealthError(null);
        try {
            const h = await fetchMlHealth();
            setMlHealth(h);
        } catch (e) {
            setMlHealth(null);
            setMlHealthError(e instanceof Error ? e.message : 'Erreur réseau');
        } finally {
            setMlHealthLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void refreshMlHealth();
        }, [refreshMlHealth])
    );

    // Animation de la ligne de scan
    const scanAnim = useMemo(() => new Animated.Value(0), []);

    useEffect(() => {
        // Demander la permission au montage
        requestPermission();

        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [requestPermission, scanAnim]);

    const runPredict = async (uri: string) => {
        setIsAnalyzing(true);
        setMlError(null);
        try {
            const data = await predictPlantDisease(uri);
            const maladie = data.maladie ?? 'Inconnu';
            const confiance = data.confiance ?? '—';
            const maladieCode = data.maladie_code?.trim();
            setMlResult({ maladie, confiance, maladieCode: maladieCode || undefined });
            void refreshMlHealth();
        } catch (e) {
            const msg =
                e instanceof Error
                    ? e.message
                    : "Impossible d'atteindre le service ML. Lancez FastAPI (8000), puis ml-service (5000) : npm run ml.";
            setMlError(msg);
            setMlResult(null);
            Alert.alert('Erreur diagnostic', msg);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const takePicture = async () => {
        if (!cameraRef.current) return;
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
            await runPredict(photo.uri);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Capture impossible';
            setMlError(msg);
            Alert.alert('Caméra', msg);
        }
    };

    const pickFromGallery = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Galerie', "Autorisez l'accès aux photos pour analyser une image existante.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });
        if (result.canceled || !result.assets[0]?.uri) return;
        await runPredict(result.assets[0].uri);
    };

    const translateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 250],
    });

    const mlHealthUi = useMemo(() => {
        if (mlHealthLoading && !mlHealth) {
            return { bg: '#F1F5F9', fg: TEXT_MUTED, label: 'Vérification du service ML…' };
        }
        if (!mlHealth) {
            const hint = getApiConnectionHint();
            const errDetail =
                mlHealthError?.trim() ||
                'Démarrez le backend FastAPI (port 8000) et le service Flask ML (port 5000) si besoin.';
            const lines = [
                hint,
                `URL testée : ${API_BASE_URL}/api/v1/ml/health`,
                errDetail,
            ].filter(Boolean);
            return {
                bg: hint ? '#FEF2F2' : '#FEF3C7',
                fg: hint ? '#991B1B' : '#92400E',
                label: lines.join('\n\n'),
            };
        }
        if (mlHealth.ml_service === 'down') {
            return {
                bg: '#FEE2E2',
                fg: '#991B1B',
                label: mlHealth.hint ?? `Service ML arrêté (${mlHealth.url})`,
            };
        }
        const loaded = mlHealth.flask?.model_loaded === true;
        const degraded = mlHealth.flask?.status === 'degraded' || !loaded;
        if (degraded) {
            const err = mlHealth.flask?.error;
            return {
                bg: '#FEF3C7',
                fg: '#92400E',
                label:
                    err?.trim() ||
                    'Modèle TFLite non chargé — voir ml-service/README.md (générer agroconnect_model.tflite).',
            };
        }
        return {
            bg: '#ECFDF5',
            fg: GREEN_PRIMARY,
            label: 'Modèle ML prêt (ml-service / Flask)',
        };
    }, [mlHealth, mlHealthLoading, mlHealthError]);

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-Medium': PlusJakartaSans_500Medium,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    // Ne bloque pas l'écran si la police custom tarde à charger via tunnel.
    if (!permission) return null;

    // Écran si la permission est refusée
    if (!permission.granted) {
        return (
            <View style={styles.centerContainer}>
                <Text style={{ textAlign: 'center', marginBottom: 20, fontFamily: 'PJS-Medium' }}>
                    Nous avons besoin de votre autorisation pour utiliser la caméra.
                </Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                    <Text style={{ color: 'white', fontFamily: 'PJS-Bold' }}>Accorder l'accès</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.outerContainer}>
            <StatusBar barStyle="dark-content" />
            
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH }]}>
                <SafeAreaView style={{ flex: 1 }}>
                    
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                            <Ionicons name="close" size={22} color={TEXT_PRIMARY} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { fontFamily: 'PJS-ExtraBold' }]}>
                            Diagnostic IA
                        </Text>
                    </View>

                    <View style={[styles.mlHealthBanner, { backgroundColor: mlHealthUi.bg }]}>
                        {mlHealthLoading ? (
                            <ActivityIndicator size="small" color={mlHealthUi.fg} style={{ marginRight: 8 }} />
                        ) : null}
                        <Text style={[styles.mlHealthBannerText, { color: mlHealthUi.fg }]}>
                            {mlHealthUi.label}
                        </Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.scanCard}>
                            <View style={styles.instructionRow}>
                                <Zap color={GREEN_LIGHT} size={20} />
                                <Text style={[styles.instructionText, { fontFamily: 'PJS-SemiBold' }]}>
                                    Cadrez la zone infectée de la plante
                                </Text>
                            </View>

                            {/* --- CAMÉRA RÉELLE --- */}
                            <View style={styles.cameraPreviewContainer}>
                                <CameraView 
                                    style={StyleSheet.absoluteFill} 
                                    facing="back"
                                    ref={cameraRef}
                                >
                                    <View style={styles.viewfinderContainer}>
                                        <View style={styles.viewfinder}>
                                            <View style={[styles.corner, styles.topLeft]} />
                                            <View style={[styles.corner, styles.topRight]} />
                                            <View style={[styles.corner, styles.bottomLeft]} />
                                            <View style={[styles.corner, styles.bottomRight]} />

                                            <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]}>
                                                <LinearGradient
                                                    colors={['transparent', 'rgba(16, 185, 129, 0.4)', 'transparent']}
                                                    style={{ flex: 1 }}
                                                />
                                            </Animated.View>
                                        </View>
                                    </View>
                                </CameraView>
                                {isAnalyzing && (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator size="large" color="white" />
                                    </View>
                                )}
                            </View>

                            <View style={styles.captureControls}>
                                <TouchableOpacity
                                    style={styles.secondaryCaptureBtn}
                                    onPress={() => void pickFromGallery()}
                                    disabled={isAnalyzing}
                                >
                                    <Ionicons name="image-outline" size={24} color={GREEN_PRIMARY} />
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.mainCaptureBtn} 
                                    onPress={takePicture}
                                    disabled={isAnalyzing}
                                >
                                    <LinearGradient colors={[GREEN_LIGHT, GREEN_PRIMARY]} style={styles.captureGradient}>
                                        {isAnalyzing ? <ActivityIndicator color="white" /> : <Scan color="white" size={32} />}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.secondaryCaptureBtn}>
                                    <Info color={GREEN_PRIMARY} size={24} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            <Feather name="help-circle" size={20} color={TEXT_MUTED} />
                            <Text style={[styles.infoText, { fontFamily: 'PJS-Medium' }]}>
                                Assurez-vous d'avoir un bon éclairage pour une meilleure précision. Le diagnostic est envoyé à POST /api/v1/ml/predict (FastAPI → Flask ml-service, modèle TFLite).
                            </Text>
                        </View>

                        {mlError ? (
                            <View style={styles.resultCard}>
                                <Text style={[styles.resultTitle, { color: '#B91C1C' }]}>Erreur</Text>
                                <Text style={styles.resultBody}>{mlError}</Text>
                            </View>
                        ) : null}

                        {mlResult ? (
                            <View style={styles.resultCard}>
                                <Text style={styles.resultTitle}>Résultat</Text>
                                {(() => {
                                    const pct = parseMlConfidencePercent(mlResult.confiance);
                                    const low = pct !== null && pct < 20;
                                    return low ? (
                                        <View style={styles.lowConfidenceBanner}>
                                            <Feather name="alert-triangle" size={18} color="#B45309" />
                                            <Text style={styles.lowConfidenceText}>
                                                Confiance très faible (proche du hasard sur 38 classes). Le libellé ci-dessous
                                                n&apos;est pas fiable tant que le modèle n&apos;est pas entraîné (voir ml-service/train_model.py).
                                            </Text>
                                        </View>
                                    ) : null;
                                })()}
                                <Text style={styles.resultDisease}>{mlResult.maladie}</Text>
                                {mlResult.maladieCode ? (
                                    <Text style={[styles.resultBody, { opacity: 0.75, fontSize: 12 }]}>
                                        Réf. classe : {mlResult.maladieCode}
                                    </Text>
                                ) : null}
                                <Text style={styles.resultBody}>Confiance : {mlResult.confiance}</Text>
                            </View>
                        ) : null}

                        <View style={{ height: 120 }} />
                    </ScrollView>

                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center' },
    innerContainer: { flex: 1, backgroundColor: '#FFFFFF' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    permissionBtn: { backgroundColor: GREEN_PRIMARY, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 45 : 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', height: 100 },
    closeBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    headerTitle: { fontSize: 24, letterSpacing: -0.5, marginLeft: 15, color: TEXT_PRIMARY },
    mlHealthBanner: {
        marginHorizontal: 20,
        marginBottom: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    mlHealthBannerText: { flex: 1, fontFamily: 'PJS-Medium', fontSize: 12, lineHeight: 17 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    scanCard: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', elevation: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10 },
    instructionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    instructionText: { fontSize: 14, color: TEXT_PRIMARY, flex: 1 },
    
    // Zone Caméra
    cameraPreviewContainer: { width: '100%', height: 320, backgroundColor: '#000', borderRadius: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 25 },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    
    viewfinderContainer: { alignSelf: 'center', width: '80%', height: 250 },
    viewfinder: { flex: 1 },
    corner: { position: 'absolute', width: 35, height: 35, borderColor: GREEN_LIGHT, borderWidth: 5 },
    topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 12 },
    topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 12 },
    bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 12 },
    bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 12 },
    scanLine: { width: '100%', height: 4, position: 'absolute', backgroundColor: GREEN_LIGHT, borderRadius: 2 },

    captureControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    mainCaptureBtn: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#FFFFFF', padding: 7, elevation: 10 },
    captureGradient: { flex: 1, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    secondaryCaptureBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, marginTop: 25, gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    infoText: { fontSize: 12, color: TEXT_MUTED, flex: 1 },
    resultCard: {
        marginTop: 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    lowConfidenceBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 10,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    lowConfidenceText: {
        flex: 1,
        fontFamily: 'PJS-Medium',
        fontSize: 12,
        lineHeight: 17,
        color: '#92400E',
    },
    resultTitle: { fontFamily: 'PJS-Bold', fontSize: 12, color: TEXT_MUTED, marginBottom: 6 },
    resultDisease: { fontFamily: 'PJS-ExtraBold', fontSize: 18, color: GREEN_PRIMARY, marginBottom: 4 },
    resultBody: { fontFamily: 'PJS-Medium', fontSize: 13, color: TEXT_PRIMARY, lineHeight: 20 },
});