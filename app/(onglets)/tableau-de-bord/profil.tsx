import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    useFonts
} from '@expo-google-fonts/inter';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
    updateUserProfile,
    uploadProfileAvatar,
} from '@/lib/agroconnectApi';
import {
    clearSavedPaymentHints,
    loadSavedPaymentHints,
    type SavedPaymentHints,
} from '@/lib/savedPaymentHints';
import {
    userAvatarSource,
    userDisplayName,
    userLocationAndRole,
} from '@/lib/userDisplay';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

const MAX_WIDTH = 500;

export default function ProfileAgroConnect() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const CONTAINER_WIDTH = useMemo(() => Math.min(SCREEN_WIDTH, MAX_WIDTH), [SCREEN_WIDTH]);
    const router = useRouter();
    const { user, isReady, logout, token, refreshUser } = useAuth();

    // --- ÉTATS POUR LES RÉGLAGES ---
    const [activeModal, setActiveModal] = useState<null | 'paiement' | 'securite' | 'aide'>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [draftPhone, setDraftPhone] = useState('');
    const [draftLocation, setDraftLocation] = useState('');
    const [draftCountry, setDraftCountry] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

    useEffect(() => {
        if (!editOpen || !user) return;
        setDraftName(user.full_name?.trim() ?? '');
        setDraftPhone(user.phone_number?.trim() ?? '');
        setDraftLocation(user.location?.trim() ?? '');
        setDraftCountry(user.country_code?.trim() ?? '');
        setLocalAvatarUri(null);
    }, [editOpen, user]);
    const [notifsEnabled, setNotifsEnabled] = useState(true);
    const [faceIdEnabled, setFaceIdEnabled] = useState(false);
    const [privacyEnabled, setPrivacyEnabled] = useState(true);
    const [paymentHints, setPaymentHints] = useState<SavedPaymentHints | null>(null);
    const [loadingPaymentHints, setLoadingPaymentHints] = useState(false);

    useEffect(() => {
        if (activeModal !== 'paiement') return;
        setLoadingPaymentHints(true);
        void loadSavedPaymentHints()
            .then(setPaymentHints)
            .finally(() => setLoadingPaymentHints(false));
    }, [activeModal]);

    // THÈME CLAIR FIXÉ (Mode sombre désactivé)
    const THEME = {
        primary: '#0c704f',
        primaryDark: '#059669',
        bg: '#F8FAFC',
        card: '#FFFFFF',
        text: '#020617',
        muted: '#475569',
        border: 'rgba(0,0,0,0.05)',
        accentGold: '#F59E0B',
    };

    let [fontsLoaded] = useFonts({
        'Inter-Reg': Inter_400Regular,
        'Inter-Med': Inter_500Medium,
        'Inter-Semi': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
    });

    const font = (f: string) => fontsLoaded ? f : 'System';

    const pickAvatar = useCallback(async () => {
        if (!token || token === 'dev-token') {
            Alert.alert('Photo', 'Connectez-vous avec un compte réel pour envoyer une photo.');
            return;
        }
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Permission', 'Autorisez l’accès aux photos pour changer l’avatar.');
            return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });
        if (res.canceled || !res.assets[0]) return;
        setLocalAvatarUri(res.assets[0].uri);
    }, [token]);

    const saveProfile = useCallback(async () => {
        if (!token || token === 'dev-token') {
            Alert.alert('Profil', 'Connexion requise pour enregistrer.');
            return;
        }
        setSavingProfile(true);
        try {
            let imageUrl: string | undefined;
            if (localAvatarUri) {
                imageUrl = await uploadProfileAvatar(token, localAvatarUri);
            }
            await updateUserProfile(token, {
                full_name: draftName.trim() || undefined,
                phone_number: draftPhone.trim() || undefined,
                location: draftLocation.trim() || undefined,
                country_code: draftCountry.trim() || undefined,
                ...(imageUrl ? { image_url: imageUrl } : {}),
            });
            await refreshUser();
            setEditOpen(false);
            setLocalAvatarUri(null);
        } catch (e) {
            Alert.alert('Profil', e instanceof Error ? e.message : String(e));
        } finally {
            setSavingProfile(false);
        }
    }, [
        token,
        localAvatarUri,
        draftName,
        draftPhone,
        draftLocation,
        draftCountry,
        refreshUser,
    ]);

    const confirmClearPaymentHints = useCallback(() => {
        Alert.alert(
            'Méthode enregistrée',
            'Supprimer le titulaire et les 4 derniers chiffres mémorisés sur cet appareil ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        void clearSavedPaymentHints().then(() => setPaymentHints(null));
                    },
                },
            ]
        );
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "Déconnexion", 
            "Souhaitez-vous vraiment vous déconnecter ?", 
            [
                { text: "Annuler", style: "cancel" },
                { 
                    text: "Se déconnecter", 
                    style: "destructive", 
                    onPress: async () => {
                        await logout();
                        router.replace('/');
                    }
                }
            ]
        );
    };

    // Ne bloque pas l'écran si la police custom tarde à charger via tunnel.

    const SettingOption = ({ label, value, onValueChange, type = 'switch', icon, color }: any) => (
        <View style={[styles.settingRow, { borderBottomColor: THEME.border }]}>
            <View style={styles.settingLabelGroup}>
                <View style={[styles.settingIconBox, {backgroundColor: '#F1F5F9'}]}>
                    <Ionicons name={icon} size={18} color={color || THEME.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: color || THEME.text, fontFamily: font('Inter-Med') }]}>{label}</Text>
            </View>
            {type === 'switch' ? (
                <Switch 
                    value={value} 
                    onValueChange={onValueChange} 
                    trackColor={{ false: '#CBD5E1', true: THEME.primary }} 
                />
            ) : (
                <Ionicons name="chevron-forward" size={18} color={THEME.muted} />
            )}
        </View>
    );

    const avatarDisplay = useMemo(() => {
        if (localAvatarUri) return { uri: localAvatarUri } as const;
        return userAvatarSource(user);
    }, [localAvatarUri, user]);

    return (
        <View style={[styles.outerContainer, { backgroundColor: THEME.bg }]}>
            <StatusBar barStyle="dark-content" />

            <Modal
                animationType="slide"
                transparent
                visible={editOpen}
                onRequestClose={() => !savingProfile && setEditOpen(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={[styles.editSheet, { backgroundColor: THEME.bg, width: Math.min(CONTAINER_WIDTH, SCREEN_WIDTH) }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: THEME.border }]}>
                            <Text style={[styles.modalTitle, { color: THEME.text, fontFamily: font('Inter-Bold') }]}>
                                Modifier le profil
                            </Text>
                            <TouchableOpacity onPress={() => !savingProfile && setEditOpen(false)} disabled={savingProfile}>
                                <Ionicons name="close-circle" size={32} color={THEME.muted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: 28 }}
                            showsVerticalScrollIndicator={false}
                        >
                            <TouchableOpacity style={styles.avatarEditRow} onPress={pickAvatar} disabled={savingProfile}>
                                <Image source={avatarDisplay} style={styles.avatarEditImg} />
                                <Text style={[styles.avatarEditHint, { color: THEME.primary, fontFamily: font('Inter-Bold') }]}>
                                    Changer la photo
                                </Text>
                            </TouchableOpacity>
                            <Text style={[styles.fieldLabel, { color: THEME.muted }]}>Nom complet</Text>
                            <TextInput
                                style={[styles.fieldInput, { color: THEME.text, borderColor: THEME.border, backgroundColor: THEME.card }]}
                                value={draftName}
                                onChangeText={setDraftName}
                                placeholder="Votre nom"
                                placeholderTextColor={THEME.muted}
                            />
                            <Text style={[styles.fieldLabel, { color: THEME.muted }]}>Téléphone</Text>
                            <TextInput
                                style={[styles.fieldInput, { color: THEME.text, borderColor: THEME.border, backgroundColor: THEME.card }]}
                                value={draftPhone}
                                onChangeText={setDraftPhone}
                                placeholder="+33 …"
                                placeholderTextColor={THEME.muted}
                                keyboardType="phone-pad"
                            />
                            <Text style={[styles.fieldLabel, { color: THEME.muted }]}>Lieu / région</Text>
                            <TextInput
                                style={[styles.fieldInput, { color: THEME.text, borderColor: THEME.border, backgroundColor: THEME.card }]}
                                value={draftLocation}
                                onChangeText={setDraftLocation}
                                placeholder="Ville, pays"
                                placeholderTextColor={THEME.muted}
                            />
                            <Text style={[styles.fieldLabel, { color: THEME.muted }]}>Code pays (ex. CI, FR)</Text>
                            <TextInput
                                style={[styles.fieldInput, { color: THEME.text, borderColor: THEME.border, backgroundColor: THEME.card }]}
                                value={draftCountry}
                                onChangeText={setDraftCountry}
                                placeholder="CI"
                                placeholderTextColor={THEME.muted}
                                autoCapitalize="characters"
                                maxLength={8}
                            />
                            <Text style={[styles.fieldHint, { color: THEME.muted, fontFamily: font('Inter-Reg') }]}>
                                Carte bancaire : utilisez « Méthodes de paiement » ci-dessous (UI).
                            </Text>
                            <TouchableOpacity
                                style={[styles.saveProfileBtn, { backgroundColor: THEME.primary, opacity: savingProfile ? 0.7 : 1 }]}
                                onPress={() => void saveProfile()}
                                disabled={savingProfile}
                            >
                                {savingProfile ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveProfileBtnText}>Enregistrer</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* --- MODAL (Paiement, Sécurité, Aide) --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={activeModal !== null}
                onRequestClose={() => setActiveModal(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: THEME.bg, width: Math.min(CONTAINER_WIDTH, SCREEN_WIDTH) }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: THEME.border }]}>
                            <Text style={[styles.modalTitle, { color: THEME.text, fontFamily: font('Inter-Bold') }]}>
                                {activeModal === 'paiement' && "Paiements"}
                                {activeModal === 'securite' && "Sécurité & Appareil"}
                                {activeModal === 'aide' && "Aide & Support"}
                            </Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)}>
                                <Ionicons name="close-circle" size={32} color={THEME.muted} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {activeModal === 'paiement' && (
                                <View style={{ width: '100%' }}>
                                    <Text
                                        style={[
                                            styles.paymentExplain,
                                            { color: THEME.muted, fontFamily: font('Inter-Reg') },
                                        ]}
                                    >
                                        Le numéro complet de carte n’est jamais enregistré. Après un paiement sur le marché, vous pouvez mémoriser le titulaire, les 4 derniers chiffres et la date d’expiration sur cet appareil (SecureStore).
                                    </Text>
                                    {loadingPaymentHints ? (
                                        <ActivityIndicator style={{ marginVertical: 24 }} color={THEME.primary} />
                                    ) : paymentHints &&
                                      (paymentHints.cardLast4.length === 4 ||
                                          paymentHints.cardHolder ||
                                          paymentHints.expiry) ? (
                                        <View
                                            style={[
                                                styles.paymentSavedCard,
                                                { backgroundColor: THEME.card, borderColor: THEME.border },
                                            ]}
                                        >
                                            <View style={styles.paymentSavedLeft}>
                                                <Ionicons name="card-outline" size={28} color={THEME.primary} />
                                                <View style={{ flex: 1, marginLeft: 12 }}>
                                                    <Text
                                                        style={[
                                                            styles.paymentSavedTitle,
                                                            { color: THEME.text, fontFamily: font('Inter-Bold') },
                                                        ]}
                                                    >
                                                        Carte bancaire
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.paymentSavedSub,
                                                            { color: THEME.muted, fontFamily: font('Inter-Med') },
                                                        ]}
                                                    >
                                                        {paymentHints.cardLast4.length === 4
                                                            ? `•••• •••• •••• ${paymentHints.cardLast4}`
                                                            : '•••• •••• •••• ••••'}
                                                    </Text>
                                                    {paymentHints.cardHolder ? (
                                                        <Text
                                                            style={[
                                                                styles.paymentSavedSub,
                                                                { color: THEME.muted, fontFamily: font('Inter-Reg'), marginTop: 4 },
                                                            ]}
                                                            numberOfLines={2}
                                                        >
                                                            {paymentHints.cardHolder}
                                                        </Text>
                                                    ) : null}
                                                    {paymentHints.expiry ? (
                                                        <Text
                                                            style={[
                                                                styles.paymentSavedSub,
                                                                { color: THEME.muted, fontFamily: font('Inter-Reg'), marginTop: 2 },
                                                            ]}
                                                        >
                                                            Exp. {paymentHints.expiry}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                onPress={confirmClearPaymentHints}
                                                style={styles.paymentRemoveBtn}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Ionicons name="trash-outline" size={22} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <Text
                                            style={[
                                                styles.emptyHint,
                                                { color: THEME.muted, fontFamily: font('Inter-Reg') },
                                            ]}
                                        >
                                            Aucune carte mémorisée sur cet appareil.
                                        </Text>
                                    )}
                                    <TouchableOpacity
                                        style={[
                                            styles.paymentAddCard,
                                            { backgroundColor: THEME.card, borderColor: THEME.primary },
                                        ]}
                                        onPress={() => {
                                            setActiveModal(null);
                                            router.push('/marche/panier');
                                        }}
                                    >
                                        <Ionicons name="cart-outline" size={24} color={THEME.primary} />
                                        <Text
                                            style={[
                                                styles.paymentAddText,
                                                { color: THEME.primary, fontFamily: font('Inter-Bold') },
                                            ]}
                                        >
                                            Passer par le panier pour payer
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {activeModal === 'securite' && (
                                <View>
                                    <View style={[styles.settingsGroup, { backgroundColor: THEME.card, borderColor: THEME.border }]}>
                                        <SettingOption icon="notifications-outline" label="Notifications Push" value={notifsEnabled} onValueChange={setNotifsEnabled} />
                                        <SettingOption icon="scan-outline" label="Face ID / Empreinte" value={faceIdEnabled} onValueChange={setFaceIdEnabled} />
                                        <SettingOption icon="eye-off-outline" label="Mode Confidentialité" value={privacyEnabled} onValueChange={setPrivacyEnabled} />
                                        <SettingOption icon="lock-closed-outline" label="Changer le code PIN" type="link" />
                                    </View>
                                    
                                    <TouchableOpacity 
                                        onPress={handleLogout}
                                        style={[styles.logoutRow, { backgroundColor: THEME.card, borderColor: THEME.border }]}
                                    >
                                        <View style={styles.settingLabelGroup}>
                                            <View style={[styles.settingIconBox, { backgroundColor: '#EF444415' }]}>
                                                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                            </View>
                                            <Text style={[styles.settingLabel, { color: '#EF4444', fontFamily: font('Inter-Bold') }]}>Déconnexion</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {activeModal === 'aide' && (
                                <View style={{ gap: 15, width: '100%' }}>
                                    <View style={[styles.infoCard, { backgroundColor: THEME.card, borderColor: THEME.border }]}>
                                        <Ionicons name="help-buoy" size={40} color={THEME.primary} />
                                        <Text style={[styles.infoText, { color: THEME.text, fontFamily: font('Inter-Med') }]}>Support technique AgroConnect Africa</Text>
                                    </View>
                                    <TouchableOpacity style={[styles.supportAction, { backgroundColor: THEME.card }]}>
                                        <Ionicons name="chatbubble-ellipses-outline" size={22} color={THEME.primary} />
                                        <Text style={[styles.supportActionText, { color: THEME.text }]}>Chat en direct</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* --- CONTENU PRINCIPAL --- */}
            <View style={[styles.innerContainer, { width: '100%', maxWidth: CONTAINER_WIDTH }]}>
                <SafeAreaView style={styles.flex}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: THEME.card, borderColor: THEME.border }]}>
                            <Ionicons name="chevron-back" size={22} color={THEME.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { fontFamily: font('Inter-Bold'), color: THEME.text }]}>MON PROFIL</Text>
                        <TouchableOpacity onPress={() => setActiveModal('securite')} style={[styles.headerBtn, { backgroundColor: THEME.card, borderColor: THEME.border }]}>
                            <Ionicons name="options-outline" size={22} color={THEME.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                        <View style={styles.heroSection}>
                            <View style={styles.avatarWrapper}>
                                <Image source={userAvatarSource(user)} style={[styles.avatar, { borderColor: THEME.card }]} resizeMode="cover" />
                                <View style={[styles.starBadge, { backgroundColor: THEME.accentGold, borderColor: THEME.card }]}>
                                    <MaterialIcons name="verified" size={14} color="white" />
                                </View>
                            </View>
                            <Text style={[styles.userName, { fontFamily: font('Inter-Bold'), color: THEME.text }]}>
                                {isReady ? userDisplayName(user, '—') : '…'}
                            </Text>
                            {user?.email ? (
                                <Text style={[styles.userSubText, { fontFamily: font('Inter-Med'), color: THEME.muted }]} numberOfLines={1}>
                                    {user.email}
                                </Text>
                            ) : null}
                            <Text style={[styles.userSubText, { fontFamily: font('Inter-Med'), color: THEME.muted, marginTop: 4 }]} numberOfLines={2}>
                                {isReady ? userLocationAndRole(user) : '…'}
                            </Text>
                            {user?.phone_number ? (
                                <Text style={[styles.userSubText, { fontFamily: font('Inter-Reg'), fontSize: 14, marginTop: 4 }]}>
                                    {user.phone_number}
                                </Text>
                            ) : null}
                            
                            <TouchableOpacity style={styles.editButton} activeOpacity={0.8} onPress={() => setEditOpen(true)}>
                                <LinearGradient colors={[THEME.primary, THEME.primaryDark]} style={styles.editGradient}>
                                    <Text style={[styles.editButtonText, { fontFamily: font('Inter-Bold') }]}>MODIFIER LE PROFIL</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.statsRow}>
                            <StatBox icon="landscape" val="25.4" label="HECTARES" theme={THEME} font={font} />
                            <StatBox icon="eco" val="06" label="CULTURES" theme={THEME} font={font} />
                            <StatBox icon="shopping-cart" val="142" label="VENTES" theme={THEME} font={font} />
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { fontFamily: font('Inter-Bold'), color: THEME.muted }]}>PARAMÈTRES DU COMPTE</Text>
                            <View style={[styles.menuWrapper, { backgroundColor: THEME.card, borderColor: THEME.border }]}>
                                <MenuRow icon="payments" label="Méthodes de Paiement" theme={THEME} font={font} onPress={() => setActiveModal('paiement')} />
                                <MenuRow icon="security" label="Sécurité & Confidentialité" theme={THEME} font={font} onPress={() => setActiveModal('securite')} />
                                <MenuRow icon="help-outline" label="Aide & Support" theme={THEME} font={font} onPress={() => setActiveModal('aide')} />
                                <MenuRow icon="logout" label="Déconnexion" theme={THEME} font={font} color="#EF4444" isLast onPress={handleLogout} />
                            </View>
                        </View>
                    </ScrollView>

                </SafeAreaView>
            </View>
        </View>
    );
}

const StatBox = ({ icon, val, label, theme, font }: any) => (
    <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.statIconBg, { backgroundColor: theme.primary + '15' }]}>
            <MaterialIcons name={icon} size={22} color={theme.primary} />
        </View>
        <Text style={[styles.statValue, { color: theme.text, fontFamily: font('Inter-Bold') }]}>{val}</Text>
        <Text style={[styles.statLabel, { color: theme.muted, fontFamily: font('Inter-Bold') }]}>{label}</Text>
    </View>
);

const MenuRow = ({ icon, label, theme, font, color, isLast, onPress }: any) => (
    <TouchableOpacity activeOpacity={0.6} onPress={onPress} style={[styles.menuItem, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
        <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBox, { backgroundColor: color === '#EF4444' ? '#EF444410' : '#F8FAFC' }]}>
                <MaterialIcons name={icon} size={20} color={color || theme.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: color || theme.text, fontFamily: font('Inter-Med') }]}>{label}</Text>
        </View>
        {!color && <Ionicons name="chevron-forward" size={16} color={theme.muted} />}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    outerContainer: { flex: 1, width: '100%', alignItems: 'stretch', backgroundColor: '#F1F5F9' },
    innerContainer: { flex: 1, width: '100%', alignSelf: 'center' },
    flex: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
    headerBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    headerTitle: { fontSize: 11, letterSpacing: 1.5 },
    scrollBody: { paddingBottom: 150 },
    heroSection: { alignItems: 'center', marginTop: 20, paddingHorizontal: 20 },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 5 },
    starBadge: { position: 'absolute', bottom: 5, right: 5, width: 30, height: 30, borderRadius: 15, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
    userName: { fontSize: 26, marginTop: 15, letterSpacing: -0.5 },
    userSubText: { fontSize: 13, marginTop: 4 },
    editButton: { marginTop: 25, borderRadius: 16, overflow: 'hidden', elevation: 5 },
    editGradient: { paddingHorizontal: 35, paddingVertical: 14 },
    editButtonText: { color: 'white', fontSize: 12 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: 35 },
    statBox: { flex: 1, minWidth: 0, padding: 14, borderRadius: 22, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    statIconBg: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    statValue: { fontSize: 20 },
    statLabel: { fontSize: 8, marginTop: 2, letterSpacing: 1 },
    section: { marginTop: 40, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 11, letterSpacing: 1.5, marginBottom: 15, opacity: 0.7 },
    menuWrapper: { borderRadius: 28, borderWidth: 1, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    menuIconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    menuLabel: { fontSize: 15 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', alignItems: 'center' },
    editSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '88%',
        padding: 20,
        alignSelf: 'center',
    },
    avatarEditRow: { alignItems: 'center', marginBottom: 20 },
    avatarEditImg: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#E2E8F0' },
    avatarEditHint: { marginTop: 10, fontSize: 14 },
    fieldLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6, marginTop: 12 },
    fieldInput: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
    fieldHint: { fontSize: 12, marginTop: 16, lineHeight: 18 },
    saveProfileBtn: {
        marginTop: 24,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveProfileBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    modalContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, height: '75%', padding: 24, elevation: 10, maxWidth: 500, width: '100%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottomWidth: 1 },
    modalTitle: { fontSize: 20, letterSpacing: -0.5 },
    modalBody: { paddingVertical: 25 },
    settingsGroup: { borderRadius: 24, padding: 8, overflow: 'hidden', borderWidth: 1 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 12, borderBottomWidth: 1 },
    logoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 24, marginTop: 20, borderWidth: 1 },
    settingLabelGroup: { flexDirection: 'row', alignItems: 'center' },
    settingIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    settingLabel: { fontSize: 15 },
    paymentExplain: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
    paymentSavedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 16,
    },
    paymentSavedLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
    paymentSavedTitle: { fontSize: 15 },
    paymentSavedSub: { fontSize: 13, marginTop: 2 },
    paymentRemoveBtn: { padding: 4 },
    paymentAddCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 20,
        borderStyle: 'dashed',
        borderWidth: 2,
        marginBottom: 8,
    },
    paymentAddText: { marginLeft: 10, fontSize: 15, flex: 1 },
    emptyHint: { textAlign: 'center', marginTop: 10, fontSize: 13 },
    infoCard: { borderRadius: 24, padding: 30, alignItems: 'center', gap: 15, borderWidth: 1 },
    infoText: { textAlign: 'center', fontSize: 16, lineHeight: 24 },
    supportAction: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, gap: 15, elevation: 2, marginBottom: 12 },
    supportActionText: { fontSize: 15, fontWeight: '600' }
});