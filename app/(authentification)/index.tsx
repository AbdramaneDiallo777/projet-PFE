import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    ImageBackground,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

const MAX_WIDTH = 480;
const GREEN_DEEP = '#065F46'; 

export default function AuthWelcome() {
    const router = useRouter();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const IS_DESKTOP = SCREEN_WIDTH > MAX_WIDTH;

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    if (!fontsLoaded) return null;

    return (
        <View style={styles.outerContainer}>
            <View style={[styles.appContainer, { width: IS_DESKTOP ? MAX_WIDTH : '100%' }]}>
                <StatusBar barStyle="light-content" />
                
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <ImageBackground 
                        source={require('../../assets/images/M1.jpg')} 
                        style={styles.heroImage}
                        resizeMode="cover"
                    >
                        <View style={styles.overlay} />
                        <View style={[styles.floatingIcon, { top: 60, right: 30 }]}>
                            <MaterialCommunityIcons name="drone" size={22} color={GREEN_DEEP} />
                        </View>
                    </ImageBackground>
                </View>

                {/* Content Card */}
                <View style={styles.contentCard}>
                    <SafeAreaView style={styles.flex}>
                        <View style={styles.topIndicator} />

                        <View style={styles.mainContent}>
                            <View style={styles.headerText}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>AGRO IA • AFRICA</Text>
                                </View>
                                
                                <Text style={styles.mainTitle}>
                                    Révolutionnons{"\n"}
                                    <Text style={{ color: GREEN_DEEP }}>l'agriculture</Text> ensemble.
                                </Text>
                                
                                <Text style={styles.description}>
                                    Accédez à l'assistant IA, suivez vos sols et trouvez des acheteurs B2B partout sur le continent.
                                </Text>
                            </View>

                            <View style={styles.buttonGroup}>
                                <TouchableOpacity 
                                    style={styles.primaryBtn}
                                    activeOpacity={0.9}
                                    onPress={() => router.push('/inscription')}
                                >
                                    <Text style={styles.primaryBtnText}>Démarrer l'aventure</Text>
                                    <View style={styles.btnCircle}>
                                        <Ionicons name="arrow-forward" size={16} color={GREEN_DEEP} />
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.secondaryBtn}
                                    onPress={() => router.push('/connexion')}
                                >
                                    <Text style={styles.secondaryBtnText}>
                                        Déjà membre ? <Text style={styles.loginLink}>Se connecter</Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.footerFeatures}>
                                <View style={styles.feature}>
                                    <Ionicons name="shield-checkmark" size={14} color="#94A3B8" />
                                    <Text style={styles.featureText}>Sécurisé</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.feature}>
                                    <MaterialCommunityIcons name="brain" size={14} color="#94A3B8" />
                                    <Text style={styles.featureText}>IA Temps Réel</Text>
                                </View>
                            </View>
                        </View>
                    </SafeAreaView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    appContainer: {
        flex: 1,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    heroSection: {
        height: '48%', 
        width: '100%',
    },
    heroImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    floatingIcon: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 10,
        borderRadius: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    contentCard: { 
        flex: 1, 
        backgroundColor: '#FFFFFF', 
        borderTopLeftRadius: 40, 
        borderTopRightRadius: 40, 
        marginTop: -40, 
        paddingTop: 10,
    },
    flex: { flex: 1 },
    mainContent: {
        flex: 1,
        paddingHorizontal: 28,
        paddingBottom: 30,
        justifyContent: 'space-between',
    },
    topIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        alignSelf: 'center',
        marginBottom: 20,
    },
    badge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    badgeText: { color: '#059669', fontFamily: 'PJS-ExtraBold', fontSize: 9, letterSpacing: 1 },
    mainTitle: { fontSize: 28, fontFamily: 'PJS-ExtraBold', color: '#0F172A', lineHeight: 36, letterSpacing: -0.8 },
    description: { fontSize: 14, fontFamily: 'PJS-Regular', color: '#64748B', marginTop: 12, lineHeight: 22 },
    buttonGroup: {
        gap: 12,
        marginTop: 15,
    },
    primaryBtn: { 
        backgroundColor: GREEN_DEEP,
        height: 62, 
        borderRadius: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 22,
        shadowColor: GREEN_DEEP,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    primaryBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'PJS-Bold' },
    btnCircle: {
        width: 34,
        height: 34,
        backgroundColor: '#FFF',
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryBtn: { 
        height: 45, 
        alignItems: 'center', 
        justifyContent: 'center', 
    },
    secondaryBtnText: { color: '#64748B', fontSize: 14, fontFamily: 'PJS-Regular' },
    loginLink: { color: GREEN_DEEP, fontFamily: 'PJS-Bold' },
    footerFeatures: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    divider: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#CBD5E1',
    },
    featureText: {
        fontSize: 10,
        color: '#94A3B8',
        fontFamily: 'PJS-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});