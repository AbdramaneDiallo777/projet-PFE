import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { userAvatarSource, userDisplayName, userRoleLabel } from '@/lib/userDisplay';
import { fetchMyOrders, type ApiOrder } from '@/lib/agroconnectApi';
import { useRouter } from 'expo-router';
import {
    ArrowRight,
    Bell,
    CheckCircle2,
    Compass,
    Filter,
    Package,
    Search,
    Settings,
    ShieldCheck,
    Star,
    Truck,
    User
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Image,
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

const MAX_WIDTH = 480;
const GREEN_DEEP = '#065F46'; // Vert forêt signature
const GREEN_LIGHT = '#065F46'; // Vert émeraude focus

const SERVICES_LOGISTIQUE = [
    { id: '1', nom: "AgroTrans Inc.", note: "4.8", prix: "50.000", badges: ['Frigo', 'Assuré'], image: require('../../assets/images/logo1.jpg') },
    { id: '2', nom: "Sahara Logistics", note: "4.5", prix: "20.000", badges: ['Vérifié'], image: require('../../assets/images/logo2.jpg') },
    { id: '3', nom: "Express Agro", note: "4.8", prix: "55.000", badges: ['Frigo', 'IA Tracking'], image: require('../../assets/images/logo3.jpg') },
];

export default function AppTransportModerne() {
    const router = useRouter();
    const { token, user, isReady } = useAuth();
    const [activeTab, setActiveTab] = useState('explore'); 
    const [searchFocus, setSearchFocus] = useState(false);
    const [myOrders, setMyOrders] = useState<ApiOrder[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    useEffect(() => {
        if (activeTab !== 'track' || !token) {
            if (!token) setMyOrders([]);
            return;
        }
        let cancel = false;
        setOrdersLoading(true);
        fetchMyOrders(token)
            .then((o) => {
                if (!cancel) setMyOrders(o);
            })
            .catch(() => {
                if (!cancel) setMyOrders([]);
            })
            .finally(() => {
                if (!cancel) setOrdersLoading(false);
            });
        return () => {
            cancel = true;
        };
    }, [activeTab, token]);

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    if (!fontsLoaded) return null;

    // --- CONTENU EXPLORE ---
    const renderExplore = () => (
        <View>
            <View style={styles.searchContainer}>
                <View style={[styles.searchBox, searchFocus && styles.searchBoxActive]}>
                    <Search size={20} color={searchFocus ? GREEN_DEEP : "#94A3B8"} />
                    <TextInput 
                        style={styles.input}
                        placeholder="Destination, transporteur..."
                        placeholderTextColor="#94A3B8"
                        onFocus={() => setSearchFocus(true)}
                        onBlur={() => setSearchFocus(false)}
                    />
                    <TouchableOpacity style={styles.filterIconButton}>
                        <Filter size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.grid}>
                {SERVICES_LOGISTIQUE.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.9} onPress={() => router.push('/marche/service')}>
                        <View style={styles.cardHeader}>
                            <View style={styles.logoContainer}><Image source={item.image} style={styles.logo} /></View>
                            <View style={styles.cardMainInfo}>
                                <Text style={styles.cardName}>{item.nom}</Text>
                                <View style={styles.statsRow}>
                                    <View style={styles.ratingTag}>
                                        <Star size={12} color={GREEN_LIGHT} fill={GREEN_LIGHT} />
                                        <Text style={styles.ratingText}>{item.note}</Text>
                                    </View>
                                    <Text style={styles.moyensText}>• {item.badges[0]}</Text>
                                </View>
                            </View>
                            <View style={styles.priceContainer}>
                                <Text style={styles.priceLabel}>À PARTIR DE</Text>
                                <Text style={styles.priceValue}>{item.prix} F</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // --- CONTENU TRACKING ---
    const renderTracking = () => (
        <View style={styles.pagePadding}>
            <Text style={styles.sectionTitle}>Mes commandes</Text>
            {!token ? (
                <Text style={{ fontFamily: 'PJS-Regular', color: '#64748B', marginBottom: 16 }}>
                    Connectez-vous pour afficher vos achats issus de la marketplace.
                </Text>
            ) : ordersLoading ? (
                <Text style={{ fontFamily: 'PJS-Regular', color: '#64748B' }}>Chargement…</Text>
            ) : myOrders.length === 0 ? (
                <Text style={{ fontFamily: 'PJS-Regular', color: '#64748B' }}>Aucune commande pour l’instant.</Text>
            ) : (
                myOrders.map((o) => (
                    <View key={o.id} style={[styles.trackingCard, { marginBottom: 16 }]}>
                        <View style={styles.trackingHeader}>
                            <View style={styles.packageIconBox}><Package color={GREEN_DEEP} size={24} /></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.trackingId}>COMMANDE #{o.id}</Text>
                                <Text style={styles.trackingStatus}>
                                    {o.product?.name ?? `Produit #${o.product_id}`} · {o.status}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'PJS-SemiBold', marginTop: 4 }}>
                                    Qté {o.quantity_ordered} · Total {o.total_price}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.timeline}>
                            <TimelineStep label="Confirmée" sub={String(o.created_at).slice(0, 16)} completed />
                            <TimelineStep label="Logistique" sub="À planifier" active />
                            <TimelineStep label="Livraison" sub="—" last />
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    // --- CONTENU PROFIL ---
    const renderProfile = () => (
        <View style={styles.pagePadding}>
            <View style={styles.profileHero}>
                <View style={styles.largeAvatarContainer}>
                    <Image source={userAvatarSource(user)} style={styles.largeAvatar} />
                    <View style={styles.editBadge}><Settings size={14} color="#FFF" /></View>
                </View>
                <Text style={styles.userName}>
                    {isReady ? userDisplayName(user, '—') : '…'}
                </Text>
                <View style={styles.premiumBadge}>
                    <CheckCircle2 size={12} color="white" />
                    <Text style={styles.userRole}>{isReady && user ? userRoleLabel(user).toUpperCase() : '…'}</Text>
                </View>
            </View>
            <View style={styles.menuGroup}>
                <MenuOption icon={Bell} label="Notifications" />
                <MenuOption icon={ShieldCheck} label="Sécurité & Paiement" isLast />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.maxWidthWrapper}>
                
                {/* --- HEADER --- */}
                <View style={styles.headerContainer}>
                    <BlurView intensity={90} tint="light" style={styles.headerBlur}>
                        <SafeAreaView>
                            <View style={styles.header}>
                                <View style={styles.headerTitleContainer}>
                                    <Text style={styles.headerSubtitle}>
                                        {activeTab === 'explore' ? 'AGRO • LOGISTIQUE' : activeTab.toUpperCase()}
                                    </Text>
                                    <Text style={styles.headerTitle}>
                                        {activeTab === 'explore' ? 'Transport' : activeTab === 'track' ? 'Suivi Colis' : 'Mon Profil'}
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.profileWrapper} onPress={() => setActiveTab('profile')}>
                                    <Image source={userAvatarSource(user)} style={styles.avatarImg} />
                                </TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    </BlurView>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />
                    {activeTab === 'explore' && renderExplore()}
                    {activeTab === 'track' && renderTracking()}
                    {activeTab === 'profile' && renderProfile()}
                    <View style={{ height: 140 }} />
                </ScrollView>

                {/* --- BOTTOM TAB BAR --- */}
                <BlurView intensity={100} tint="light" style={styles.tabBar}>
                    <View style={styles.tabInner}>
                        <TabItem icon={Compass} label="Explorer" active={activeTab === 'explore'} onPress={() => setActiveTab('explore')} />
                        <TabItem icon={Package} label="Suivi" active={activeTab === 'track'} onPress={() => setActiveTab('track')} />
                        <TabItem icon={User} label="Profil" active={activeTab === 'profile'} onPress={() => setActiveTab('profile')} />
                    </View>
                </BlurView>

                {/* --- FAB NOUVELLE EXPÉDITION --- */}
                {activeTab === 'explore' && (
                    <View style={styles.fabWrapper}>
                        <TouchableOpacity style={styles.fabTouch} activeOpacity={0.9} onPress={() => router.push('/expedition')}>
                            <Text style={styles.fabText}>Nouvelle Expédition</Text>
                            <LinearGradient colors={[GREEN_LIGHT, GREEN_DEEP]} style={styles.fabIconBox}>
                                <Truck size={20} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

// --- SOUS-COMPOSANTS ---
const TabItem = ({ icon: Icon, label, active, onPress }: any) => (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
        <Icon size={24} color={active ? GREEN_DEEP : "#94A3B8"} strokeWidth={active ? 2.5 : 2} />
        <Text style={[styles.tabLabel, active && { color: GREEN_DEEP, fontFamily: 'PJS-Bold' }]}>{label}</Text>
    </TouchableOpacity>
);

const TimelineStep = ({ label, sub, active, completed, last }: any) => (
    <View style={[styles.timelineItem, last && { height: 40 }]}>
        <View style={styles.timelineIndicator}>
            <View style={[styles.dot, (active || completed) && { backgroundColor: GREEN_LIGHT }]} />
            {!last && <View style={[styles.line, completed && { backgroundColor: GREEN_LIGHT }]} />}
        </View>
        <View style={styles.timelineContent}>
            <Text style={[styles.timelineLabel, active && { color: GREEN_DEEP, fontFamily: 'PJS-Bold' }]}>{label}</Text>
            <Text style={styles.timelineSub}>{sub}</Text>
        </View>
    </View>
);

const MenuOption = ({ icon: Icon, label, isLast }: any) => (
    <TouchableOpacity style={[styles.menuItem, !isLast && { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}>
        <View style={styles.menuIconBg}><Icon size={20} color={GREEN_DEEP} /></View>
        <Text style={styles.menuText}>{label}</Text>
        <ArrowRight size={16} color="#CBD5E1" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center' },
    maxWidthWrapper: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, backgroundColor: '#FFFFFF' },
    headerContainer: { position: 'absolute', top: 0, width: '100%', zIndex: 100 },
    headerBlur: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 15, paddingTop: Platform.OS === 'android' ? 45 : 15 },
    headerTitleContainer: { flex: 1 },
    headerSubtitle: { fontSize: 10, fontFamily: 'PJS-ExtraBold', color: GREEN_LIGHT, letterSpacing: 1.5 },
    headerTitle: { fontSize: 24, fontFamily: 'PJS-ExtraBold', color: '#0F172A', marginTop: 2 },
    profileWrapper: { width: 44, height: 44, borderRadius: 30, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    scrollContent: { paddingHorizontal: 24 },
    
    searchContainer: { marginVertical: 20 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 20, paddingHorizontal: 16, height: 64, borderWidth: 1, borderColor: '#F1F5F9' },
    searchBoxActive: { borderColor: GREEN_LIGHT, backgroundColor: '#FFF' },
    input: { flex: 1, marginLeft: 12, fontSize: 15, fontFamily: 'PJS-SemiBold', color: '#0F172A' },
    filterIconButton: { backgroundColor: GREEN_DEEP, width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

    grid: { gap: 16 },
    card: { backgroundColor: '#FFF', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    logoContainer: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F8FAFC', overflow: 'hidden' },
    logo: { width: '100%', height: '100%' },
    cardMainInfo: { flex: 1, marginLeft: 16 },
    cardName: { fontSize: 16, fontFamily: 'PJS-Bold', color: '#0F172A' },
    statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    ratingTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingText: { fontSize: 12, fontFamily: 'PJS-ExtraBold', color: GREEN_DEEP, marginLeft: 4 },
    moyensText: { fontSize: 12, color: '#94A3B8', marginLeft: 8, fontFamily: 'PJS-SemiBold' },
    priceContainer: { alignItems: 'flex-end' },
    priceLabel: { fontSize: 8, fontFamily: 'PJS-ExtraBold', color: '#94A3B8' },
    priceValue: { fontSize: 17, fontFamily: 'PJS-ExtraBold', color: GREEN_DEEP },

    pagePadding: { paddingTop: 10 },
    sectionTitle: { fontSize: 20, fontFamily: 'PJS-ExtraBold', color: '#0F172A', marginBottom: 20 },
    
    trackingCard: { backgroundColor: '#FFF', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#F1F5F9' },
    trackingHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 30 },
    packageIconBox: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
    trackingId: { fontSize: 10, color: '#94A3B8', fontFamily: 'PJS-ExtraBold', letterSpacing: 1 },
    trackingStatus: { fontSize: 17, color: '#0F172A', fontFamily: 'PJS-Bold' },
    timeline: { paddingLeft: 10 },
    timelineItem: { flexDirection: 'row', gap: 20, height: 70 },
    timelineIndicator: { alignItems: 'center', width: 20 },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E2E8F0', zIndex: 2 },
    line: { width: 2, flex: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },
    timelineContent: { flex: 1, marginTop: -2 },
    timelineLabel: { fontSize: 15, fontFamily: 'PJS-SemiBold', color: '#94A3B8' },
    timelineSub: { fontSize: 12, color: '#94A3B8', fontFamily: 'PJS-Regular', marginTop: 2 },

    profileHero: { alignItems: 'center', marginBottom: 30 },
    largeAvatarContainer: { position: 'relative' },
    largeAvatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#FFF' },
    editBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: GREEN_LIGHT, width: 32, height: 32, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFF' },
    userName: { fontSize: 24, fontFamily: 'PJS-ExtraBold', color: '#0F172A', marginTop: 15 },
    premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN_DEEP, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginTop: 8 },
    userRole: { fontSize: 10, color: '#FFF', fontFamily: 'PJS-ExtraBold', letterSpacing: 1 },
    menuGroup: { backgroundColor: '#FFF', borderRadius: 28, padding: 10, borderWidth: 1, borderColor: '#F1F5F9' },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 15 },
    menuIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    menuText: { flex: 1, fontSize: 15, fontFamily: 'PJS-SemiBold', color: '#1E293B' },

    tabBar: { position: 'absolute', bottom: 0, width: '100%', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    tabInner: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 15, paddingBottom: Platform.OS === 'ios' ? 35 : 20 },
    tabItem: { alignItems: 'center', gap: 5 },
    tabLabel: { fontSize: 10, fontFamily: 'PJS-SemiBold', color: '#94A3B8' },

    fabWrapper: { position: 'absolute', bottom: 105, left: 24, right: 24 },
    fabTouch: { 
        backgroundColor: '#0F172A', borderRadius: 24, flexDirection: 'row', 
        alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, 
        height: 68, elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 
    },
    fabText: { color: '#FFF', fontSize: 16, fontFamily: 'PJS-Bold' },
    fabIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }
});