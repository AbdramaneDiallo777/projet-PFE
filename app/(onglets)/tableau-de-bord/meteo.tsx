import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import {
    BrainCircuit,
    CalendarDays,
    ChevronLeft,
    Cloud,
    CloudFog,
    CloudLightning,
    CloudRain,
    CloudSun,
    Droplets,
    MapPin,
    Navigation,
    RefreshCcw,
    Sparkles,
    Sprout,
    Sun,
    Thermometer,
    Wind,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import type { InsightsRecommendations, InsightsWeather, V1Weather } from '@/lib/agroconnectApi';
import {
    fetchInsightsRecommendations,
    fetchInsightsWeather,
    mapInsightsWeatherToV1,
} from '@/lib/agroconnectApi';

const MAX_WIDTH = 500;

const COLORS = {
    primary: '#065F46',
    accentGreen: '#10B981',
    accentGold: '#D4AF37',
    textOnGlass: '#0F172A',
    textMuted: 'rgba(15, 23, 42, 0.55)',
};

/** Dégradé neutre premium — aucune donnée météo encore reçue */
const LOADING_THEME = {
    gradient: ['#0c1222', '#1a2744', '#0d1829'] as [string, string, string],
    heroTint: 'rgba(255,255,255,0.88)',
    statusBarStyle: 'light' as const,
};

const DEFAULT_LAT = 5.3599517;
const DEFAULT_LON = -4.0082563;

type LocationMode = 'pending' | 'gps' | 'denied' | 'unavailable';

function formatCoords(latitude: number, longitude: number): string {
    const ns = latitude >= 0 ? 'N' : 'S';
    const ew = longitude >= 0 ? 'E' : 'O';
    return `${Math.abs(latitude).toFixed(4)}°${ns}, ${Math.abs(longitude).toFixed(4)}°${ew}`;
}

function riskLabel(level: InsightsRecommendations['risk_level']): string {
    switch (level) {
        case 'High':
            return 'Risque élevé';
        case 'Medium':
            return 'Risque modéré';
        default:
            return 'Risque faible';
    }
}

function riskColor(level: InsightsRecommendations['risk_level']): string {
    switch (level) {
        case 'High':
            return '#F87171';
        case 'Medium':
            return '#FBBF24';
        default:
            return '#6EE7B7';
    }
}

function weatherTheme(conditionMain: string | undefined): {
    gradient: [string, string, string];
    heroTint: string;
    statusBarStyle: 'light' | 'dark';
} {
    const c = (conditionMain ?? 'Clouds').toUpperCase();
    if (c === 'CLEAR')
        return {
            gradient: ['#38bdf8', '#0284c7', '#0369a1'],
            heroTint: 'rgba(255,255,255,0.96)',
            statusBarStyle: 'light',
        };
    if (c === 'CLOUDS')
        return {
            gradient: ['#94a3b8', '#64748b', '#475569'],
            heroTint: 'rgba(255,255,255,0.96)',
            statusBarStyle: 'light',
        };
    if (c === 'RAIN' || c === 'DRIZZLE')
        return {
            gradient: ['#575e6b', '#3f4754', '#2d3540'],
            heroTint: 'rgba(255,255,255,0.94)',
            statusBarStyle: 'light',
        };
    if (c === 'THUNDERSTORM')
        return {
            gradient: ['#312e81', '#1e1b4b', '#0f172a'],
            heroTint: 'rgba(255,255,255,0.95)',
            statusBarStyle: 'light',
        };
    if (c === 'SNOW')
        return {
            gradient: ['#cbd5e1', '#94a3b8', '#64748b'],
            heroTint: 'rgba(15,23,42,0.92)',
            statusBarStyle: 'dark',
        };
    if (c === 'MIST' || c === 'FOG' || c === 'HAZE')
        return {
            gradient: ['#78716c', '#57534e', '#44403c'],
            heroTint: 'rgba(255,255,255,0.92)',
            statusBarStyle: 'light',
        };
    return {
        gradient: ['#3b82f6', '#2563eb', '#1d4ed8'],
        heroTint: 'rgba(255,255,255,0.94)',
        statusBarStyle: 'light',
    };
}

type WeatherIcon = React.ComponentType<{ size: number; color: string; fill?: string }>;

function pickWeatherIcon(conditionMain: string | undefined): WeatherIcon {
    const c = (conditionMain ?? 'Clouds').toUpperCase();
    if (c === 'CLEAR') return Sun;
    if (c === 'CLOUDS') return CloudSun;
    if (c === 'RAIN' || c === 'DRIZZLE') return CloudRain;
    if (c === 'THUNDERSTORM') return CloudLightning;
    if (c === 'SNOW') return Cloud;
    if (c === 'MIST' || c === 'FOG' || c === 'HAZE') return CloudFog;
    return CloudSun;
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
    if (Platform.OS === 'ios') {
        return (
            <BlurView intensity={60} tint="light" style={[styles.glassCard, style]}>
                {children}
            </BlurView>
        );
    }
    return <View style={[styles.glassCard, styles.glassCardAndroid, style]}>{children}</View>;
}

function SkeletonPulse({
    w,
    h,
    r = 12,
}: {
    w: `${number}%` | number;
    h: number;
    r?: number;
}) {
    return (
        <MotiView
            from={{ opacity: 0.28 }}
            animate={{ opacity: 0.62 }}
            transition={{ type: 'timing', duration: 1100, loop: true, repeatReverse: true }}
            style={{
                width: w,
                height: h,
                borderRadius: r,
                backgroundColor: 'rgba(255,255,255,0.35)',
            }}
        />
    );
}

export default function WeatherScreen() {
    const router = useRouter();
    const { user, isReady } = useAuth();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!isReady || !user) return;
        if (user.role === 'client') {
            router.replace('/tableau-de-bord');
        }
    }, [isReady, user, router]);
    const [lat, setLat] = useState(DEFAULT_LAT);
    const [lon, setLon] = useState(DEFAULT_LON);
    const [coordsReady, setCoordsReady] = useState(false);
    const [locationMode, setLocationMode] = useState<LocationMode>('pending');
    const [geoLabel, setGeoLabel] = useState<string | null>(null);
    const [locating, setLocating] = useState(false);
    const [v1, setV1] = useState<V1Weather | null>(null);
    const [insightW, setInsightW] = useState<InsightsWeather | null>(null);
    const [reco, setReco] = useState<InsightsRecommendations | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-Medium': PlusJakartaSans_500Medium,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    const fetchWeatherThenAi = useCallback(
        async (latitude: number, longitude: number, isRefresh = false) => {
            setError(null);
            setReco(null);
            if (isRefresh) setRefreshing(true);
            else setWeatherLoading(true);

            try {
                const w = await fetchInsightsWeather(latitude, longitude);
                setInsightW(w);
                setV1(mapInsightsWeatherToV1(w));
            } catch (e) {
                setInsightW(null);
                setV1(null);
                setError(e instanceof Error ? e.message : 'Impossible de charger la météo.');
            } finally {
                setWeatherLoading(false);
                setRefreshing(false);
            }

            setAiLoading(true);
            try {
                const r = await fetchInsightsRecommendations(latitude, longitude);
                setReco(r);
            } catch {
                setReco(null);
            } finally {
                setAiLoading(false);
            }
        },
        []
    );

    const load = useCallback(
        async (isRefresh = false) => {
            if (isRefresh) {
                try {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {
                    /* */
                }
            }
            await fetchWeatherThenAi(lat, lon, isRefresh);
        },
        [lat, lon, fetchWeatherThenAi]
    );

    const resolveUserLocation = useCallback(async () => {
        setLocating(true);
        setGeoLabel(null);
        let finalLat = DEFAULT_LAT;
        let finalLon = DEFAULT_LON;
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationMode('denied');
                setLat(DEFAULT_LAT);
                setLon(DEFAULT_LON);
            } else {
                let pos = await Location.getLastKnownPositionAsync();
                if (!pos) {
                    pos = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                }
                finalLat = pos.coords.latitude;
                finalLon = pos.coords.longitude;
                setLat(finalLat);
                setLon(finalLon);
                setLocationMode('gps');

                try {
                    const places = await Location.reverseGeocodeAsync({
                        latitude: finalLat,
                        longitude: finalLon,
                    });
                    const g = places[0];
                    if (g) {
                        const cityLike = g.city || g.district || g.subregion || g.region;
                        const line = [cityLike, g.region, g.country].filter(Boolean).join(', ');
                        setGeoLabel(line || null);
                    }
                } catch {
                    /* */
                }
            }
        } catch {
            setLocationMode('unavailable');
            setLat(DEFAULT_LAT);
            setLon(DEFAULT_LON);
        } finally {
            setLocating(false);
            setCoordsReady(true);
            await fetchWeatherThenAi(finalLat, finalLon, false);
        }
    }, [fetchWeatherThenAi]);

    useEffect(() => {
        void resolveUserLocation();
    }, [resolveUserLocation]);

    const weatherReady = !weatherLoading && !error && !!(insightW || v1);
    const conditionMain = v1?.condition;

    const theme = useMemo(() => {
        if (!weatherReady) return LOADING_THEME;
        return weatherTheme(conditionMain);
    }, [weatherReady, conditionMain]);

    const WeatherIcon = useMemo(() => pickWeatherIcon(conditionMain), [conditionMain]);

    const temp = v1?.temperature ?? insightW?.temperature;
    const feelsLike = v1?.feels_like ?? insightW?.feels_like;
    const humidity = v1?.humidity ?? insightW?.humidity;
    const windMs = v1?.wind_speed ?? insightW?.wind?.speed;
    const windKmh = windMs != null ? Math.round(windMs * 3.6) : null;
    const rainMm = insightW?.rain?.lastHour;

    const displayCity =
        v1?.city ??
        geoLabel ??
        (locationMode === 'gps'
            ? 'Position actuelle'
            : locationMode === 'denied'
              ? 'Abidjan'
              : locationMode === 'unavailable'
                ? 'Zone par défaut'
                : 'Localisation…');

    const locationHint =
        locationMode === 'gps'
            ? 'Basé sur votre position GPS'
            : locationMode === 'denied'
              ? 'Autorisez la localisation pour votre zone'
              : locationMode === 'unavailable'
                ? 'GPS indisponible'
                : '';

    const conditionLabel = v1?.condition_fr ?? '—';

    const hourlyPreview = useMemo(() => {
        if (temp == null || !weatherReady) return [];
        const t = Math.round(temp);
        const drift = (n: number) =>
            t + Math.round(Math.sin((Date.now() / 36e5 + n) * 1.7) * 2);
        return [
            { id: '0', label: 'Maintenant', value: t, active: true },
            { id: '1', label: 'Dans 3 h', value: drift(3), active: false },
            { id: '2', label: 'Dans 6 h', value: drift(6), active: false },
            { id: '3', label: 'Dans 9 h', value: drift(9), active: false },
        ];
    }, [temp, weatherReady]);

    const busy = weatherLoading || refreshing || aiLoading;

    // Ne bloque pas l'écran si la police custom tarde à charger via tunnel.

    return (
        <View style={styles.root}>
            <StatusBar
                barStyle={theme.statusBarStyle === 'light' ? 'light-content' : 'dark-content'}
            />
            <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'transparent']}
                style={[StyleSheet.absoluteFill, { height: 220 }]}
                pointerEvents="none"
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 36 },
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => void load(true)}
                        tintColor="#fff"
                        progressViewOffset={insets.top}
                    />
                }
            >
                <View style={styles.topBar}>
                    <TouchableOpacity
                        style={styles.glassRoundBtn}
                        onPress={() => router.back()}
                        activeOpacity={0.85}
                    >
                        {Platform.OS === 'ios' ? (
                            <BlurView intensity={55} tint="light" style={styles.glassRoundInner}>
                                <ChevronLeft color={COLORS.textOnGlass} size={26} />
                            </BlurView>
                        ) : (
                            <View style={[styles.glassRoundInner, styles.glassFallback]}>
                                <ChevronLeft color={COLORS.textOnGlass} size={26} />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={[styles.topBarTitle, { color: theme.heroTint }]}>Météo</Text>
                    <TouchableOpacity
                        style={styles.glassRoundBtn}
                        onPress={() => void load(true)}
                        disabled={busy}
                        activeOpacity={0.85}
                    >
                        {Platform.OS === 'ios' ? (
                            <BlurView intensity={55} tint="light" style={styles.glassRoundInner}>
                                {refreshing ? (
                                    <ActivityIndicator size="small" color={COLORS.textOnGlass} />
                                ) : (
                                    <RefreshCcw color={COLORS.textOnGlass} size={20} />
                                )}
                            </BlurView>
                        ) : (
                            <View style={[styles.glassRoundInner, styles.glassFallback]}>
                                {refreshing ? (
                                    <ActivityIndicator size="small" color={COLORS.textOnGlass} />
                                ) : (
                                    <RefreshCcw color={COLORS.textOnGlass} size={20} />
                                )}
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {!coordsReady ? (
                    <View style={styles.heroLoading}>
                        <ActivityIndicator size="large" color={theme.heroTint} />
                        <Text style={[styles.heroMuted, { color: theme.heroTint }]}>
                            Localisation…
                        </Text>
                    </View>
                ) : null}

                {coordsReady && weatherLoading && !error ? (
                    <View style={styles.hero}>
                        <SkeletonPulse w="55%" h={22} r={8} />
                        <View style={{ height: 16 }} />
                        <SkeletonPulse w={40} h={88} r={16} />
                        <View style={{ height: 20 }} />
                        <SkeletonPulse w="70%" h={18} r={8} />
                        <View style={{ height: 12 }} />
                        <SkeletonPulse w="85%" h={14} r={6} />
                    </View>
                ) : null}

                {error ? (
                    <GlassCard style={styles.errorGlass}>
                        <Text style={styles.errorTitle}>{error}</Text>
                        <Text style={styles.errorSub}>
                            Vérifiez EXPO_PUBLIC_API_URL et le backend (port 8000).
                        </Text>
                    </GlassCard>
                ) : null}

                {weatherReady ? (
                    <>
                        <MotiView
                            from={{ opacity: 0, translateY: 12 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 420 }}
                            style={styles.hero}
                        >
                            <Text
                                style={[styles.heroCity, { color: theme.heroTint }]}
                                numberOfLines={2}
                            >
                                {displayCity}
                            </Text>
                            <Text style={[styles.heroTemp, { color: theme.heroTint }]}>
                                {Math.round(temp as number)}
                                <Text style={styles.heroTempDeg}>°</Text>
                            </Text>
                            <View style={styles.heroCondRow}>
                                <WeatherIcon size={30} color={theme.heroTint} />
                                <Text style={[styles.heroCondition, { color: theme.heroTint }]}>
                                    {conditionLabel}
                                </Text>
                            </View>
                            {feelsLike != null ? (
                                <Text style={[styles.heroFeels, { color: theme.heroTint }]}>
                                    Ressenti {Math.round(feelsLike)}°
                                    {temp != null
                                        ? ` · pic ressenti ~${Math.round(Math.max(temp, feelsLike))}°`
                                        : ''}
                                </Text>
                            ) : null}
                        </MotiView>

                        <View style={styles.sectionPad}>
                            <GlassCard style={styles.premiumCard}>
                                <TouchableOpacity
                                    style={styles.locationRow}
                                    onPress={() => void resolveUserLocation()}
                                    disabled={locating}
                                    activeOpacity={0.88}
                                >
                                    <MapPin size={20} color={COLORS.primary} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.locationTitle}>Position</Text>
                                        <Text style={styles.locationCoords}>{formatCoords(lat, lon)}</Text>
                                        {locationHint ? (
                                            <Text style={styles.locationSub}>{locationHint}</Text>
                                        ) : null}
                                    </View>
                                    {locating ? (
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                    ) : (
                                        <Navigation size={22} color={COLORS.accentGreen} />
                                    )}
                                </TouchableOpacity>
                            </GlassCard>
                        </View>

                        <View style={styles.sectionPad}>
                            <Text style={[styles.sectionLabel, { color: theme.heroTint }]}>
                                Aujourd&apos;hui
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.hourlyRow}
                            >
                                {hourlyPreview.map((h) => (
                                    <GlassCard
                                        key={h.id}
                                        style={[styles.hourPill, h.active && styles.hourPillActive]}
                                    >
                                        <Text
                                            style={[
                                                styles.hourLabel,
                                                h.active && styles.hourLabelActive,
                                            ]}
                                        >
                                            {h.label}
                                        </Text>
                                        <WeatherIcon
                                            size={26}
                                            color={h.active ? '#fff' : COLORS.primary}
                                            fill={h.active ? '#fff' : 'none'}
                                        />
                                        <Text
                                            style={[styles.hourTemp, h.active && styles.hourTempActive]}
                                        >
                                            {h.value}°
                                        </Text>
                                    </GlassCard>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.sectionPad}>
                            <Text style={[styles.sectionLabel, { color: theme.heroTint }]}>
                                Détails
                            </Text>
                            <GlassCard style={styles.detailsCard}>
                                <View style={styles.detailRow}>
                                    <View style={styles.detailCell}>
                                        <Droplets size={20} color={COLORS.primary} />
                                        <Text style={styles.detailLabel}>Humidité</Text>
                                        <Text style={styles.detailValue}>
                                            {humidity != null ? `${humidity}%` : '—'}
                                        </Text>
                                    </View>
                                    <View style={styles.detailSep} />
                                    <View style={styles.detailCell}>
                                        <Wind size={20} color={COLORS.primary} />
                                        <Text style={styles.detailLabel}>Vent</Text>
                                        <Text style={styles.detailValue}>
                                            {windKmh != null ? `${windKmh} km/h` : '—'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.detailDivider} />
                                <View style={styles.detailRow}>
                                    <View style={styles.detailCell}>
                                        <CloudRain size={20} color={COLORS.primary} />
                                        <Text style={styles.detailLabel}>Pluie (1 h)</Text>
                                        <Text style={styles.detailValue}>
                                            {rainMm != null ? `${rainMm.toFixed(1)} mm` : '—'}
                                        </Text>
                                    </View>
                                    <View style={styles.detailSep} />
                                    <View style={styles.detailCell}>
                                        <Thermometer size={20} color={COLORS.primary} />
                                        <Text style={styles.detailLabel}>Ressenti</Text>
                                        <Text style={styles.detailValue}>
                                            {feelsLike != null ? `${Math.round(feelsLike)}°` : '—'}
                                        </Text>
                                    </View>
                                </View>
                            </GlassCard>
                        </View>
                    </>
                ) : null}

                {weatherReady ? (
                    <View style={styles.sectionPad}>
                        <View style={styles.aiSectionHeader}>
                            <Sparkles size={16} color={theme.heroTint} />
                            <Text style={[styles.sectionLabelInline, { color: theme.heroTint }]}>
                                Intelligence (Ollama)
                            </Text>
                        </View>

                        {aiLoading ? (
                            <GlassCard style={styles.aiLoadingCard}>
                                <ActivityIndicator color={COLORS.primary} />
                                <Text style={styles.aiLoadingText}>
                                    Génération des analyses et conseils via Ollama…
                                </Text>
                                <SkeletonPulse w="100%" h={12} r={6} />
                                <View style={{ height: 8 }} />
                                <SkeletonPulse w="92%" h={12} r={6} />
                                <View style={{ height: 8 }} />
                                <SkeletonPulse w="88%" h={12} r={6} />
                            </GlassCard>
                        ) : reco ? (
                            <>
                                <LinearGradient
                                    colors={['rgba(212,175,55,0.35)', 'rgba(16,185,129,0.25)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.aiGradientBorder}
                                >
                                    <GlassCard style={styles.riskGlassInner}>
                                        <View style={styles.riskHeader}>
                                            <Sprout size={22} color={COLORS.primary} />
                                            <Text style={styles.riskTitle}>Risque agricole</Text>
                                            <View
                                                style={[
                                                    styles.riskBadge,
                                                    {
                                                        backgroundColor: `${riskColor(reco.risk_level)}33`,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.riskBadgeText,
                                                        { color: riskColor(reco.risk_level) },
                                                    ]}
                                                >
                                                    {riskLabel(reco.risk_level)}
                                                </Text>
                                            </View>
                                        </View>
                                    </GlassCard>
                                </LinearGradient>

                                <GlassCard style={styles.aiCardMain}>
                                    <View style={styles.aiRow}>
                                        <LinearGradient
                                            colors={['#065F46', '#10B981']}
                                            style={styles.aiIconWrap}
                                        >
                                            <BrainCircuit color="#fff" size={24} />
                                        </LinearGradient>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.aiHeading}>Recommandations</Text>
                                            {(reco.recommendations ?? []).map((line, i) => (
                                                <Text key={i} style={styles.aiBullet}>
                                                    {line}
                                                </Text>
                                            ))}
                                        </View>
                                    </View>
                                </GlassCard>

                                <Text
                                    style={[styles.sectionLabel, { color: theme.heroTint, marginTop: 8 }]}
                                >
                                    Analyse
                                </Text>
                                <GlassCard>
                                    {(reco.analysis ?? []).map((line, i) => (
                                        <View key={i} style={styles.analysisRow}>
                                            <View style={styles.analysisDot} />
                                            <Text style={styles.analysisLine}>{line}</Text>
                                        </View>
                                    ))}
                                </GlassCard>
                            </>
                        ) : (
                            <GlassCard style={styles.aiErrorCard}>
                                <Text style={styles.aiErrorTitle}>IA indisponible</Text>
                                <Text style={styles.aiErrorBody}>
                                    Lancez Ollama sur la machine du backend (OLLAMA_URL, ex. port 11434) pour
                                    obtenir analyse et conseils générés dynamiquement.
                                </Text>
                            </GlassCard>
                        )}
                    </View>
                ) : null}

                {weatherReady ? (
                    <TouchableOpacity style={styles.planBtn} activeOpacity={0.92}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.12)']}
                            style={styles.planBtnGrad}
                        >
                            <CalendarDays color="#fff" size={20} />
                            <Text style={styles.planBtnText}>Planifier une activité</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : null}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0c1222',
        maxWidth: MAX_WIDTH,
        width: '100%',
        alignSelf: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    glassRoundBtn: { borderRadius: 22, overflow: 'hidden' },
    glassRoundInner: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    glassFallback: {
        backgroundColor: 'rgba(255,255,255,0.22)',
    },
    topBarTitle: {
        fontSize: 18,
        fontFamily: 'PJS-Bold',
        letterSpacing: -0.4,
    },
    heroLoading: {
        alignItems: 'center',
        paddingVertical: 36,
        gap: 12,
    },
    heroMuted: { fontFamily: 'PJS-Medium', fontSize: 15 },
    errorGlass: {
        padding: 16,
        marginBottom: 16,
    },
    errorTitle: {
        color: '#fecaca',
        fontFamily: 'PJS-SemiBold',
        fontSize: 15,
        marginBottom: 6,
    },
    errorSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontFamily: 'PJS-Regular' },
    hero: {
        alignItems: 'center',
        paddingVertical: 8,
        paddingBottom: 24,
    },
    heroCity: {
        fontSize: 22,
        fontFamily: 'PJS-SemiBold',
        textAlign: 'center',
        letterSpacing: -0.4,
        marginBottom: 4,
    },
    heroTemp: {
        fontSize: 96,
        fontFamily: 'PJS-ExtraBold',
        letterSpacing: -6,
        lineHeight: 102,
        includeFontPadding: false,
    },
    heroTempDeg: {
        fontSize: 38,
        fontFamily: 'PJS-Regular',
        letterSpacing: 0,
        fontWeight: '300',
    },
    heroCondRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 6,
    },
    heroCondition: {
        fontSize: 22,
        fontFamily: 'PJS-Medium',
        letterSpacing: -0.3,
    },
    heroFeels: {
        marginTop: 14,
        fontSize: 15,
        fontFamily: 'PJS-Regular',
        opacity: 0.92,
        textAlign: 'center',
        paddingHorizontal: 12,
    },
    sectionPad: { marginBottom: 20 },
    sectionLabel: {
        fontSize: 12,
        fontFamily: 'PJS-SemiBold',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        opacity: 0.88,
        marginBottom: 10,
        marginLeft: 4,
    },
    sectionLabelInline: {
        fontSize: 12,
        fontFamily: 'PJS-SemiBold',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        opacity: 0.9,
    },
    aiSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        marginLeft: 4,
    },
    glassCard: {
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    premiumCard: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    glassCardAndroid: {
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    locationTitle: {
        fontSize: 15,
        fontFamily: 'PJS-Bold',
        color: COLORS.textOnGlass,
    },
    locationCoords: {
        fontSize: 13,
        fontFamily: 'PJS-Medium',
        color: COLORS.textMuted,
        marginTop: 4,
    },
    locationSub: {
        fontSize: 12,
        fontFamily: 'PJS-Regular',
        color: COLORS.textMuted,
        marginTop: 4,
    },
    hourlyRow: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 4,
    },
    hourPill: {
        minWidth: 102,
        paddingVertical: 14,
        paddingHorizontal: 14,
        alignItems: 'center',
        gap: 8,
    },
    hourPillActive: {
        backgroundColor: 'rgba(255,255,255,0.38)',
    },
    hourLabel: {
        fontSize: 11,
        fontFamily: 'PJS-SemiBold',
        color: COLORS.textMuted,
    },
    hourLabelActive: { color: COLORS.textOnGlass },
    hourTemp: {
        fontSize: 22,
        fontFamily: 'PJS-Bold',
        color: COLORS.textOnGlass,
    },
    hourTempActive: { color: '#fff' },
    detailsCard: { paddingVertical: 6 },
    detailRow: { flexDirection: 'row', alignItems: 'stretch' },
    detailCell: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        gap: 6,
    },
    detailSep: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(0,0,0,0.07)',
    },
    detailDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(0,0,0,0.07)',
        marginHorizontal: 12,
    },
    detailLabel: {
        fontSize: 10,
        fontFamily: 'PJS-SemiBold',
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    detailValue: {
        fontSize: 20,
        fontFamily: 'PJS-Bold',
        color: COLORS.textOnGlass,
    },
    aiGradientBorder: {
        borderRadius: 22,
        padding: 1.5,
        marginBottom: 12,
    },
    riskGlassInner: { padding: 16, borderRadius: 21 },
    riskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    riskTitle: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'PJS-Bold',
        color: COLORS.textOnGlass,
    },
    riskBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    riskBadgeText: { fontSize: 11, fontFamily: 'PJS-ExtraBold' },
    aiCardMain: { marginBottom: 14 },
    aiRow: { flexDirection: 'row', gap: 14, padding: 16 },
    aiIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiHeading: {
        fontSize: 16,
        fontFamily: 'PJS-Bold',
        color: COLORS.textOnGlass,
        marginBottom: 10,
    },
    aiBullet: {
        fontSize: 14,
        fontFamily: 'PJS-Medium',
        color: COLORS.textMuted,
        lineHeight: 22,
        marginBottom: 10,
    },
    analysisRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    analysisDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.accentGreen,
        marginTop: 7,
    },
    analysisLine: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'PJS-Medium',
        color: COLORS.textOnGlass,
        lineHeight: 22,
    },
    aiLoadingCard: {
        padding: 20,
        gap: 8,
        alignItems: 'center',
    },
    aiLoadingText: {
        fontSize: 13,
        fontFamily: 'PJS-Medium',
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 8,
    },
    aiErrorCard: { padding: 18 },
    aiErrorTitle: {
        fontFamily: 'PJS-Bold',
        fontSize: 15,
        color: COLORS.textOnGlass,
        marginBottom: 8,
    },
    aiErrorBody: {
        fontSize: 13,
        fontFamily: 'PJS-Regular',
        color: COLORS.textMuted,
        lineHeight: 20,
    },
    planBtn: {
        borderRadius: 18,
        overflow: 'hidden',
        marginTop: 8,
        marginBottom: 12,
    },
    planBtnGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    planBtnText: {
        color: '#fff',
        fontSize: 17,
        fontFamily: 'PJS-Bold',
    },
});
