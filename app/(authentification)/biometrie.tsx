import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 450;
const CONTAINER_WIDTH = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;

export default function BiometrieScreen() {
    const router = useRouter();

    return (
        <View style={styles.outerContainer}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH }]}>
                <SafeAreaView style={styles.safeArea}>
                    
                    {/* En-tête */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                            <Ionicons name="close-outline" size={30} color="#1E293B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>VÉRIFICATION D'IDENTITÉ</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.content}>
                        {/* Titre et Instruction */}
                        <View style={styles.textSection}>
                            <Text style={styles.mainTitle}>Détection de présence</Text>
                            <View style={styles.instructionBadge}>
                                <Text style={styles.instructionText}>Regardez la caméra et clignez des yeux</Text>
                            </View>
                        </View>

                        {/* Zone de Capture Circulaire */}
                        <View style={styles.faceContainer}>
                            <View style={styles.outerCircle}>
                                <View style={styles.innerCircle}>
                                    {/* Avatar central haute visibilité */}
                                    <MaterialCommunityIcons name="account-circle-outline" size={160} color="#F1F5F9" />
                                </View>
                            </View>
                            {/* Anneau de scan vert premium */}
                            <View style={styles.scanRing} />
                        </View>

                        {/* Mention de sécurité */}
                        <View style={styles.securityInfo}>
                            <MaterialCommunityIcons name="shield-check-outline" size={16} color="#94A3B8" />
                            <Text style={styles.securityText}>BIOMÉTRIE CHIFFRÉE</Text>
                        </View>

                        {/* Bouton de déclenchement avec redirection vers Succes */}
                        <View style={styles.footer}>
                            <TouchableOpacity 
                                style={styles.captureBtn} 
                                activeOpacity={0.8}
                                onPress={() => router.push('/Succes')}
                            >
                                <View style={styles.captureOuterRing}>
                                    <LinearGradient
                                        colors={['#10B981', '#34D399']}
                                        style={styles.captureInnerCircle}
                                    >
                                        {/* Utilisation de camera-iris pour le look "shutter" du design */}
                                        <MaterialCommunityIcons name="camera-iris" size={38} color="#FFFFFF" />
                                    </LinearGradient>
                                </View>
                            </TouchableOpacity>
                            
                            <Text style={styles.hint}>
                                Positionnez votre visage dans le cercle.{"\n"}
                                Assurez-vous qu'il y a assez de lumière.
                            </Text>
                        </View>
                    </View>

                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { 
        flex: 1, 
        backgroundColor: '#FFFFFF', 
        alignItems: 'center' 
    },
    innerContainer: { 
        flex: 1, 
        backgroundColor: '#FFFFFF' 
    },
    safeArea: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingVertical: 15 
    },
    closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.5 },
    
    content: { flex: 1, alignItems: 'center', paddingTop: 20 },
    textSection: { alignItems: 'center', marginBottom: 30 },
    mainTitle: { fontSize: 32, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
    instructionBadge: { 
        backgroundColor: '#FFFFFF', 
        paddingHorizontal: 24, 
        paddingVertical: 12, 
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#10B981',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2
    },
    instructionText: { color: '#10B981', fontWeight: '600', fontSize: 16 },

    faceContainer: { 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 40,
        height: 340,
        width: 340,
    },
    outerCircle: { 
        width: 290, 
        height: 290, 
        borderRadius: 145, 
        backgroundColor: '#FFFFFF',
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.03,
        shadowRadius: 20,
    },
    innerCircle: {
        width: 270,
        height: 270,
        borderRadius: 135,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    scanRing: {
        position: 'absolute',
        width: 315,
        height: 315,
        borderRadius: 157.5,
        borderWidth: 2,
        borderColor: '#10B981',
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
        transform: [{ rotate: '-45deg' }],
    },

    securityInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
    securityText: { fontSize: 12, fontWeight: '700', color: '#CBD5E1', marginLeft: 8, letterSpacing: 0.8 },

    footer: { width: '100%', alignItems: 'center', paddingHorizontal: 40 },
    captureBtn: { marginBottom: 20 },
    captureOuterRing: {
        width: 86,
        height: 86,
        borderRadius: 43,
        borderWidth: 2.5,
        borderColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInnerCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6
    },
    hint: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, fontWeight: '500' }
});