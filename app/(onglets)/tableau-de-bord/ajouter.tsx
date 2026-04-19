import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useAuth } from '@/contexts/AuthContext';
import {
    bulkUpsertParcelles,
    createMvpMarketplaceProduct,
    isOfflineDevToken,
    uploadAgroImage,
} from '@/lib/agroconnectApi';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';

const MAX_WIDTH = 500;
const GREEN_PRIMARY = '#065F46';
const GREEN_LIGHT = '#10B981';

type MenuId = 'market' | 'parcel' | 'land' | 'material';
type FormType = null | 'market' | 'parcel';

export default function ActionMenu() {
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const router = useRouter();
    const { token, user, isReady } = useAuth();

    useEffect(() => {
        if (!isReady || !user) return;
        if (user.role === 'client') {
            router.replace('/tableau-de-bord');
        }
    }, [isReady, user, router]);
    const CONTAINER_WIDTH = useMemo(() => Math.min(SCREEN_WIDTH, MAX_WIDTH), [SCREEN_WIDTH]);

    const [activeForm, setActiveForm] = useState<FormType>(null);
    const [productName, setProductName] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productImageUri, setProductImageUri] = useState<string | null>(null);
    const [parcelName, setParcelName] = useState('');
    const [parcelImageUris, setParcelImageUris] = useState<string[]>([]);
    const [sendingProduct, setSendingProduct] = useState(false);
    const [sendingParcel, setSendingParcel] = useState(false);

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-Medium': PlusJakartaSans_500Medium,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    const THEME = {
        primary: GREEN_PRIMARY,
        accent: GREEN_LIGHT,
        bg: '#F8FAFC',
        card: '#FFFFFF',
        text: '#0F172A',
        muted: '#64748B',
        border: '#F1F5F9',
        inputBg: '#F1F5F9',
    };

    const pickProductPhoto = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Photos', 'Autorisez l’accès à la galerie pour ajouter une image.');
            return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.85,
        });
        if (!res.canceled && res.assets[0]?.uri) setProductImageUri(res.assets[0].uri);
    }, []);

    const pickParcelPhotos = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Photos', 'Autorisez l’accès à la galerie pour ajouter des images.');
            return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 6,
            quality: 0.85,
        });
        if (!res.canceled && res.assets.length) {
            setParcelImageUris((prev) => [...prev, ...res.assets.map((a) => a.uri)].slice(0, 8));
        }
    }, []);

    const onMenuPress = (id: MenuId) => {
        if (id === 'land') {
            router.push('/marche/louer_terrain');
            return;
        }
        if (id === 'material') {
            router.push('/marche/materiel');
            return;
        }
        setActiveForm(id);
    };

    const resetProductForm = () => {
        setProductName('');
        setProductPrice('');
        setProductImageUri(null);
        setActiveForm(null);
    };

    const parsePriceCents = (raw: string): number => {
        const n = parseInt(raw.replace(/\s/g, ''), 10);
        return Number.isFinite(n) && n >= 0 ? n : 0;
    };

    const publishProduct = async () => {
        if (!productName.trim()) {
            Alert.alert('Produit', 'Indiquez au moins le nom du produit.');
            return;
        }
        if (isOfflineDevToken(token)) {
            Alert.alert(
                'Connexion',
                'Connectez-vous avec un compte (serveur FastAPI joignable) pour publier une annonce.'
            );
            return;
        }
        setSendingProduct(true);
        try {
            let imagePath: string | null = null;
            if (productImageUri) {
                imagePath = await uploadAgroImage(token!, productImageUri);
            }
            await createMvpMarketplaceProduct(token!, {
                title: productName.trim(),
                description: '',
                category: 'recoltes',
                price_cents: parsePriceCents(productPrice),
                quantity: 1,
                image_url: imagePath,
            });
            Alert.alert('Publication', 'Votre produit a été enregistré sur le serveur.', [
                {
                    text: 'Voir le marché',
                    onPress: () => {
                        resetProductForm();
                        router.push('/marche/produit');
                    },
                },
                { text: 'OK', onPress: resetProductForm },
            ]);
        } catch (e) {
            Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
        } finally {
            setSendingProduct(false);
        }
    };

    const saveParcelDraft = async () => {
        if (!parcelName.trim() && parcelImageUris.length === 0) {
            Alert.alert('Parcelle', 'Ajoutez un nom ou au moins une photo.');
            return;
        }
        if (parcelImageUris.length > 0 && isOfflineDevToken(token)) {
            Alert.alert(
                'Connexion',
                'Connectez-vous pour envoyer les photos de parcelle au serveur.'
            );
            return;
        }
        setSendingParcel(true);
        try {
            const idLocal = `parcel_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            const urls: string[] = [];
            if (token && parcelImageUris.length > 0) {
                for (const uri of parcelImageUris) {
                    urls.push(await uploadAgroImage(token, uri));
                }
            }
            const nom = parcelName.trim() || 'Parcelle';
            await bulkUpsertParcelles(token ?? 'dev-token', [
                {
                    id_local: idLocal,
                    nom,
                    points: '[]',
                    photos_urls: JSON.stringify(urls),
                    statut_occupation: 'libre',
                    statut_location: 'a_louer',
                },
            ]);
            setParcelName('');
            setParcelImageUris([]);
            setActiveForm(null);
            Alert.alert(
                'Parcelle',
                urls.length
                    ? 'Photos enregistrées sur le serveur. Vous pouvez tracer la parcelle sur la carte.'
                    : 'Parcelle créée. Ajoutez des photos ou tracez sur la carte.',
                [
                    { text: 'Plus tard', style: 'cancel' },
                    { text: 'Ouvrir la carte', onPress: () => router.push('/tableau-de-bord/maps') },
                ]
            );
        } catch (e) {
            Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
        } finally {
            setSendingParcel(false);
        }
    };

    const ACTIONS: {
        id: MenuId;
        title: string;
        desc: string;
        icon: string;
        isMCI?: boolean;
        colors: [string, string];
    }[] = [
        {
            id: 'market',
            title: 'Vendre un produit',
            desc: 'Annonce + photos sur le marketplace',
            icon: 'storefront-outline',
            colors: [GREEN_LIGHT, GREEN_PRIMARY],
        },
        {
            id: 'parcel',
            title: 'Parcelle & photos',
            desc: 'Images au niveau parcelle, puis carte',
            icon: 'images-outline',
            colors: ['#059669', '#064E3B'],
        },
        {
            id: 'land',
            title: 'Location de terres',
            desc: 'Proposer ou chercher une location',
            icon: 'map-outline',
            colors: ['#F59E0B', '#D97706'],
        },
        {
            id: 'material',
            title: 'Louer mon matériel',
            desc: 'Tracteur, outillage, logistique',
            icon: 'tractor',
            isMCI: true,
            colors: ['#6366F1', '#4F46E5'],
        },
    ];

    const headerSubtitle = activeForm === 'market' ? 'Produit' : activeForm === 'parcel' ? 'Parcelle' : '';

    if (!fontsLoaded) return null;

    return (
        <View style={[styles.outerContainer, { backgroundColor: THEME.bg }]}>
            <StatusBar barStyle="dark-content" />

            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH }]}>
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => (activeForm ? setActiveForm(null) : router.back())}
                            style={[styles.closeBtn, { backgroundColor: THEME.card, borderColor: THEME.border }]}
                        >
                            <Ionicons name={activeForm ? 'arrow-back' : 'close'} size={22} color={THEME.text} />
                        </TouchableOpacity>
                        <View style={{ marginLeft: 15, flex: 1 }}>
                            <Text style={[styles.headerTitle, { color: THEME.text, fontFamily: 'PJS-ExtraBold' }]}>
                                {!activeForm ? 'Ajouter' : 'Nouveau'}
                            </Text>
                            {!!headerSubtitle && (
                                <Text style={{ color: THEME.muted, fontFamily: 'PJS-SemiBold', fontSize: 13, marginTop: 2 }}>
                                    {headerSubtitle}
                                </Text>
                            )}
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {!activeForm ? (
                            <View style={styles.grid}>
                                {ACTIONS.map((action) => (
                                    <TouchableOpacity
                                        key={action.id}
                                        style={[styles.actionCard, { backgroundColor: THEME.card, borderColor: THEME.border }]}
                                        onPress={() => onMenuPress(action.id)}
                                    >
                                        <LinearGradient colors={action.colors} style={styles.iconWrapper}>
                                            {action.isMCI ? (
                                                <MaterialCommunityIcons name={action.icon as 'tractor'} size={24} color="white" />
                                            ) : (
                                                <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={24} color="white" />
                                            )}
                                        </LinearGradient>

                                        <View style={{ flex: 1, marginLeft: 16 }}>
                                            <Text style={[styles.actionTitle, { color: THEME.text, fontFamily: 'PJS-Bold' }]}>
                                                {action.title}
                                            </Text>
                                            <Text style={[styles.actionDesc, { color: THEME.muted, fontFamily: 'PJS-SemiBold' }]}>
                                                {action.desc}
                                            </Text>
                                        </View>
                                        <View style={[styles.arrowCircle, { backgroundColor: '#F8FAFC' }]}>
                                            <Ionicons name="chevron-forward" size={20} color={THEME.accent} />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : activeForm === 'market' ? (
                            <View style={[styles.sellCard, { backgroundColor: THEME.card, borderColor: THEME.border }]}>
                                <Text style={[styles.formLabel, { color: THEME.text, fontFamily: 'PJS-Bold', marginTop: 0 }]}>
                                    Nom du produit
                                </Text>
                                <TextInput
                                    value={productName}
                                    onChangeText={setProductName}
                                    placeholder="ex. Sac de maïs bio"
                                    placeholderTextColor={THEME.muted}
                                    style={[styles.input, { backgroundColor: THEME.inputBg, color: THEME.text, fontFamily: 'PJS-SemiBold' }]}
                                />

                                <Text style={[styles.formLabel, { color: THEME.text, fontFamily: 'PJS-Bold' }]}>Prix (FCFA, optionnel)</Text>
                                <TextInput
                                    value={productPrice}
                                    onChangeText={setProductPrice}
                                    placeholder="ex. 5000"
                                    placeholderTextColor={THEME.muted}
                                    keyboardType="numeric"
                                    style={[styles.input, { backgroundColor: THEME.inputBg, color: THEME.text, fontFamily: 'PJS-SemiBold' }]}
                                />

                                <Text style={[styles.formLabel, { color: THEME.text, fontFamily: 'PJS-Bold' }]}>Photo</Text>
                                {productImageUri ? (
                                    <View style={styles.previewWrap}>
                                        <Image source={{ uri: productImageUri }} style={styles.previewImg} />
                                        <TouchableOpacity onPress={() => setProductImageUri(null)} style={styles.removePhoto}>
                                            <Ionicons name="close-circle" size={28} color={THEME.muted} />
                                        </TouchableOpacity>
                                    </View>
                                ) : null}

                                <TouchableOpacity style={[styles.uploadBtn, { borderColor: THEME.accent }]} onPress={pickProductPhoto}>
                                    <Feather name="camera" size={20} color={THEME.accent} />
                                    <Text style={[styles.uploadText, { color: THEME.accent, fontFamily: 'PJS-ExtraBold' }]}>
                                        {productImageUri ? 'Changer la photo' : 'Ajouter une photo'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.submitBtnContainer}
                                    onPress={publishProduct}
                                    disabled={sendingProduct}
                                >
                                    <LinearGradient colors={[THEME.accent, THEME.primary]} style={styles.submitBtnGradient}>
                                        {sendingProduct ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={[styles.submitBtnText, { fontFamily: 'PJS-ExtraBold' }]}>
                                                Publier sur le marché
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={[styles.sellCard, { backgroundColor: THEME.card, borderColor: THEME.border }]}>
                                <Text style={[styles.hint, { color: THEME.muted, fontFamily: 'PJS-SemiBold' }]}>
                                    Associez des photos à votre parcelle, puis ouvrez la carte pour tracer ou ajuster le contour.
                                </Text>

                                <Text style={[styles.formLabel, { color: THEME.text, fontFamily: 'PJS-Bold', marginTop: 0 }]}>
                                    Nom de la parcelle
                                </Text>
                                <TextInput
                                    value={parcelName}
                                    onChangeText={setParcelName}
                                    placeholder="ex. Champ Nord — maïs"
                                    placeholderTextColor={THEME.muted}
                                    style={[styles.input, { backgroundColor: THEME.inputBg, color: THEME.text, fontFamily: 'PJS-SemiBold' }]}
                                />

                                <Text style={[styles.formLabel, { color: THEME.text, fontFamily: 'PJS-Bold' }]}>Photos de la parcelle</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.parcelRow}>
                                    {parcelImageUris.map((uri) => (
                                        <View key={uri} style={styles.thumbWrap}>
                                            <Image source={{ uri }} style={styles.thumb} />
                                            <TouchableOpacity
                                                style={styles.thumbRemove}
                                                onPress={() => setParcelImageUris((p) => p.filter((u) => u !== uri))}
                                            >
                                                <Ionicons name="close" size={16} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>

                                <TouchableOpacity style={[styles.uploadBtn, { borderColor: THEME.accent }]} onPress={pickParcelPhotos}>
                                    <Feather name="image" size={20} color={THEME.accent} />
                                    <Text style={[styles.uploadText, { color: THEME.accent, fontFamily: 'PJS-ExtraBold' }]}>
                                        Ajouter des photos
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.secondaryBtn, { borderColor: THEME.border }]}
                                    onPress={() => router.push('/tableau-de-bord/maps')}
                                >
                                    <Ionicons name="map-outline" size={22} color={THEME.primary} />
                                    <Text style={[styles.secondaryBtnText, { color: THEME.primary, fontFamily: 'PJS-Bold' }]}>
                                        Ouvrir la carte pour tracer la parcelle
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.submitBtnContainer}
                                    onPress={saveParcelDraft}
                                    disabled={sendingParcel}
                                >
                                    <LinearGradient colors={[THEME.accent, THEME.primary]} style={styles.submitBtnGradient}>
                                        {sendingParcel ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={[styles.submitBtnText, { fontFamily: 'PJS-ExtraBold' }]}>
                                                Enregistrer sur le serveur
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={{ height: 160 }} />
                    </ScrollView>
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, alignItems: 'center' },
    innerContainer: { flex: 1 },
    header: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 45 : 20,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    headerTitle: { fontSize: 26, letterSpacing: -0.5 },
    scrollContent: { paddingHorizontal: 20 },
    grid: { gap: 12 },
    actionCard: {
        width: '100%',
        borderRadius: 24,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        elevation: 1,
    },
    iconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTitle: { fontSize: 17, marginBottom: 3 },
    actionDesc: { fontSize: 13, opacity: 0.8 },
    arrowCircle: {
        width: 34,
        height: 34,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sellCard: {
        padding: 20,
        borderRadius: 32,
        borderWidth: 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 15,
    },
    hint: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
    formLabel: { fontSize: 14, marginBottom: 8, marginTop: 18 },
    input: { height: 54, borderRadius: 16, paddingHorizontal: 16, fontSize: 15 },
    previewWrap: { marginTop: 8, alignSelf: 'center' },
    previewImg: { width: 280, height: 210, borderRadius: 16 },
    removePhoto: { position: 'absolute', top: 8, right: 8 },
    parcelRow: { flexGrow: 0, marginTop: 8, minHeight: 100 },
    thumbWrap: { marginRight: 10 },
    thumb: { width: 100, height: 100, borderRadius: 14 },
    thumbRemove: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 12,
        padding: 4,
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 18,
        borderWidth: 2,
        borderStyle: 'dashed',
        marginTop: 16,
        gap: 10,
    },
    uploadText: { fontSize: 14 },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 18,
        borderWidth: 1,
    },
    secondaryBtnText: { fontSize: 14, flex: 1 },
    submitBtnContainer: {
        marginTop: 24,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#10B981',
        shadowOpacity: 0.3,
    },
    submitBtnGradient: { height: 60, justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { color: 'white', fontSize: 16 },
});
