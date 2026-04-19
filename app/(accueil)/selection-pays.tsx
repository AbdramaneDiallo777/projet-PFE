import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_WIDTH = 500;

const COUNTRIES = [
    { id: 'dz', name: 'Algérie', region: 'Afrique du Nord', flag: 'https://flagcdn.com/w160/dz.png' },
    { id: 'ao', name: 'Angola', region: 'Afrique Centrale', flag: 'https://flagcdn.com/w160/ao.png' },
    { id: 'bj', name: 'Bénin', region: 'Afrique de l\'Ouest', flag: 'https://flagcdn.com/w160/bj.png' },
    { id: 'bw', name: 'Botswana', region: 'Afrique Australe', flag: 'https://flagcdn.com/w160/bw.png' },
    { id: 'bf', name: 'Burkina Faso', region: 'Afrique de l\'Ouest', flag: 'https://flagcdn.com/w160/bf.png' },
    { id: 'bi', name: 'Burundi', region: 'Afrique Centrale', flag: 'https://flagcdn.com/w160/bi.png' },
    { id: 'cm', name: 'Cameroun', region: 'Afrique Centrale', flag: 'https://flagcdn.com/w160/cm.png' },
    { id: 'ci', name: 'Côte d’Ivoire', region: 'Afrique de l\'Ouest', flag: 'https://flagcdn.com/w160/ci.png' },
    { id: 'ml', name: 'Mali', region: 'Afrique de l\'Ouest', flag: 'https://flagcdn.com/w160/ml.png' },
    { id: 'sn', name: 'Sénégal', region: 'Afrique de l\'Ouest', flag: 'https://flagcdn.com/w160/sn.png' },
];

export default function SelectionPays() {
    const router = useRouter();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [selectedId, setSelectedId] = useState('sn');
    const [search, setSearch] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const CONTAINER_WIDTH = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    // VERT FONCÉ DÉGRADÉ PREMIUM
    const GREEN_GRADIENT = ['#059669', '#064E3B']; 

    // THEME FIXE (MODE CLAIR UNIQUEMENT)
    const COLORS = {
        primary: '#064E3B',
        accent: '#059669',
        background: '#FFFFFF',
        card: '#F8FAFC',
        text: '#0F172A',
        textMuted: '#64748B',
        border: '#F1F5F9',
        outerBg: '#F8FAFC',
    };

    if (!fontsLoaded) return null;

    const scrollBottomPad = Math.max(insets.bottom, 12) + 100;

    return (
        <View style={[styles.outerContainer, { backgroundColor: COLORS.outerBg }]}>
            <StatusBar barStyle="dark-content" />
            <View
                style={[
                    styles.innerContainer,
                    { width: CONTAINER_WIDTH, maxWidth: MAX_WIDTH, backgroundColor: COLORS.background },
                ]}
            >
                <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                    {/* Header avec Barre de Progression Dégradée */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
                            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        
                        <View style={styles.progressWrapper}>
                            <View style={[styles.progressBarBg, { backgroundColor: '#E2E8F0' }]}>
                                <LinearGradient 
                                    colors={GREEN_GRADIENT}
                                    start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                                    style={[styles.progressBarFill, { width: '100%' }]} 
                                />
                            </View>
                            <Text style={[styles.stepText, { color: COLORS.textMuted }]}>Étape 2 sur 2</Text>
                        </View>
                        <View style={{ width: 44 }} />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.hero}>
                            <Text style={[styles.mainTitle, { color: COLORS.text }]}>
                                Dans quel pays{"\n"}
                                <Text style={{ color: COLORS.accent }}>cultivez-vous ?</Text>
                            </Text>
                            <Text style={[styles.subtitle, { color: COLORS.textMuted }]}>
                                Sélectionnez votre pays pour des analyses sur mesure.
                            </Text>
                        </View>

                        {/* Barre de recherche */}
                        <View style={[
                            styles.searchWrapper, 
                            { backgroundColor: COLORS.card, borderColor: isFocused ? COLORS.accent : COLORS.border }
                        ]}>
                            <Ionicons name="search-outline" size={20} color={isFocused ? COLORS.accent : COLORS.textMuted} />
                            <TextInput 
                                placeholder="Rechercher un pays..." 
                                style={[styles.input, { color: COLORS.text }]}
                                value={search}
                                onChangeText={setSearch}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>

                        {/* Liste des pays */}
                        <View style={styles.countryList}>
                            {COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map((country) => {
                                const isActive = selectedId === country.id;
                                return (
                                    <TouchableOpacity 
                                        key={country.id}
                                        onPress={() => setSelectedId(country.id)}
                                        style={[
                                            styles.countryRow, 
                                            { backgroundColor: COLORS.card, borderColor: isActive ? COLORS.accent : 'transparent' },
                                            isActive && { backgroundColor: '#F0FDF4' }
                                        ]}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.flagContainer}>
                                            <Image source={{ uri: country.flag }} style={styles.flagImg} />
                                        </View>
                                        <View style={styles.countryInfo}>
                                            <Text style={[styles.countryName, { color: COLORS.text }]}>{country.name}</Text>
                                            <Text style={[styles.countryRegion, { color: COLORS.textMuted }]}>{country.region}</Text>
                                        </View>
                                        
                                        {isActive ? (
                                            <LinearGradient colors={GREEN_GRADIENT} style={styles.radioActive}>
                                                <Ionicons name="checkmark" size={14} color="#FFF" />
                                            </LinearGradient>
                                        ) : (
                                            <View style={[styles.radioOuter, { borderColor: '#CBD5E1' }]} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    {/* Footer - Bouton Dégradé */}
                    <View
                        style={[
                            styles.footer,
                            { paddingBottom: Math.max(insets.bottom, 12), bottom: 0 },
                        ]}
                    >
                        <TouchableOpacity 
                            onPress={() => router.push('/(authentification)')} 
                            activeOpacity={0.8}
                        >
                            <LinearGradient 
                                colors={GREEN_GRADIENT}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={styles.continueButton}
                            >
                                <Text style={styles.buttonText}>Finaliser la configuration</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, alignItems: 'center', width: '100%' },
    innerContainer: { flex: 1, alignSelf: 'center', overflow: 'hidden' },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    progressWrapper: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
    progressBarBg: { height: 6, width: 80, borderRadius: 10, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 10 },
    stepText: { fontSize: 10, fontFamily: 'PJS-ExtraBold', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },

    scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
    hero: { marginBottom: 20 },
    mainTitle: { fontSize: 26, fontFamily: 'PJS-ExtraBold', lineHeight: 32 },
    subtitle: { fontSize: 14, fontFamily: 'PJS-Regular', marginTop: 10, lineHeight: 22 },
    
    searchWrapper: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderRadius: 16, 
        paddingHorizontal: 16, 
        height: 56, 
        borderWidth: 1.5, 
        marginBottom: 20 
    },
    input: { flex: 1, marginLeft: 12, fontSize: 15, fontFamily: 'PJS-SemiBold' },
    
    countryList: { gap: 10 },
    countryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent'
    },
    flagContainer: { width: 44, height: 30, borderRadius: 6, overflow: 'hidden', backgroundColor: '#eee' },
    flagImg: { width: '100%', height: '100%' },
    countryInfo: { flex: 1, marginLeft: 12, minWidth: 0 },
    countryName: { fontSize: 15, fontFamily: 'PJS-Bold', flexShrink: 1 },
    countryRegion: { fontSize: 11, fontFamily: 'PJS-SemiBold', marginTop: 2, flexShrink: 1 },
    
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
    radioActive: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },

    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    continueButton: {
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    buttonText: { fontSize: 16, fontFamily: 'PJS-ExtraBold', color: '#FFF' },
});