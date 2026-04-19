import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import {
    fetchMyParcelles,
    fetchParcellesSync,
    isOfflineDevToken,
    type ApiParcelle,
    type ParcelleSyncRow,
} from '@/lib/agroconnectApi';
import {
    normalizeCultureKey,
    resolveParcelPreviewUri,
    uriForCulture,
} from '@/lib/parcelCulturePhotos';
import { setDashboardHomeScrollHandler } from '@/lib/dashboardHomeScroll';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ArrowUpRight,
    CloudSun,
    MapPin,
    MessageCircle,
    MessageSquareText,
    Package,
    Scan,
    Search,
    SlidersHorizontal,
    Store,
    Truck,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ImageBackground,
    Keyboard,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useAuth } from '@/contexts/AuthContext';
import { greetingLine, isClientBuyer, userAvatarSource } from '@/lib/userDisplay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 480;
const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH, MAX_WIDTH);

// Assets
const CROP_MAIS_IMG = require('../../../assets/images/parcel2.jpg');
const HEADER_BG = require('../../../assets/images/parcel1.jpg');

const COLORS = {
    background: '#FFFFFF',
    surface: '#F8FAFC',
    primary: '#065F46', 
    accent: '#10B981',
    textPrimary: '#0F172A',
    textMuted: '#64748B',
    border: '#F1F5F9',
    blueDim: '#EFF6FF',
    blueText: '#3B82F6',
};

function parsePct(raw: string | undefined | null): number | null {
    if (raw == null || String(raw).trim() === '') return null;
    const n = parseFloat(String(raw).replace(/,/g, '.').replace(/%/g, ''));
    if (!Number.isFinite(n)) return null;
    return Math.min(100, Math.max(0, n));
}

function apiParcelleToRow(p: ApiParcelle): ParcelleSyncRow {
    const ext = p as ApiParcelle & { culture?: string };
    return {
        id_local: p.id_local,
        nom: p.nom,
        points: p.points ?? '[]',
        surface: p.surface ?? '',
        humidite: p.humidite ?? '',
        croissance: p.croissance ?? '',
        qualite_sol: p.qualite_sol ?? '',
        statut_occupation: p.statut_occupation ?? 'libre',
        statut_location: p.statut_location ?? 'a_louer',
        lieu: p.lieu ?? '',
        culture: ext.culture ?? '',
        proprietaire_nom: p.proprietaire_nom ?? '',
        proprietaire_tel: p.proprietaire_tel ?? '',
        photos_urls: p.photos_urls ?? undefined,
    };
}

/** Évite les doublons si l’API renvoie plusieurs fois la même parcelle (ex. même id_local). */
function dedupeParcellesById(rows: ParcelleSyncRow[]): ParcelleSyncRow[] {
    const byId = new Map<string, ParcelleSyncRow>();
    const noId: ParcelleSyncRow[] = [];
    for (const r of rows) {
        const id = String(r.id_local ?? '').trim();
        if (!id) {
            noId.push(r);
            continue;
        }
        if (!byId.has(id)) byId.set(id, r);
    }
    return [...byId.values(), ...noId];
}

function parcelStatusFromRow(p: ParcelleSyncRow): { label: string; color: string } {
    const c = parsePct(p.croissance);
    const h = parsePct(p.humidite);
    const score = c != null && h != null ? (c + h) / 2 : c ?? h ?? 50;
    if (score >= 65) return { label: 'Suivi OK', color: COLORS.accent };
    if (score >= 40) return { label: 'À suivre', color: '#F59E0B' };
    return { label: 'À surveiller', color: '#EF4444' };
}

export default function FarmerDashboardModern() {
    const router = useRouter();
    const { user, isReady, token } = useAuth();
    const avatarSrc = userAvatarSource(user);
    const isClient = isClientBuyer(user);

    const [buyerDashQuery, setBuyerDashQuery] = useState('');
    const [farmerDashQuery, setFarmerDashQuery] = useState('');
    const [farmerMapFiltersOpen, setFarmerMapFiltersOpen] = useState(false);

    const [dashParcels, setDashParcels] = useState<ParcelleSyncRow[]>([]);
    const [dashParcelsLoading, setDashParcelsLoading] = useState(false);
    const [dashParcelsMine, setDashParcelsMine] = useState(false);

    const homeScrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        setDashboardHomeScrollHandler(() => {
            homeScrollRef.current?.scrollTo({ y: 0, animated: false });
        });
        return () => setDashboardHomeScrollHandler(null);
    }, []);

    useEffect(() => {
        if (isClient) return;
        let cancelled = false;
        (async () => {
            setDashParcelsLoading(true);
            const rows: ParcelleSyncRow[] = [];
            let fromMine = false;
            try {
                if (token && !isOfflineDevToken(token)) {
                    const mine = await fetchMyParcelles(token);
                    if (mine.length > 0) {
                        rows.push(...mine.map(apiParcelleToRow));
                        fromMine = true;
                    }
                }
            } catch {
                /* API indisponible */
            }
            if (rows.length === 0) {
                try {
                    const sync = await fetchParcellesSync();
                    if (!cancelled) {
                        rows.push(...sync.parcelles.slice(0, 8));
                        fromMine = false;
                    }
                } catch {
                    /* sync */
                }
            }
            if (!cancelled) {
                setDashParcels(dedupeParcellesById(rows));
                setDashParcelsMine(fromMine);
                setDashParcelsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isClient, token]);

    const dashAggregates = useMemo(() => {
        const hums = dashParcels
            .map((p) => parsePct(p.humidite))
            .filter((n): n is number => n != null);
        const crois = dashParcels
            .map((p) => parsePct(p.croissance))
            .filter((n): n is number => n != null);
        const avgHum = hums.length
            ? Math.round(hums.reduce((a, b) => a + b, 0) / hums.length)
            : null;
        const avgCroi = crois.length
            ? Math.round(crois.reduce((a, b) => a + b, 0) / crois.length)
            : null;
        const cultures = [
            ...new Set(dashParcels.map((p) => p.culture?.trim()).filter(Boolean)),
        ] as string[];
        const legend = cultures.slice(0, 2);
        const ring = avgCroi != null ? Math.min(100, Math.max(0, avgCroi)) : null;
        const strokeDash = ring != null ? `${Math.min(85, Math.round(ring * 0.85))}, 100` : '0, 100';
        return { avgHum, avgCroi, legend, strokeDash, ring };
    }, [dashParcels]);

    const goMarcheFromDash = () => {
        Keyboard.dismiss();
        router.push({
            pathname: '/marche',
            params: { q: buyerDashQuery.trim() },
        });
    };

    const goMapsFromDash = (filtre: 'tous' | 'a_louer' | 'occupee') => {
        Keyboard.dismiss();
        router.push({
            pathname: '/tableau-de-bord/maps',
            params: {
                ...(farmerDashQuery.trim() ? { q: farmerDashQuery.trim() } : {}),
                filtre,
            },
        });
        setFarmerMapFiltersOpen(false);
    };

    const goMapsSearchOnly = () => {
        Keyboard.dismiss();
        const q = farmerDashQuery.trim();
        if (q) {
            router.push({ pathname: '/tableau-de-bord/maps', params: { q } });
        } else {
            router.push('/tableau-de-bord/maps');
        }
    };

    const goMapsTerrainClient = () => {
        Keyboard.dismiss();
        const q = buyerDashQuery.trim();
        if (q) {
            router.push({ pathname: '/tableau-de-bord/maps', params: { q } });
        } else {
            router.push('/tableau-de-bord/maps');
        }
    };

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-Medium': PlusJakartaSans_500Medium,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    // Ne bloque pas l'écran si la police custom tarde à charger via tunnel.

    if (isClient) {
        return (
            <View style={styles.outerContainer}>
                <StatusBar barStyle="light-content" />
                <View style={[styles.innerContainer, { width: CONTAINER_WIDTH }]}>
                    <View style={styles.headerContainer}>
                        <ImageBackground source={HEADER_BG} style={styles.headerImage} resizeMode="cover">
                            <LinearGradient
                                colors={['rgba(0, 0, 0, 0.75)', 'rgba(0, 0, 0, 0.3)', '#FFFFFF']}
                                locations={[0, 0.5, 1]}
                                style={styles.headerOverlay}
                            >
                                <SafeAreaView>
                                    <View style={styles.headerTop}>
                                        <View style={{ flex: 1, paddingRight: 12 }}>
                                            <Text style={styles.brandTagWhite}>AGROCONNECT</Text>
                                            <Text style={styles.greetingTextWhite}>{greetingLine(isReady, user)}</Text>
                                            <Text style={styles.clientTagline}>
                                                Espace acheteur · commandes, carte des terrains & contact
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.avatarWrapperWhite}
                                            onPress={() => router.push('/tableau-de-bord/profil')}
                                        >
                                            <Image source={avatarSrc} style={styles.avatar} />
                                            <View style={styles.onlineStatus} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.searchSectionHeader}>
                                        <View style={styles.searchBarWhite}>
                                            <Search color="white" size={18} opacity={0.7} />
                                            <TextInput
                                                style={styles.searchInputWhite}
                                                placeholder="Produit, vendeur, région…"
                                                placeholderTextColor="rgba(255,255,255,0.45)"
                                                value={buyerDashQuery}
                                                onChangeText={setBuyerDashQuery}
                                                returnKeyType="search"
                                                onSubmitEditing={goMarcheFromDash}
                                            />
                                        </View>
                                        <TouchableOpacity
                                            style={styles.filterBtnWhite}
                                            onPress={goMarcheFromDash}
                                            accessibilityLabel="Ouvrir le marché avec cette recherche"
                                        >
                                            <Store color="white" size={20} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.filterBtnWhite}
                                            onPress={goMapsTerrainClient}
                                            accessibilityLabel="Voir sur la carte des parcelles"
                                        >
                                            <MapPin color="white" size={20} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.qaInsideHeader}>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.actionScrollContainer}
                                        >
                                            <QuickAction
                                                icon={Store}
                                                label="Marché"
                                                active
                                                onPress={() => router.push('/marche')}
                                                isHeader
                                            />
                                            <QuickAction
                                                icon={MapPin}
                                                label="Carte"
                                                onPress={() => router.push('/tableau-de-bord/maps')}
                                                isHeader
                                            />
                                            <QuickAction
                                                icon={MessageCircle}
                                                label="Messages"
                                                onPress={() => router.push('/tableau-de-bord/messagerie')}
                                                isHeader
                                            />
                                            <QuickAction
                                                icon={MessageSquareText}
                                                label="Agrobot"
                                                onPress={() => router.push('/tableau-de-bord/assistant')}
                                                isHeader
                                            />
                                        </ScrollView>
                                    </View>
                                </SafeAreaView>
                            </LinearGradient>
                        </ImageBackground>
                    </View>

                    <ScrollView
                        ref={homeScrollRef}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollBody}
                    >
                        <TouchableOpacity
                            style={styles.agrobotCard}
                            activeOpacity={0.92}
                            onPress={() => router.push('/marche')}
                        >
                            <View style={styles.agrobotInner}>
                                <View style={styles.agrobotIconWrap}>
                                    <Store color={COLORS.primary} size={26} strokeWidth={2.2} />
                                </View>
                                <View style={styles.agrobotTextCol}>
                                    <Text style={styles.agrobotTitle}>Passer une commande</Text>
                                    <Text style={styles.agrobotSubtitle}>
                                        Produits agricoles — même parcours que le marché B2B (panier & paiement).
                                    </Text>
                                </View>
                                <ArrowUpRight color={COLORS.textMuted} size={20} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.agrobotCard}
                            activeOpacity={0.92}
                            onPress={() => router.push('/tableau-de-bord/maps')}
                        >
                            <View style={styles.agrobotInner}>
                                <View style={styles.agrobotIconWrap}>
                                    <MapPin color={COLORS.primary} size={26} strokeWidth={2.2} />
                                </View>
                                <View style={styles.agrobotTextCol}>
                                    <Text style={styles.agrobotTitle}>Terrains à vendre ou à louer</Text>
                                    <Text style={styles.agrobotSubtitle}>
                                        Carte interactive — repérez une offre et contactez le propriétaire (téléphone /
                                        messagerie).
                                    </Text>
                                </View>
                                <ArrowUpRight color={COLORS.textMuted} size={20} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.agrobotCard}
                            activeOpacity={0.92}
                            onPress={() => router.push('/marche/louer_terrain')}
                        >
                            <View style={styles.agrobotInner}>
                                <View style={styles.agrobotIconWrap}>
                                    <MapPin color={COLORS.primary} size={26} strokeWidth={2.2} />
                                </View>
                                <View style={styles.agrobotTextCol}>
                                    <Text style={styles.agrobotTitle}>Louer une parcelle</Text>
                                    <Text style={styles.agrobotSubtitle}>
                                        Parcours location — durée, surface et conditions (démo).
                                    </Text>
                                </View>
                                <ArrowUpRight color={COLORS.textMuted} size={20} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.agrobotCard}
                            activeOpacity={0.92}
                            onPress={() => router.push('/marche/historique-transactions')}
                        >
                            <View style={styles.agrobotInner}>
                                <View style={styles.agrobotIconWrap}>
                                    <Package color={COLORS.primary} size={26} strokeWidth={2.2} />
                                </View>
                                <View style={styles.agrobotTextCol}>
                                    <Text style={styles.agrobotTitle}>Mes commandes</Text>
                                    <Text style={styles.agrobotSubtitle}>
                                        Historique et suivi de vos achats.
                                    </Text>
                                </View>
                                <ArrowUpRight color={COLORS.textMuted} size={20} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.agrobotCard}
                            activeOpacity={0.92}
                            onPress={() => router.push('/marche/suivi-livraison')}
                        >
                            <View style={styles.agrobotInner}>
                                <View style={styles.agrobotIconWrap}>
                                    <Truck color={COLORS.primary} size={26} strokeWidth={2.2} />
                                </View>
                                <View style={styles.agrobotTextCol}>
                                    <Text style={styles.agrobotTitle}>Suivi livraison</Text>
                                    <Text style={styles.agrobotSubtitle}>
                                        Carte du trajet et étapes — démo (référence depuis vos commandes).
                                    </Text>
                                </View>
                                <ArrowUpRight color={COLORS.textMuted} size={20} />
                            </View>
                        </TouchableOpacity>

                        <View style={{ height: 120 }} />
                    </ScrollView>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.outerContainer}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH }]}> 
                
                {/* --- HEADER PREMIUM --- */}
                <View style={styles.headerContainer}>
                    <ImageBackground source={HEADER_BG} style={styles.headerImage} resizeMode="cover">
                        <LinearGradient 
                            colors={['rgba(0, 0, 0, 0.75)', 'rgba(0, 0, 0, 0.3)', '#FFFFFF']} 
                            locations={[0, 0.5, 1]} 
                            style={styles.headerOverlay}
                        >
                            <SafeAreaView>
                                <View style={styles.headerTop}>
                                    <View>
                                        <Text style={styles.brandTagWhite}>AGROCONNECT</Text>
                                        <Text style={styles.greetingTextWhite}>
                                            {greetingLine(isReady, user)}
                                        </Text>
                                    </View>
                                    <TouchableOpacity style={styles.avatarWrapperWhite} onPress={() => router.push('/tableau-de-bord/profil')}>
                                        <Image source={avatarSrc} style={styles.avatar} />
                                        <View style={styles.onlineStatus} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.searchSectionHeader}>
                                    <View style={styles.searchBarWhite}>
                                        <Search color="white" size={18} opacity={0.7} />
                                        <TextInput
                                            style={styles.searchInputWhite}
                                            placeholder="Nom, lieu, culture, propriétaire…"
                                            placeholderTextColor="rgba(255,255,255,0.45)"
                                            value={farmerDashQuery}
                                            onChangeText={setFarmerDashQuery}
                                            returnKeyType="search"
                                            onSubmitEditing={goMapsSearchOnly}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.filterBtnWhite}
                                        onPress={() => setFarmerMapFiltersOpen(true)}
                                        accessibilityLabel="Filtres carte parcelles"
                                    >
                                        <SlidersHorizontal color="white" size={20} />
                                    </TouchableOpacity>
                                </View>

                                <Modal
                                    visible={farmerMapFiltersOpen}
                                    transparent
                                    animationType="slide"
                                    onRequestClose={() => setFarmerMapFiltersOpen(false)}
                                >
                                    <View style={styles.mapFilterOverlay}>
                                        <TouchableOpacity
                                            style={StyleSheet.absoluteFillObject}
                                            activeOpacity={1}
                                            onPress={() => setFarmerMapFiltersOpen(false)}
                                        />
                                        <View style={styles.mapFilterSheet}>
                                            <Text style={styles.mapFilterTitle}>Carte des parcelles</Text>
                                            <Text style={styles.mapFilterSubtitle}>
                                                Le texte saisi ci-dessus est appliqué en même temps que le filtre.
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.mapFilterRow}
                                                onPress={() => goMapsFromDash('tous')}
                                            >
                                                <Text style={styles.mapFilterRowText}>Toutes les parcelles</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.mapFilterRow}
                                                onPress={() => goMapsFromDash('a_louer')}
                                            >
                                                <Text style={styles.mapFilterRowText}>Uniquement à louer</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.mapFilterRow}
                                                onPress={() => goMapsFromDash('occupee')}
                                            >
                                                <Text style={styles.mapFilterRowText}>Occupées</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.mapFilterCancel}
                                                onPress={() => setFarmerMapFiltersOpen(false)}
                                            >
                                                <Text style={styles.mapFilterCancelText}>Fermer</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Modal>

                                <View style={styles.qaInsideHeader}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionScrollContainer}>
                                        <QuickAction icon={MessageSquareText} label="Agrobot AI" active onPress={() => router.push('/tableau-de-bord/assistant')} isHeader />
                                        <QuickAction icon={MessageCircle} label="Messages" onPress={() => router.push('/tableau-de-bord/messagerie')} isHeader />
                                        <QuickAction icon={Scan} label="Scan IA" onPress={() => router.push('/tableau-de-bord/scan')} isHeader />
                                        <QuickAction icon={Store} label="Marché" onPress={() => router.push('/marche')} isHeader />
                                        <QuickAction icon={CloudSun} label="Météo" onPress={() => router.push('/tableau-de-bord/meteo')} isHeader />
                                        <QuickAction icon={Truck} label="Logistique" onPress={() => router.push('/suivi')} isHeader />
                                    </ScrollView>
                                </View>
                            </SafeAreaView>
                        </LinearGradient>
                    </ImageBackground>
                </View>

                <ScrollView
                    ref={homeScrollRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollBody}
                >

                    {/* --- SCAN IA : diagnostic image (intégré au tableau de bord) --- */}
                    <TouchableOpacity
                        style={styles.scanIaCard}
                        activeOpacity={0.92}
                        onPress={() => router.push('/tableau-de-bord/scan')}
                    >
                        <LinearGradient
                            colors={['#065F46', '#10B981', '#34D399']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.scanIaGradient}
                        >
                            <View style={styles.scanIaIconWrap}>
                                <Scan color="#FFFFFF" size={28} strokeWidth={2.5} />
                            </View>
                            <View style={styles.scanIaTextCol}>
                                <Text style={styles.scanIaTitle}>Diagnostic feuille (IA)</Text>
                                <Text style={styles.scanIaSubtitle}>
                                    Photographiez une feuille — analyse des maladies et de la santé de la plante
                                </Text>
                            </View>
                            <View style={styles.scanIaChevron}>
                                <ArrowUpRight color="rgba(255,255,255,0.95)" size={22} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* --- AGROBOT : chat IA (même backend que /api/chat) --- */}
                    <TouchableOpacity
                        style={styles.agrobotCard}
                        activeOpacity={0.92}
                        onPress={() => router.push('/tableau-de-bord/assistant')}
                    >
                        <View style={styles.agrobotInner}>
                            <View style={styles.agrobotIconWrap}>
                                <MessageSquareText color={COLORS.primary} size={26} strokeWidth={2.2} />
                            </View>
                            <View style={styles.agrobotTextCol}>
                                <Text style={styles.agrobotTitle}>Agrobot AI</Text>
                                <Text style={styles.agrobotSubtitle}>
                                    Questions météo, maladies, carte et marché — réponses intelligentes et raccourcis vers l&apos;app
                                </Text>
                            </View>
                            <ArrowUpRight color={COLORS.textMuted} size={20} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.agrobotCard}
                        activeOpacity={0.92}
                        onPress={() => router.push('/tableau-de-bord/equipements')}
                    >
                        <View style={styles.agrobotInner}>
                            <View style={styles.agrobotIconWrap}>
                                <Truck color={COLORS.primary} size={26} strokeWidth={2.2} />
                            </View>
                            <View style={styles.agrobotTextCol}>
                                <Text style={styles.agrobotTitle}>Tracteurs & équipements</Text>
                                <Text style={styles.agrobotSubtitle}>
                                    Parc matériel (démo) — lien vers l&apos;ajout de parcelles et cultures.
                                </Text>
                            </View>
                            <ArrowUpRight color={COLORS.textMuted} size={20} />
                        </View>
                    </TouchableOpacity>

                    {/* --- SANTÉ (moyennes issues des parcelles API / sync) --- */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>État des cultures (parcelles)</Text>
                        <View style={styles.healthBadge}>
                            <Text style={styles.healthBadgeText}>Données réelles</Text>
                        </View>
                    </View>

                    <View style={styles.healthCard}>
                        <View style={styles.chartWrapper}>
                            <Svg height="85" width="85" viewBox="0 0 36 36">
                                <Circle cx="18" cy="18" r="15.9" fill="none" stroke="#F1F5F9" strokeWidth="3.5" />
                                <Circle
                                    cx="18" cy="18" r="15.9" fill="none" stroke={COLORS.accent} strokeWidth={3.5}
                                    strokeDasharray={dashAggregates.strokeDash}
                                    strokeLinecap="round"
                                    transform="rotate(-90 18 18)"
                                />
                            </Svg>
                            <View style={styles.chartCenterText}>
                                <Text style={styles.percentText}>
                                    {dashAggregates.ring != null ? `${dashAggregates.ring}%` : '—'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.legendWrapper}>
                            {dashAggregates.legend.length >= 1 ? (
                                <LegendItem
                                    color={COLORS.accent}
                                    label={`${dashAggregates.legend[0]} · parcelles`}
                                />
                            ) : (
                                <LegendItem color={COLORS.textMuted} label="Culture non renseignée en base" />
                            )}
                            {dashAggregates.legend.length >= 2 ? (
                                <LegendItem color="#FACC15" label={dashAggregates.legend[1]} />
                            ) : dashAggregates.legend.length === 1 ? (
                                <LegendItem
                                    color={COLORS.textMuted}
                                    label="Ajoutez d'autres cultures sur la carte"
                                />
                            ) : null}
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.miniStatCard}>
                            <View style={[styles.miniIconBg, { backgroundColor: COLORS.blueDim }]}>
                                <MaterialCommunityIcons name="water-percent" size={20} color={COLORS.blueText} />
                            </View>
                            <Text style={styles.miniStatVal}>
                                {dashAggregates.avgHum != null ? `${dashAggregates.avgHum}%` : '—'}
                            </Text>
                            <Text style={styles.miniStatLabel}>Humidité moy.</Text>
                        </View>
                        <View style={[styles.miniStatCard, { backgroundColor: COLORS.primary }]}>
                            <View style={[styles.miniIconBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                                <MaterialIcons name="map" size={20} color="white" />
                            </View>
                            <Text style={[styles.miniStatVal, { color: 'white' }]}>{dashParcels.length}</Text>
                            <Text style={[styles.miniStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>
                                Parcelle{dashParcels.length > 1 ? 's' : ''}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {dashParcelsMine ? 'Mes parcelles' : 'Parcelles (réseau)'}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/tableau-de-bord/maps')}>
                            <Text style={styles.seeAll}>Voir tout</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cropsContainer}>
                        {dashParcelsLoading ? (
                            <View style={styles.dashParcelsLoading}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text style={styles.dashParcelsLoadingText}>Chargement des parcelles…</Text>
                            </View>
                        ) : dashParcels.length === 0 ? (
                            <Text style={styles.dashParcelsEmpty}>
                                Aucune parcelle trouvée. Connectez-vous pour voir les vôtres, ou ouvrez la carte pour
                                synchroniser le réseau.
                            </Text>
                        ) : (
                            dashParcels.slice(0, 4).map((p) => {
                                const st = parcelStatusFromRow(p);
                                const cul = p.culture?.trim() ?? '';
                                const nomTrim = p.nom?.trim() ?? '';
                                const uriArachide =
                                    (cul && normalizeCultureKey(cul) === 'arachide') ||
                                    nomTrim === 'Champ 3';
                                const uri = uriArachide
                                    ? uriForCulture('Arachide')
                                    : resolveParcelPreviewUri(p.photos_urls, p.culture);
                                const loc = [p.lieu, p.culture].filter(Boolean).join(' · ') || '—';
                                return (
                                    <CropItem
                                        key={p.id_local}
                                        name={p.nom}
                                        location={loc}
                                        status={st.label}
                                        color={st.color}
                                        image={CROP_MAIS_IMG}
                                        imageUri={uri ?? undefined}
                                        onPress={() =>
                                            router.push({
                                                pathname: '/tableau-de-bord/maps',
                                                params: { q: p.nom },
                                            })
                                        }
                                    />
                                );
                            })
                        )}
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>

            </View>
        </View>
    );
}

const QuickAction = ({ icon: Icon, label, active, onPress, isHeader }: any) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
        <View style={[
            styles.iconBoxMinimal, 
            active ? { backgroundColor: 'white' } : { backgroundColor: 'rgba(255,255,255,0.15)' }
        ]}>
            <Icon color={active ? COLORS.primary : 'white'} size={24} strokeWidth={active ? 2.5 : 1.5} />
        </View>
        <Text style={[styles.actionLabel, active && { fontFamily: 'PJS-Bold', opacity: 1 }]}>{label}</Text>
    </TouchableOpacity>
);

const LegendItem = ({ color, label }: any) => (
    <View style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendText}>{label}</Text>
    </View>
);

const CropItem = ({ name, location, status, color, image, imageUri, onPress }: any) => (
    <TouchableOpacity style={styles.cropCardOuter} activeOpacity={0.92} onPress={onPress}>
        <View style={styles.cropCardInner}>
            <ImageBackground
                source={imageUri ? { uri: imageUri } : image}
                style={styles.cropImage}
                imageStyle={styles.cropImageRadius}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(15,23,42,0.45)', 'rgba(15,23,42,0.08)', 'transparent']}
                    locations={[0, 0.35, 1]}
                    style={styles.cropTopVignette}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(15,23,42,0.5)', 'rgba(6,95,70,0.92)']}
                    locations={[0, 0.45, 1]}
                    style={styles.cropGradient}
                >
                    <View style={styles.cropInfoOverlay}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.cropNameLarge} numberOfLines={2}>
                                {name}
                            </Text>
                            <View style={styles.locationRowSmall}>
                                <MapPin color="rgba(255,255,255,0.75)" size={13} />
                                <Text style={styles.cropLocLarge} numberOfLines={2}>
                                    {location}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadgeLarge, { backgroundColor: color }]}>
                            <Text style={styles.statusTextLarge}>{status}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center' },
    innerContainer: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, backgroundColor: '#FFFFFF', overflow: 'hidden' },
    headerContainer: { height: 380, width: '100%' },
    headerImage: { flex: 1 },
    headerOverlay: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    brandTagWhite: { fontFamily: 'PJS-ExtraBold', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase' },
    greetingTextWhite: { fontFamily: 'PJS-ExtraBold', fontSize: 28, color: '#FFFFFF', letterSpacing: -0.5, marginTop: 4 },
    clientTagline: {
        fontFamily: 'PJS-Medium',
        fontSize: 13,
        color: 'rgba(255,255,255,0.88)',
        marginTop: 8,
        lineHeight: 18,
        maxWidth: 260,
    },
    avatarWrapperWhite: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', overflow: 'hidden' },
    avatar: { width: '100%', height: '100%' },
    onlineStatus: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accent, borderWidth: 2, borderColor: '#000' },
    searchSectionHeader: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 30 },
    searchBarWhite: {
        flex: 1,
        minWidth: 0,
        height: 54,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    searchInputWhite: {
        flex: 1,
        minWidth: 0,
        fontFamily: 'PJS-Medium',
        fontSize: 14,
        color: '#FFFFFF',
        paddingVertical: 0,
    },
    searchPlaceholderWhite: { fontFamily: 'PJS-Medium', fontSize: 14, color: 'white', opacity: 0.7 },
    filterBtnWhite: {
        width: 48,
        height: 48,
        flexShrink: 0,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    mapFilterOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    mapFilterSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingHorizontal: 22,
        paddingTop: 12,
        paddingBottom: 28,
    },
    mapFilterTitle: {
        fontFamily: 'PJS-ExtraBold',
        fontSize: 18,
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    mapFilterSubtitle: {
        fontFamily: 'PJS-Medium',
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 16,
        lineHeight: 17,
    },
    mapFilterRow: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    mapFilterRowText: { fontFamily: 'PJS-SemiBold', fontSize: 16, color: COLORS.primary },
    mapFilterCancel: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
    mapFilterCancelText: { fontFamily: 'PJS-Bold', fontSize: 15, color: COLORS.textMuted },
    qaInsideHeader: { marginTop: 5 },
    actionScrollContainer: { paddingRight: 20 },
    actionItem: { alignItems: 'center', marginRight: 24 },
    iconBoxMinimal: { width: 62, height: 62, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    actionLabel: { fontFamily: 'PJS-SemiBold', fontSize: 12, color: '#FFFFFF', opacity: 0.8 },
    scrollBody: { paddingTop: 30, paddingBottom: 120 },
    scanIaCard: {
        marginHorizontal: 24,
        marginBottom: 22,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#065F46',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    scanIaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 18,
        gap: 14,
    },
    scanIaIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.22)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanIaTextCol: { flex: 1 },
    scanIaTitle: {
        fontFamily: 'PJS-ExtraBold',
        fontSize: 17,
        color: '#FFFFFF',
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    scanIaSubtitle: {
        fontFamily: 'PJS-Medium',
        fontSize: 12,
        color: 'rgba(255,255,255,0.92)',
        lineHeight: 17,
    },
    scanIaChevron: {
        alignSelf: 'center',
        opacity: 0.95,
    },
    agrobotCard: {
        marginHorizontal: 24,
        marginBottom: 22,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    agrobotInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 14,
    },
    agrobotIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    agrobotTextCol: { flex: 1 },
    agrobotTitle: {
        fontFamily: 'PJS-ExtraBold',
        fontSize: 17,
        color: COLORS.textPrimary,
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    agrobotSubtitle: {
        fontFamily: 'PJS-Medium',
        fontSize: 12,
        color: COLORS.textMuted,
        lineHeight: 17,
    },
    sectionHeader: { flexDirection: 'row', paddingHorizontal: 24, justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    sectionTitle: { fontFamily: 'PJS-ExtraBold', fontSize: 20, color: COLORS.textPrimary, letterSpacing: -0.3 },
    healthBadge: { backgroundColor: COLORS.blueDim, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
    healthBadgeText: { fontFamily: 'PJS-Bold', fontSize: 12, color: COLORS.blueText },
    healthCard: { marginHorizontal: 24, backgroundColor: 'white', borderRadius: 28, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 25, borderWidth: 1, borderColor: COLORS.border },
    chartWrapper: { width: 85, height: 85, justifyContent: 'center', alignItems: 'center' },
    chartCenterText: { position: 'absolute' },
    percentText: { fontFamily: 'PJS-ExtraBold', fontSize: 22, color: COLORS.textPrimary },
    legendWrapper: { flex: 1, gap: 10 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontFamily: 'PJS-SemiBold', fontSize: 14, color: COLORS.textPrimary },
    statsGrid: { flexDirection: 'row', paddingHorizontal: 24, gap: 16, marginBottom: 30 },
    miniStatCard: { flex: 1, borderRadius: 24, padding: 20, backgroundColor: 'white', borderWidth: 1, borderColor: COLORS.border },
    miniIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    miniStatVal: { fontFamily: 'PJS-ExtraBold', fontSize: 20, color: COLORS.textPrimary },
    miniStatLabel: { fontFamily: 'PJS-Bold', fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
    seeAll: { fontFamily: 'PJS-Bold', fontSize: 14, color: COLORS.primary },
    cropsContainer: { paddingHorizontal: 24, gap: 18 },
    dashParcelsLoading: {
        paddingVertical: 28,
        alignItems: 'center',
        gap: 10,
    },
    dashParcelsLoadingText: {
        fontFamily: 'PJS-Medium',
        fontSize: 13,
        color: COLORS.textMuted,
    },
    dashParcelsEmpty: {
        fontFamily: 'PJS-Medium',
        fontSize: 14,
        color: COLORS.textMuted,
        lineHeight: 21,
        paddingVertical: 12,
    },
    cropCardOuter: {
        width: '100%',
        marginBottom: 0,
        borderRadius: 26,
        backgroundColor: '#FFFFFF',
        elevation: 6,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
    },
    cropCardInner: {
        height: 200,
        borderRadius: 26,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(15, 23, 42, 0.06)',
    },
    cropImage: { width: '100%', height: '100%' },
    cropImageRadius: { borderRadius: 25 },
    cropTopVignette: { ...StyleSheet.absoluteFillObject, height: '42%' },
    cropGradient: { flex: 1, justifyContent: 'flex-end', padding: 20, paddingTop: 48 },
    cropInfoOverlay: { flexDirection: 'row', alignItems: 'flex-end' },
    cropNameLarge: { fontFamily: 'PJS-ExtraBold', fontSize: 22, color: '#FFFFFF' },
    locationRowSmall: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    cropLocLarge: { fontFamily: 'PJS-Medium', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
    statusBadgeLarge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    statusTextLarge: { fontFamily: 'PJS-ExtraBold', fontSize: 11, color: '#FFF', textTransform: 'uppercase' },
});