import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { useAuth } from '@/contexts/AuthContext';
import { clearCartStorage } from '@/lib/cartStorage';
import { isClientBuyer } from '@/lib/userDisplay';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  BackHandler,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_RESERVE = 88;

const MAX_WIDTH = 500;

export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ totalLabel?: string | string[]; orderId?: string | string[] }>();
  const { user } = useAuth();
  const showBuyerHistory = isClientBuyer(user);
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomBarOffset = TAB_BAR_RESERVE + Math.max(insets.bottom, 8);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH, MAX_WIDTH);

  const paidAtLabel = useMemo(
    () =>
      new Date().toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    []
  );

  const amountLabel = (() => {
    const v = params.totalLabel;
    const s = Array.isArray(v) ? v[0] : v;
    return s?.trim() || '—';
  })();
  const transactionRef = useMemo(() => {
    const raw = params.orderId;
    const id = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (id && id.length >= 8) return `#AG-${id.slice(0, 8).toUpperCase()}`;
    const t = Date.now().toString(36).toUpperCase();
    return `#AG-${t.slice(-8)}`;
  }, [params.orderId]);

  // THÈME DYNAMIQUE
  const COLORS = {
    primary: '#10B981', 
    secondary: '#34D399',
    accent: '#2DD4BF', 
    background: isDark ? '#020617' : '#FFFFFF',
    surface: isDark ? '#1E293B' : '#F8FAFC',
    text: isDark ? '#F8FAFC' : '#1E293B',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    border: isDark ? '#334155' : '#F1F5F9',
    outerBg: isDark ? '#000000' : '#E2E8F0',
    card: isDark ? '#1E293B' : '#FFFFFF',
    badgeBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
  };

  // Chargement de la police
  let [fontsLoaded] = useFonts({
      'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
      'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
      'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    void clearCartStorage();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        router.replace('/marche');
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [router])
  );

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.outerContainer, { backgroundColor: COLORS.outerBg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: COLORS.background }]}>
        <SafeAreaView style={styles.flex}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollRoot, { paddingBottom: bottomBarOffset + 8 }]}
            keyboardShouldPersistTaps="handled"
          >
          {/* --- HEADER --- */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace('/marche')} style={[styles.closeBtn, { backgroundColor: COLORS.surface }]}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: COLORS.textMuted }]}>DÉTAILS DE LA TRANSACTION</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.content}>
            {/* --- SUCCESS ICON --- */}
            <View style={styles.successIconWrapper}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.successIconCircle}
              >
                <Ionicons name="checkmark" size={42} color="white" />
              </LinearGradient>
            </View>

            {/* --- TITLE & MESSAGE --- */}
            <Text style={[styles.title, { color: COLORS.text }]}>Paiement Réussi !</Text>
            <Text style={[styles.subTitle, { color: COLORS.textMuted }]}>
              Votre commande a été validée. AgroConnect Africa prépare vos produits pour une livraison rapide.
            </Text>

            {/* --- TRANSACTION CARD (Bento Style) --- */}
            <View style={[styles.transactionCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
              <Text style={[styles.investLabel, { color: COLORS.primary }]}>MONTANT TOTAL PAYÉ</Text>
              <Text style={[styles.investAmount, { color: COLORS.text }]}>{amountLabel}</Text>
              
              <View style={[styles.detailsList, { borderTopColor: COLORS.border }]}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: COLORS.textMuted }]}>ID Transaction</Text>
                  <View style={styles.idValueRow}>
                    <Text style={[styles.detailValueBold, { color: COLORS.text }]}>{transactionRef}</Text>
                    <Feather name="copy" size={14} color={COLORS.textMuted} style={{ marginLeft: 6 }} />
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: COLORS.textMuted }]}>Date</Text>
                  <Text style={[styles.detailValue, { color: COLORS.text }]}>{paidAtLabel}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: COLORS.textMuted }]}>Type d'achat</Text>
                  <View style={styles.assetRow}>
                    <View style={[styles.assetDot, { backgroundColor: COLORS.primary }]} />
                    <Text style={[styles.detailValue, { color: COLORS.text }]}>Produits & Intrants</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* --- ILLUSTRATION --- */}
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2329/2329532.png' }} 
              style={[styles.illustration, { tintColor: isDark ? COLORS.primary : undefined }]}
              resizeMode="contain"
            />
          </View>

          {/* --- FOOTER ACTIONS --- */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.btnShadow, { shadowColor: COLORS.primary }]}
              onPress={() => router.replace('/marche')}
            >
              <LinearGradient
                colors={['#42E695', '#3BB2B8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <MaterialCommunityIcons name="storefront" size={20} color="white" />
                <Text style={styles.primaryBtnText}>Continuer vers le marketplace</Text>
              </LinearGradient>
            </TouchableOpacity>

            {showBuyerHistory ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.secondaryBtn, { borderColor: COLORS.border }]}
                onPress={() => router.replace('/marche/historique-transactions')}
              >
                <MaterialCommunityIcons name="history" size={20} color={COLORS.text} />
                <Text style={[styles.secondaryBtnText, { color: COLORS.text }]}>
                  Voir l&apos;historique des commandes
                </Text>
              </TouchableOpacity>
            ) : null}

            <View style={[styles.securityBadge, { backgroundColor: COLORS.badgeBg, borderColor: isDark ? COLORS.border : '#D1FAE5' }]}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
              <Text style={[styles.securityText, { color: COLORS.primary }]}>Sécurisé par AgroConnect Africa AI Guardian</Text>
            </View>
          </View>
          </ScrollView>

        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  outerContainer: { flex: 1, alignItems: 'center' },
  innerContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 11, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: 1.5 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  
  content: { alignItems: 'center', paddingHorizontal: 30 },
  successIconWrapper: { marginTop: 10, marginBottom: 20 },
  successIconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 10,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 }
  },
  title: { fontSize: 28, fontFamily: 'SpaceGrotesk-Bold', marginBottom: 10, letterSpacing: -0.5 },
  subTitle: { fontSize: 14, fontFamily: 'SpaceGrotesk-Regular', textAlign: 'center', lineHeight: 20 },

  transactionCard: {
    width: '100%',
    borderRadius: 24,
    padding: 22,
    marginTop: 30,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 15,
  },
  investLabel: { fontSize: 10, fontFamily: 'SpaceGrotesk-Bold', textAlign: 'center', letterSpacing: 1.5 },
  investAmount: { fontSize: 38, fontFamily: 'SpaceGrotesk-Bold', textAlign: 'center', marginTop: 5, letterSpacing: -1.5 },
  detailsList: { marginTop: 20, borderTopWidth: 1, paddingTop: 15 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { fontSize: 13, fontFamily: 'SpaceGrotesk-Medium' },
  detailValue: { fontSize: 13, fontFamily: 'SpaceGrotesk-Bold' },
  detailValueBold: { fontSize: 13, fontFamily: 'SpaceGrotesk-Bold' },
  idValueRow: { flexDirection: 'row', alignItems: 'center' },
  assetRow: { flexDirection: 'row', alignItems: 'center' },
  assetDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },

  illustration: { width: 140, height: 100, marginTop: 20, opacity: 0.5 },

  scrollRoot: { flexGrow: 1 },
  footer: { padding: 25, paddingTop: 8 },
  btnShadow: { elevation: 8, shadowOpacity: 0.2, shadowRadius: 10 },
  primaryBtn: { 
    height: 60, 
    borderRadius: 20, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 10
  },
  primaryBtnText: { color: 'white', fontSize: 16, fontFamily: 'SpaceGrotesk-Bold' },
  secondaryBtn: { 
    height: 60, 
    borderRadius: 20, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    marginTop: 15
  },
  secondaryBtnText: { fontSize: 16, fontFamily: 'SpaceGrotesk-Bold' },
  securityBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
  },
  securityText: { fontSize: 11, marginLeft: 8, fontFamily: 'SpaceGrotesk-Bold' },
});