import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 500;
const CONTAINER_WIDTH = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;
const GREEN_DEEP = '#065F46'; // Ton vert forêt signature

export default function AIScanScreen() {
    const router = useRouter();
    const cameraRef = useRef<CameraView>(null);
    
    const [permission, requestPermission] = useCameraPermissions();
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    useEffect(() => {
        if (!permission) requestPermission();
    }, [permission, requestPermission]);

    const handleCapture = async () => {
        if (cameraRef.current && !isCapturing) {
            try {
                setIsCapturing(true);
                await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    skipMetadata: true,
                });
                router.push('/(authentification)/Succes');
            } catch (error) {
                console.error(error);
            } finally {
                setIsCapturing(false);
            }
        }
    };

    if (!permission || !fontsLoaded) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={GREEN_DEEP} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>L'accès à la caméra est nécessaire.</Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                    <Text style={styles.permissionBtnText}>AUTORISER L'ACCÈS</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.outerContainer}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH }]}>
                
                <CameraView 
                    style={styles.camera} 
                    ref={cameraRef}
                    facing="back"
                    enableTorch={isFlashOn}
                >
                    <View style={styles.overlay}>
                        <SafeAreaView style={styles.flex}>
                            {/* Header */}
                            <View style={styles.header}>
                                <TouchableOpacity onPress={() => router.back()} style={styles.glassBtn}>
                                    <Ionicons name="chevron-back" size={24} color="white" />
                                </TouchableOpacity>

                                <View style={styles.idBadge}>
                                    <View style={styles.pulseDot} />
                                    <Text style={styles.idBadgeText}>SCAN IA EN COURS</Text>
                                </View>

                                <TouchableOpacity 
                                    style={styles.glassBtn} 
                                    onPress={() => setIsFlashOn(!isFlashOn)}
                                >
                                    <Ionicons name={isFlashOn ? "flash" : "flash-off"} size={22} color="white" />
                                </TouchableOpacity>
                            </View>

                            {/* Instructions */}
                            <View style={styles.instructionContainer}>
                                <Text style={styles.mainInstruction}>Document d'identité</Text>
                                <Text style={styles.subInstruction}>Cadrez le recto de votre carte dans la zone</Text>
                            </View>

                            {/* Cadre de Scan Moderne */}
                            <View style={styles.scannerArea}>
                                <View style={styles.neonFrame}>
                                    <View style={[styles.corner, styles.topLeft]} />
                                    <View style={[styles.corner, styles.topRight]} />
                                    <View style={[styles.corner, styles.bottomLeft]} />
                                    <View style={[styles.corner, styles.bottomRight]} />
                                </View>
                            </View>
                        </SafeAreaView>

                        {/* Footer Blanc Premium */}
                        <View style={styles.footerContainer}>
                            <View style={styles.footerHandle} />
                            
                            <View style={styles.footerActions}>
                                <TouchableOpacity style={styles.footerSideBtn}>
                                    <View style={styles.smallCircle}>
                                        <Ionicons name="images" size={20} color="#64748B" />
                                    </View>
                                    <Text style={styles.footerLabel}>GALERIE</Text>
                                </TouchableOpacity>

                                {/* Bouton de Capture Central */}
                                <TouchableOpacity 
                                    activeOpacity={0.9}
                                    style={[styles.shutterButton, isCapturing && { opacity: 0.5 }]}
                                    onPress={handleCapture}
                                    disabled={isCapturing}
                                >
                                    <View style={styles.shutterOuter}>
                                        <View style={styles.shutterInner} />
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.footerSideBtn}>
                                    <View style={styles.smallCircle}>
                                        <Ionicons name="help-buoy" size={20} color="#64748B" />
                                    </View>
                                    <Text style={styles.footerLabel}>AIDE</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.securityNote}>
                                <Ionicons name="shield-checkmark" size={14} color="#94A3B8" />
                                <Text style={styles.securityText}>TRAITEMENT IA SÉCURISÉ</Text>
                            </View>
                        </View>
                    </View>
                </CameraView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
    innerContainer: { flex: 1, overflow: 'hidden' },
    centerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    flex: { flex: 1 },
    camera: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },

    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingTop: Platform.OS === 'android' ? 40 : 10 
    },
    glassBtn: { 
        width: 44, 
        height: 44, 
        borderRadius: 15, 
        backgroundColor: 'rgba(255,255,255,0.15)', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    idBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255,255,255,0.95)', 
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        borderRadius: 12, 
        gap: 8 
    },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN_DEEP },
    idBadgeText: { color: GREEN_DEEP, fontSize: 10, fontFamily: 'PJS-ExtraBold', letterSpacing: 0.5 },

    instructionContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40 },
    mainInstruction: { color: 'white', fontSize: 24, fontFamily: 'PJS-ExtraBold', textAlign: 'center' },
    subInstruction: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: 'PJS-Regular', textAlign: 'center', marginTop: 8 },

    scannerArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 120 },
    neonFrame: { 
        width: CONTAINER_WIDTH * 0.88, 
        height: 240, 
        position: 'relative',
        shadowColor: GREEN_DEEP,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15
    },
    corner: { position: 'absolute', width: 40, height: 40, borderColor: 'white', borderWidth: 3 },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 25 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 25 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 25 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 25 },

    footerContainer: { 
        position: 'absolute', 
        bottom: 0, 
        width: '100%', 
        backgroundColor: '#FFFFFF', 
        borderTopLeftRadius: 40, 
        borderTopRightRadius: 40, 
        paddingBottom: Platform.OS === 'ios' ? 40 : 30, 
        paddingTop: 12, 
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10
    },
    footerHandle: { width: 45, height: 5, backgroundColor: '#F1F5F9', borderRadius: 10, marginBottom: 25 },
    footerActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', alignItems: 'center' },
    footerSideBtn: { alignItems: 'center', gap: 8 },
    smallCircle: { 
        width: 48, 
        height: 48, 
        borderRadius: 16, 
        backgroundColor: '#F8FAFC', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    footerLabel: { fontSize: 9, fontFamily: 'PJS-ExtraBold', color: '#94A3B8', letterSpacing: 0.5 },

    shutterButton: { 
        width: 84, 
        height: 84, 
        borderRadius: 42, 
        backgroundColor: '#F1F5F9', 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    shutterOuter: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: GREEN_DEEP
    },
    shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: GREEN_DEEP },

    securityNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 25, opacity: 0.6 },
    securityText: { color: '#64748B', fontSize: 10, fontFamily: 'PJS-Bold', letterSpacing: 0.5 },
    
    errorText: { color: 'white', textAlign: 'center', marginBottom: 20, fontSize: 16, fontFamily: 'PJS-SemiBold' },
    permissionBtn: { backgroundColor: GREEN_DEEP, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
    permissionBtnText: { color: 'white', fontFamily: 'PJS-ExtraBold', fontSize: 14 }
});