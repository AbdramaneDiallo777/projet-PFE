import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, LayoutGrid, Leaf, ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

const MAX_WIDTH = 480; // Largeur maximale pour le contenu
const GREEN_DEEP = '#065F46'; 
const GREEN_LIGHT = '#F0FDF4';

export default function SuccessScreen() {
    const router = useRouter();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const containerWidth = Math.min(SCREEN_WIDTH, MAX_WIDTH);
    
    // Animations
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 45,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                delay: 200,
                useNativeDriver: true,
            })
        ]).start();
    }, [scaleAnim, fadeAnim]);

    if (!fontsLoaded) return null;

    const Badge = ({ icon: Icon, label, sublabel }: any) => (
        <View style={styles.badge}>
            <View style={styles.badgeIconContainer}>
                <Icon color={GREEN_DEEP} size={22} strokeWidth={2.5} />
            </View>
            <View style={styles.badgeText}>
                <Text style={styles.badgeLabel}>{label}</Text>
                <Text style={styles.badgeSublabel}>{sublabel}</Text>
            </View>
            <View style={styles.miniCheck}>
                <Check color="#FFF" size={10} strokeWidth={4} />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <SafeAreaView style={styles.safeArea}>
                {/* Wrapper Responsif avec Max Width */}
                <View style={[styles.responsiveWrapper, { width: containerWidth }]}>
                    
                    <View style={styles.content}>
                        
                        {/* Visual Section */}
                        <View style={styles.visualContainer}>
                            <View style={styles.haloEffect} />
                            <Animated.View style={[styles.mainIcon, { transform: [{ scale: scaleAnim }] }]}>
                                <Check color="#FFF" size={48} strokeWidth={3} />
                            </Animated.View>
                        </View>

                        {/* Text Section */}
                        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
                            <Text style={styles.title}>Compte activé !</Text>
                            <Text style={styles.subtitle}>
                                Bienvenue dans l'écosystème <Text style={{color: GREEN_DEEP, fontFamily: 'PJS-Bold'}}>Agro IA</Text>. Votre profil est prêt pour l'aventure agritech.
                            </Text>
                        </Animated.View>

                        {/* Bento Cards Section */}
                        <Animated.View style={[styles.bentoSection, { opacity: fadeAnim }]}>
                            <Badge 
                                icon={Leaf} 
                                label="Profil Vérifié" 
                                sublabel="Accès complet au réseau" 
                            />
                            <Badge 
                                icon={LayoutGrid} 
                                label="Tableau de bord" 
                                sublabel="Outils pro débloqués" 
                            />
                        </Animated.View>

                        {/* Actions */}
                        <Animated.View style={[styles.actionContainer, { opacity: fadeAnim }]}>
                            <TouchableOpacity 
                                style={styles.primaryBtn}
                            onPress={() => router.replace('/tableau-de-bord')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.primaryBtnText}>Accéder au dashboard</Text>
                                <ArrowRight color="#FFF" size={20} strokeWidth={2.5} />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.secondaryBtn}
                                onPress={() => router.replace('/')}
                            >
                                <Text style={styles.secondaryBtnText}>Retour à l'accueil</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Trusted Footer */}
                        <View style={styles.footer}>
                            <ShieldCheck color="#94a3b8" size={16} />
                            <Text style={styles.footerText}>SÉCURISÉ PAR AGRO-BLOCKCHAIN</Text>
                        </View>

                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    safeArea: { flex: 1 },
    // Gestion du MAX_WIDTH et du centrage
    responsiveWrapper: {
        flex: 1,
        width: '100%',
        maxWidth: MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: 32,
    },
    content: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    
    visualContainer: { marginBottom: 40, alignItems: 'center', justifyContent: 'center' },
    haloEffect: { 
        position: 'absolute', width: 160, height: 160, borderRadius: 80, 
        backgroundColor: GREEN_LIGHT, opacity: 0.8 
    },
    mainIcon: { 
        width: 100, height: 100, borderRadius: 35, 
        backgroundColor: GREEN_DEEP, alignItems: 'center', justifyContent: 'center',
        shadowColor: GREEN_DEEP, 
        shadowOffset: { width: 0, height: 12 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 20, 
        elevation: 10
    },
    
    textContainer: { alignItems: 'center', marginBottom: 40 },
    title: { fontSize: 36, fontFamily: 'PJS-ExtraBold', color: '#0f172a', textAlign: 'center' },
    subtitle: { fontSize: 16, fontFamily: 'PJS-Regular', color: '#64748b', textAlign: 'center', lineHeight: 24, marginTop: 12 },

    bentoSection: { width: '100%', gap: 12, marginBottom: 45 },
    badge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        borderRadius: 24, 
        backgroundColor: '#f8fafc', 
        borderWidth: 1, 
        borderColor: '#f1f5f9' 
    },
    badgeIconContainer: { 
        width: 48, 
        height: 48, 
        borderRadius: 16, 
        backgroundColor: '#FFF', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderWidth: 1, 
        borderColor: '#f1f5f9' 
    },
    badgeText: { flex: 1, marginLeft: 16 },
    badgeLabel: { fontSize: 16, fontFamily: 'PJS-Bold', color: '#1e293b' },
    badgeSublabel: { fontSize: 13, fontFamily: 'PJS-Regular', color: '#94a3b8', marginTop: 2 },
    miniCheck: { 
        width: 20, 
        height: 20, 
        borderRadius: 10, 
        backgroundColor: GREEN_DEEP, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },

    actionContainer: { width: '100%', gap: 12 },
    primaryBtn: { 
        height: 64, 
        borderRadius: 20, 
        backgroundColor: GREEN_DEEP, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 12,
        shadowColor: GREEN_DEEP, 
        shadowOffset: { width: 0, height: 10 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 15, 
        elevation: 8
    },
    primaryBtnText: { color: '#FFF', fontSize: 17, fontFamily: 'PJS-ExtraBold' },
    secondaryBtn: { height: 50, alignItems: 'center', justifyContent: 'center' },
    secondaryBtnText: { color: '#94a3b8', fontSize: 15, fontFamily: 'PJS-SemiBold' },

    footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 40, opacity: 0.5 },
    footerText: { fontSize: 10, fontFamily: 'PJS-Bold', color: '#475569', letterSpacing: 1 }
});