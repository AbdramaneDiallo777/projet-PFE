import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

const MAX_WIDTH = 500;

const LANGUAGES = [
    { id: 'en', label: 'English', icon: 'earth' },
    { id: 'fr', label: 'Français', icon: 'earth' },
    { id: 'ar', label: 'العربية', icon: 'earth' },
    { id: 'es', label: 'Español', icon: 'earth' },
];

export default function LanguageSelectionScreen() {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState('fr');
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    const CONTAINER_WIDTH = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;

    // VERT FONCÉ DÉGRADÉ (Cohérent avec le reste de l'app)
    const GREEN_GRADIENT = ['#059669', '#064E3B']; 

    // THÈME CLAIR UNIQUEMENT
    const THEME = {
        primary: '#064E3B',
        background: '#F8FAFC',
        card: '#FFFFFF',
        text: '#0F172A',
        textMuted: '#64748B',
        border: '#F1F5F9',
        iconCircle: '#F8FAFC',
    };

    if (!fontsLoaded) return null;

    return (
        <View style={[styles.outerContainer, { backgroundColor: THEME.background }]}>
            {/* StatusBar forcée en noir pour fond clair */}
            <StatusBar barStyle="dark-content" />
            
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH }]}>
                <SafeAreaView style={styles.safeArea}>
                    
                    {/* Header avec progression */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            onPress={() => router.back()} 
                            style={[styles.backBtn, { backgroundColor: THEME.card, borderColor: THEME.border }]}
                        >
                            <Feather name="chevron-left" size={24} color={THEME.text} />
                        </TouchableOpacity>
                        
                        <View style={styles.progressWrapper}>
                            <View style={[styles.progressBackground, { backgroundColor: '#E2E8F0' }]}>
                                <LinearGradient 
                                    colors={GREEN_GRADIENT} 
                                    start={{x: 0, y: 0}} end={{x: 1, y: 0}} 
                                    style={[styles.progressFill, { width: '50%' }]} 
                                />
                            </View>
                            <Text style={[styles.progressText, { color: THEME.textMuted }]}>Étape 1 sur 2</Text>
                        </View>
                        <View style={{ width: 44 }} />
                    </View>

                    {/* Titres */}
                    <View style={styles.titleSection}>
                        <Text style={[styles.mainTitle, { color: THEME.text }]}>
                            Sélectionnez <Text style={{ color: '#059669' }}>la langue</Text>
                        </Text>
                        <Text style={[styles.subtitle, { color: THEME.textMuted }]}>
                            Quelle langue préférez-vous pour piloter votre exploitation ?
                        </Text>
                    </View>

                    {/* Grille des langues compacte */}
                    <View style={styles.grid}>
                        {LANGUAGES.map((lang) => {
                            const isSelected = selectedId === lang.id;
                            return (
                                <TouchableOpacity
                                    key={lang.id}
                                    activeOpacity={0.9}
                                    onPress={() => setSelectedId(lang.id)}
                                    style={[
                                        styles.langCard,
                                        { 
                                            backgroundColor: THEME.card, 
                                            borderColor: isSelected ? '#059669' : THEME.border,
                                            borderWidth: isSelected ? 2 : 1.5
                                        }
                                    ]}
                                >
                                    {isSelected && (
                                        <LinearGradient colors={GREEN_GRADIENT} style={styles.checkBadge}>
                                            <Ionicons name="checkmark-sharp" size={12} color="#FFF" />
                                        </LinearGradient>
                                    )}
                                    
                                    <View style={[
                                        styles.iconCircle,
                                        { backgroundColor: isSelected ? 'rgba(5, 150, 105, 0.1)' : THEME.iconCircle }
                                    ]}>
                                        <MaterialCommunityIcons 
                                            name={lang.icon as any} 
                                            size={22} 
                                            color={isSelected ? '#059669' : THEME.textMuted} 
                                        />
                                    </View>
                                    
                                    <Text style={[
                                        styles.langLabel,
                                        { 
                                            color: isSelected ? THEME.text : THEME.textMuted, 
                                            fontFamily: isSelected ? 'PJS-Bold' : 'PJS-SemiBold' 
                                        }
                                    ]}>
                                        {lang.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Footer - Bouton Vert Foncé Dégradé */}
                    <View style={styles.footer}>
                        <TouchableOpacity 
                            onPress={() => router.push('/selection-pays')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient 
                                colors={GREEN_GRADIENT}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={styles.btnAction}
                            >
                                <Text style={styles.btnText}>Continuer</Text>
                                <Feather name="arrow-right" size={20} color="#FFF" style={{marginLeft: 10}} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, alignItems: 'center' },
    innerContainer: { flex: 1 },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    progressWrapper: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
    progressBackground: { height: 6, width: 80, borderRadius: 10, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 10 },
    progressText: { fontSize: 10, fontFamily: 'PJS-ExtraBold', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
    titleSection: { alignItems: 'center', marginTop: 30, marginBottom: 30, paddingHorizontal: 30 },
    mainTitle: { fontSize: 24, fontFamily: 'PJS-ExtraBold', textAlign: 'center' },
    subtitle: { fontSize: 14, fontFamily: 'PJS-Regular', textAlign: 'center', marginTop: 10, lineHeight: 20 },
    
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 20 },
    langCard: { 
        width: '44%', 
        aspectRatio: 1.1, 
        margin: '3%', 
        borderRadius: 24, 
        justifyContent: 'center', 
        alignItems: 'center', 
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        position: 'relative'
    },
    checkBadge: { position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    iconCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    langLabel: { fontSize: 14 },
    
    footer: { position: 'absolute', bottom: 40, left: 0, right: 0, paddingHorizontal: 30 },
    btnAction: { height: 58, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4 },
    btnText: { fontSize: 16, fontFamily: 'PJS-ExtraBold', color: '#FFF' },
});