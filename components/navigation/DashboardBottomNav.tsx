import { useAuth } from '@/contexts/AuthContext';
import { scrollDashboardHomeToTop } from '@/lib/dashboardHomeScroll';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
    primary: '#065F46',
    accent: '#10B981',
    textMuted: '#64748B',
    border: '#F1F5F9',
};

type NavTab = 'home' | 'maps' | 'scan' | 'shop' | 'messages' | 'profil';

function useActiveNavTab(): NavTab | null {
    const pathname = usePathname();
    return useMemo(() => {
        if (!pathname) return null;
        const p = pathname.replace(/\/$/, '');
        if (p.includes('/tableau-de-bord/maps')) return 'maps';
        if (p.includes('/tableau-de-bord/scan')) return 'scan';
        if (p.includes('/tableau-de-bord/profil')) return 'profil';
        if (p.includes('/tableau-de-bord/messagerie')) return 'messages';
        if (p.includes('/marche')) return 'shop';
        if (p.includes('/tableau-de-bord/ajouter')) return null;
        const noTrail = p.replace(/\/$/, '');
        if (/\/tableau-de-bord$/.test(noTrail) && !noTrail.includes('/tableau-de-bord/')) return 'home';
        return null;
    }, [pathname]);
}

/** Écrans plein écran (saisie clavier en bas) : la barre flottante masquerait le champ. */
function useHideBottomNavForRoute(): boolean {
    const pathname = usePathname();
    return useMemo(() => {
        if (!pathname) return false;
        const p = pathname.replace(/\/$/, '');
        return (
            p.includes('/tableau-de-bord/assistant') ||
            p.includes('/marche/message') ||
            p.includes('/tableau-de-bord/expert-chat') ||
            p.includes('/marche/suivi-livraison')
        );
    }, [pathname]);
}

export function DashboardBottomNav() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const isClientBuyer = user?.role === 'client';
    const active = useActiveNavTab();
    const hideForRoute = useHideBottomNavForRoute();

    const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 6);

    if (hideForRoute) {
        return null;
    }

    return (
        <View
            style={[styles.navWrapper, { paddingBottom: bottomPad }]}
            pointerEvents="box-none"
        >
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => {
                        if (active === 'home') {
                            scrollDashboardHomeToTop();
                            return;
                        }
                        router.push('/tableau-de-bord');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Accueil"
                >
                    <Ionicons
                        name={active === 'home' ? 'home' : 'home-outline'}
                        size={24}
                        color={active === 'home' ? COLORS.accent : COLORS.textMuted}
                    />
                    <Text style={[styles.navText, active === 'home' && styles.navTextActive]}>Accueil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => router.push('/tableau-de-bord/maps')}
                    accessibilityRole="button"
                    accessibilityLabel="Maps"
                >
                    <Ionicons
                        name={active === 'maps' ? 'map' : 'map-outline'}
                        size={24}
                        color={active === 'maps' ? COLORS.accent : COLORS.textMuted}
                    />
                    <Text style={[styles.navText, active === 'maps' && styles.navTextActive]}>Maps</Text>
                </TouchableOpacity>

                <View style={styles.fabWrap}>
                    <TouchableOpacity
                        style={styles.fabTouchable}
                        onPress={() =>
                            isClientBuyer
                                ? router.push('/marche')
                                : router.push('/tableau-de-bord/ajouter')
                        }
                        accessibilityRole="button"
                        accessibilityLabel={isClientBuyer ? 'Marché' : 'Ajouter'}
                        activeOpacity={0.88}
                    >
                        <LinearGradient colors={[COLORS.accent, '#065F46']} style={styles.fabLinear}>
                            <Ionicons
                                name={isClientBuyer ? 'storefront' : 'add'}
                                size={isClientBuyer ? 28 : 32}
                                color="white"
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() =>
                        isClientBuyer
                            ? router.push('/tableau-de-bord/messagerie')
                            : router.push('/tableau-de-bord/scan')
                    }
                    accessibilityRole="button"
                    accessibilityLabel={isClientBuyer ? 'Messages' : 'Scan IA'}
                >
                    <Ionicons
                        name={
                            isClientBuyer
                                ? active === 'messages'
                                    ? 'chatbubbles'
                                    : 'chatbubbles-outline'
                                : active === 'scan'
                                  ? 'scan'
                                  : 'scan-outline'
                        }
                        size={24}
                        color={
                            (isClientBuyer ? active === 'messages' : active === 'scan')
                                ? COLORS.accent
                                : COLORS.textMuted
                        }
                    />
                    <Text
                        style={[
                            styles.navText,
                            (isClientBuyer ? active === 'messages' : active === 'scan') &&
                                styles.navTextActive,
                        ]}
                    >
                        {isClientBuyer ? 'Messages' : 'Scan IA'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => router.push('/tableau-de-bord/profil')}
                    accessibilityRole="button"
                    accessibilityLabel="Profil"
                >
                    <Ionicons
                        name={active === 'profil' ? 'person' : 'person-outline'}
                        size={24}
                        color={active === 'profil' ? COLORS.accent : COLORS.textMuted}
                    />
                    <Text style={[styles.navText, active === 'profil' && styles.navTextActive]}>Profil</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    navWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        zIndex: 9999,
        elevation: 24,
        overflow: 'visible',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 10,
        minHeight: 72,
        overflow: 'visible',
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        flex: 1,
        paddingBottom: 4,
        minHeight: 52,
    },
    navText: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
        color: COLORS.textMuted,
    },
    navTextActive: {
        color: COLORS.primary,
    },
    fabWrap: {
        width: 72,
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'visible',
    },
    fabTouchable: {
        marginTop: -22,
        borderRadius: 22,
        overflow: 'visible',
        zIndex: 10000,
        elevation: 28,
    },
    fabLinear: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
