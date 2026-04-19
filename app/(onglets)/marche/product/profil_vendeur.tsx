import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

// Import de la police Plus Jakarta Sans (utilisée dans votre projet)
import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';

const MAX_WIDTH = 500;

export default function ProducerProfileScreen() {
    const router = useRouter();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const CONTAINER_WIDTH = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;

    // THÈME CLAIR AGROCONNECT
    const COLORS = {
        primary: '#065F46',
        accent: '#10B981',
        bg: '#F8FAFC',
        card: '#FFFFFF',
        text: '#0F172A',
        textMuted: '#64748B',
        border: '#F1F5F9',
        gold: '#F59E0B'
    };

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    if (!fontsLoaded) return null;

    return (
        <View style={[styles.outerContainer, { backgroundColor: '#EDF2F7' }]}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: COLORS.bg }]}>
                
                {/* --- HEADER --- */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profil Producteur</Text>
                    <TouchableOpacity style={styles.backBtn}>
                        <Feather name="more-vertical" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    
                    {/* --- PROFIL CARD --- */}
                    <View style={styles.profileHero}>
                        <View style={styles.avatarWrapper}>
                            <Image 
                                source={{ uri: 'https://images.pexels.com/photos/2169434/pexels-photo-2169434.jpeg' }} 
                                style={styles.avatar} 
                            />
                            <View style={styles.verifiedBadge}>
                                <MaterialCommunityIcons name="check-decagram" size={20} color="white" />
                            </View>
                        </View>
                        
                        <Text style={styles.producerName}>Koffi Mensah</Text>
                        <Text style={styles.locationText}>
                            <Ionicons name="location-outline" size={14} color={COLORS.primary} /> Kiambu, Kenya
                        </Text>

                        <View style={styles.statsContainer}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>4.9</Text>
                                <Text style={styles.statLabel}>Note</Text>
                            </View>
                            <View style={[styles.statBox, styles.statBorder]}>
                                <Text style={styles.statValue}>12+</Text>
                                <Text style={styles.statLabel}>Années Exp.</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>128</Text>
                                <Text style={styles.statLabel}>Ventes</Text>
                            </View>
                        </View>
                    </View>

                    {/* --- ABOUT SECTION --- */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>À propos</Text>
                        <Text style={styles.aboutText}>
                            Producteur passionné spécialisé dans l'agriculture biologique. Je cultive mes terres avec des méthodes durables pour garantir des produits frais et de haute qualité à mes clients.
                        </Text>
                    </View>

                    {/* --- PARCELLE / CHAMP SECTION --- */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Son Exploitation</Text>
                            <TouchableOpacity><Text style={styles.seeAll}>Voir Plan</Text></TouchableOpacity>
                        </View>
                        <View style={styles.landCard}>
                            <Image 
                                source={require('../../../../assets/images/parcel1.jpg')} 
                                style={styles.landImage} 
                            />
                            <LinearGradient 
                                colors={['transparent', 'rgba(0,0,0,0.7)']} 
                                style={styles.landOverlay}
                            >
                                <View>
                                    <Text style={styles.landName}>Ferme de la Vallée Verte</Text>
                                    <Text style={styles.landSize}>15.4 Hectares • Irrigué</Text>
                                </View>
                                <View style={styles.landTag}>
                                    <Text style={styles.landTagText}>BIO</Text>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>

                    {/* --- ACTIVITÉS & CULTURES --- */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cultures actuelles</Text>
                        <View style={styles.cultureGrid}>
                            <CultureItem icon="leaf" name="Avocats" count="500 arbres" color="#156f51" />
                            <CultureItem icon="fruit-grapes" name="Papaye" count="2.5 Ha" color="#F59E0B" />
                            <CultureItem icon="corn" name="Maïs" count="8 Ha" color="#EAB308" />
                        </View>
                    </View>

                    {/* --- ACTION BUTTONS --- */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.chatBtn}>
                            <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.chatBtnText}>Contacter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.followBtn}>
                            <LinearGradient colors={[COLORS.accent, COLORS.primary]} style={styles.gradientBtn}>
                                <Text style={styles.followBtnText}>Suivre</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </View>
        </View>
    );
}

const CultureItem = ({ icon, name, count, color }: any) => (
    <View style={styles.cultureCard}>
        <View style={[styles.cultureIcon, { backgroundColor: color + '15' }]}>
            <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.cultureName}>{name}</Text>
        <Text style={styles.cultureCount}>{count}</Text>
    </View>
);

const styles = StyleSheet.create({
    outerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    innerContainer: { flex: 1, overflow: 'hidden' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    headerTitle: { fontSize: 18, fontFamily: 'PJS-Bold' },
    backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
    
    profileHero: { alignItems: 'center', marginTop: 10, paddingHorizontal: 20 },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: 'white' },
    verifiedBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#065F46', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
    producerName: { fontSize: 24, fontFamily: 'PJS-ExtraBold', marginTop: 15, color: '#0F172A' },
    locationText: { fontSize: 14, fontFamily: 'PJS-Medium', color: '#64748B', marginTop: 4 },
    
    statsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginTop: 25, borderRadius: 24, paddingVertical: 20, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    statBox: { flex: 1, alignItems: 'center' },
    statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F1F5F9' },
    statValue: { fontSize: 18, fontFamily: 'PJS-Bold', color: '#0F172A' },
    statLabel: { fontSize: 12, fontFamily: 'PJS-Medium', color: '#64748B', marginTop: 2 },

    section: { marginTop: 35, paddingHorizontal: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontFamily: 'PJS-ExtraBold', color: '#0F172A', marginBottom: 15 },
    seeAll: { fontSize: 14, fontFamily: 'PJS-Bold', color: '#065F46' },
    aboutText: { fontSize: 14, fontFamily: 'PJS-Regular', color: '#475569', lineHeight: 22 },

    landCard: { width: '100%', height: 180, borderRadius: 28, overflow: 'hidden', elevation: 5 },
    landImage: { width: '100%', height: '100%' },
    landOverlay: { ...StyleSheet.absoluteFillObject, padding: 20, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end' },
    landName: { color: 'white', fontSize: 16, fontFamily: 'PJS-Bold' },
    landSize: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'PJS-Medium' },
    landTag: { backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, position: 'absolute', top: 15, right: 15 },
    landTagText: { color: 'white', fontSize: 10, fontFamily: 'PJS-ExtraBold' },

    cultureGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    cultureCard: { width: '30%', backgroundColor: 'white', padding: 12, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    cultureIcon: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    cultureName: { fontSize: 13, fontFamily: 'PJS-Bold', color: '#0F172A' },
    cultureCount: { fontSize: 10, fontFamily: 'PJS-Medium', color: '#64748B', marginTop: 2 },

    actionRow: { flexDirection: 'row', paddingHorizontal: 25, marginTop: 40, gap: 15 },
    chatBtn: { flex: 1, height: 56, borderRadius: 18, borderWidth: 2, borderColor: '#065F46', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    chatBtnText: { color: '#065F46', fontFamily: 'PJS-Bold', fontSize: 16 },
    followBtn: { flex: 1.2, height: 56, borderRadius: 18, overflow: 'hidden', elevation: 4 },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    followBtnText: { color: 'white', fontFamily: 'PJS-Bold', fontSize: 16 }
});