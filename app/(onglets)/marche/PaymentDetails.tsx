import { useAuth } from '@/contexts/AuthContext';
import { navigateToCheckoutSuccess } from '@/lib/checkoutNavigation';
import {
  clearCartStorage,
  computeCartTotalEuros,
  loadCartFromStorage,
  type PersistedCartLine,
} from '@/lib/cartStorage';
import {
  isOfflineDevToken,
  placeMarketplaceOrder,
  placeServiceReservation,
} from '@/lib/agroconnectApi';
import { isClientBuyer } from '@/lib/userDisplay';
import { appendStoredBuyerTransaction } from '@/lib/localTransactionHistory';
import { loadSavedPaymentHints, saveSavedPaymentHints } from '@/lib/savedPaymentHints';
import { useFocusEffect } from '@react-navigation/native';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_RESERVE = 88;

const MAX_WIDTH = 500;

function pickRouteParam(v: string | string[] | undefined): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return '';
}

function isMarketplaceProductId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
}

export default function PaymentDetailsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    reservation?: string;
    reservationTitle?: string;
    reservationTotalCents?: string;
  }>();
  const isReservation = params.reservation === '1';
  const reservationTitle = useMemo(
    () => pickRouteParam(params.reservationTitle),
    [params.reservationTitle]
  );
  const reservationTotalCentsParsed = useMemo(() => {
    const raw = pickRouteParam(params.reservationTotalCents);
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
    return 150_000 * 100;
  }, [params.reservationTotalCents]);
  const { token, user, isReady } = useAuth();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomBarOffset = TAB_BAR_RESERVE + Math.max(insets.bottom, 8);

  const CONTAINER_WIDTH = useMemo(() => Math.min(SCREEN_WIDTH, MAX_WIDTH), [SCREEN_WIDTH]);

  // THÈME CLAIR FIXÉ (Mode sombre désactivé)
  const COLORS = {
    primary: '#065F46', 
    primaryDark: '#044231',
    accent: '#10B981',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#F1F5F9',
    outerBg: '#F1F5F9',
    inputBg: '#F8FAFC',
  };

  // Chargement de la police
  let [fontsLoaded] = useFonts({
      'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
      'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
      'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
  });

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rememberCard, setRememberCard] = useState(true);
  const [savedLast4Hint, setSavedLast4Hint] = useState<string | null>(null);
  const [cartLines, setCartLines] = useState<PersistedCartLine[] | null>(null);

  const totalFormatted = useMemo(() => {
    if (isReservation) {
      const major = reservationTotalCentsParsed / 100;
      return `${major.toLocaleString('fr-FR')} CFA`;
    }
    const euros = computeCartTotalEuros(cartLines ?? []);
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(euros);
  }, [isReservation, reservationTotalCentsParsed, cartLines]);

  useFocusEffect(
    useCallback(() => {
      void loadCartFromStorage().then((stored) => {
        setCartLines(stored ?? []);
      });
    }, [])
  );

  useEffect(() => {
    void loadSavedPaymentHints().then((h) => {
      if (!h) return;
      if (h.cardHolder) setCardName(h.cardHolder);
      if (h.expiry) setExpiry(h.expiry);
      if (h.cardLast4.length === 4) setSavedLast4Hint(h.cardLast4);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      if (user && !isClientBuyer(user)) {
        router.replace('/marche');
      }
    }, [isReady, user, router])
  );

  const handlePayment = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (isReservation) {
        const createdAt = new Date().toISOString();
        const totalCents = reservationTotalCentsParsed;
        const major = totalCents / 100;
        const totalLabel = `${major.toLocaleString('fr-FR')} CFA`;
        let serverReservationId: string | undefined;
        if (token && !isOfflineDevToken(token)) {
          try {
            const r = await placeServiceReservation(token, {
              title: `Réservation · ${reservationTitle.trim() || 'Terrain / service'}`,
              total_cents: totalCents,
              currency: 'XOF',
              notes: '',
            });
            serverReservationId = r.id;
          } catch (e) {
            Alert.alert(
              'Réservation',
              e instanceof Error ? e.message : String(e)
            );
            setSubmitting(false);
            return;
          }
        }
        try {
          await appendStoredBuyerTransaction({
            kind: 'reservation',
            server_order_id: serverReservationId,
            created_at: createdAt,
            total_cents: totalCents,
            currency: 'XOF',
            amount_label: totalLabel,
            status: 'paid',
            lines: [
              {
                product_id: 'reservation',
                product_title: `Réservation · ${reservationTitle.trim() || 'Terrain / service'}`,
                seller_name: 'AgroConnect Africa',
                quantity: 1,
                unit_price_cents: totalCents,
                line_total_cents: totalCents,
              },
            ],
          });
        } catch {
          /* AsyncStorage */
        }
        await clearCartStorage();
        setCartLines([]);
        if (rememberCard) {
          const digits = cardNumber.replace(/\D/g, '');
          const last4 = digits.slice(-4);
          if (last4.length === 4 && cardName.trim()) {
            try {
              await saveSavedPaymentHints({
                cardHolder: cardName.trim(),
                cardLast4: last4,
                expiry: expiry.trim(),
              });
            } catch {
              /* SecureStore indisponible */
            }
          }
        }
        navigateToCheckoutSuccess({ totalLabel, orderId: serverReservationId });
        return;
      }

      const stored = await loadCartFromStorage();
      const apiLines =
        stored?.filter((l) => isMarketplaceProductId(l.id)).map((l) => ({
          product_id: l.id,
          quantity: Math.max(1, Math.floor(l.qty)),
        })) ?? [];

      let totalLabel = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(computeCartTotalEuros(stored ?? []));
      let orderId: string | undefined;
      let orderRes: Awaited<ReturnType<typeof placeMarketplaceOrder>> | undefined;

      if (apiLines.length > 0) {
        if (!token || token === 'dev-token') {
          Alert.alert(
            'Connexion',
            'Connectez-vous pour enregistrer la commande sur le serveur.'
          );
          setSubmitting(false);
          return;
        }
        orderRes = await placeMarketplaceOrder(token, apiLines);
        totalLabel = new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(orderRes.total_cents / 100);
        orderId = orderRes.id;
      }

      /** Miroir local des commandes serveur (historique unifié + secours hors ligne). */
      if (orderRes && stored && stored.length > 0) {
        try {
          await appendStoredBuyerTransaction({
            kind: 'marketplace',
            server_order_id: orderRes.id,
            created_at: new Date().toISOString(),
            total_cents: orderRes.total_cents,
            currency: orderRes.currency,
            amount_label: totalLabel,
            status: orderRes.status,
            lines: stored.map((l) => {
              const qty = Math.max(1, Math.floor(l.qty));
              const unit_cents = Math.round(l.price * 100);
              return {
                product_id: l.id,
                product_title: l.name,
                seller_name: '—',
                quantity: qty,
                unit_price_cents: unit_cents,
                line_total_cents: unit_cents * qty,
              };
            }),
          });
        } catch {
          /* AsyncStorage */
        }
      }

      /** Historique local : panier démo sans UUID produit (pas monté en commande serveur). */
      if (stored && stored.length > 0 && !orderId) {
        const createdAt = new Date().toISOString();
        const lineRows = stored.map((l) => {
          const qty = Math.max(1, Math.floor(l.qty));
          const unit_cents = Math.round(l.price * 100);
          return {
            product_id: l.id,
            product_title: l.name,
            seller_name: '—',
            quantity: qty,
            unit_price_cents: unit_cents,
            line_total_cents: unit_cents * qty,
          };
        });
        const totalCents = Math.round(computeCartTotalEuros(stored) * 100);
        try {
          await appendStoredBuyerTransaction({
            created_at: createdAt,
            total_cents: totalCents,
            currency: 'EUR',
            amount_label: totalLabel,
            status: 'paid',
            lines: lineRows,
          });
        } catch {
          /* AsyncStorage */
        }
      }

      await clearCartStorage();
      setCartLines([]);

      if (rememberCard) {
        const digits = cardNumber.replace(/\D/g, '');
        const last4 = digits.slice(-4);
        if (last4.length === 4 && cardName.trim()) {
          try {
            await saveSavedPaymentHints({
              cardHolder: cardName.trim(),
              cardLast4: last4,
              expiry: expiry.trim(),
            });
          } catch {
            /* SecureStore indisponible */
          }
        }
      }
      navigateToCheckoutSuccess({ totalLabel, orderId });
    } catch (e) {
      Alert.alert('Commande', e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    token,
    rememberCard,
    cardNumber,
    cardName,
    expiry,
    isReservation,
    reservationTitle,
    reservationTotalCentsParsed,
  ]);

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.outerContainer, { backgroundColor: COLORS.outerBg }]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.innerContainer, { width: CONTAINER_WIDTH, backgroundColor: COLORS.background }]}>
        <SafeAreaView style={styles.flex}>
          
          {/* --- HEADER --- */}
          <View style={[styles.header, { backgroundColor: COLORS.background }]}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: COLORS.text }]}>Détails de paiement</Text>
            <View style={{ width: 45 }} />
          </View>

          {/* --- STEPPER (6/6) --- */}
          <View style={[styles.stepperContainer, { backgroundColor: COLORS.background }]}>
              {[1, 2, 3, 4, 5, 6].map((dot) => (
                  <View 
                      key={dot} 
                      style={[
                        styles.stepDot, 
                        { backgroundColor: '#E2E8F0' },
                        dot === 6 ? [styles.stepDotActive, { backgroundColor: COLORS.primary }] : null
                      ]} 
                  />
              ))}
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              
              {/* --- VIRTUAL CARTE PREVIEW (Dégradé Signature) --- */}
              <LinearGradient
                colors={['#064E3B', '#10B981', '#34D399']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.virtualCard}
              >
                <View style={styles.cardTopRow}>
                  <View>
                    <Text style={styles.cardBrandLabel}>AGROCONNECT AFRICA</Text>
                    <Text style={styles.cardTierLabel}>Premium Farmer Portal</Text>
                  </View>
                  <MaterialCommunityIcons name="contactless-payment" size={32} color="white" style={{ opacity: 0.8 }} />
                </View>

                <View style={styles.cardMiddleRow}>
                  <Text style={styles.cardLabel}>NUMÉRO DE CARTE</Text>
                  <Text style={styles.cardNumberText}>
                    {cardNumber ? cardNumber.replace(/\d{4}(?=.)/g, '$&  ') : '••••  ••••  ••••  ••••'}
                  </Text>
                </View>

                <View style={styles.cardBottomRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardLabel}>TITULAIRE</Text>
                    <Text style={styles.cardValueText}>{cardName.toUpperCase() || 'NOM PRÉNOM'}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardLabel}>EXPIRATION</Text>
                    <Text style={styles.cardValueText}>{expiry || 'MM/YY'}</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* --- FORMULAIRE --- */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.inputLabel, { color: COLORS.text }]}>NUMÉRO DE CARTE</Text>
                    <MaterialCommunityIcons name="credit-card" size={18} color={COLORS.textMuted} />
                  </View>
                  <TextInput
                    style={[styles.input, { backgroundColor: COLORS.inputBg, color: COLORS.text, borderColor: COLORS.border }]}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    maxLength={16}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: COLORS.text }]}>NOM SUR LA CARTE</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: COLORS.inputBg, color: COLORS.text, borderColor: COLORS.border }]}
                    placeholder="Jean Dupont"
                    placeholderTextColor={COLORS.textMuted}
                    value={cardName}
                    onChangeText={setCardName}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={[styles.inputLabel, { color: COLORS.text }]}>DATE D'EXPIRATION</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: COLORS.inputBg, color: COLORS.text, borderColor: COLORS.border }]}
                      placeholder="MM/YY"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      maxLength={5}
                      value={expiry}
                      onChangeText={setExpiry}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                    <Text style={[styles.inputLabel, { color: COLORS.text }]}>CVV</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: COLORS.inputBg, color: COLORS.text, borderColor: COLORS.border }]}
                      placeholder="123"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={3}
                      value={cvv}
                      onChangeText={setCvv}
                    />
                  </View>
                </View>

                <View style={[styles.securityNotice, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
                  <Text style={[styles.securityText, { color: '#065F46' }]}>Paiement sécurisé crypté PCI-DSS</Text>
                </View>
                {savedLast4Hint ? (
                  <Text style={[styles.savedHint, { color: COLORS.textMuted }]}>
                    Carte mémorisée (4 derniers chiffres) : •••• {savedLast4Hint} — saisissez le numéro complet à chaque paiement.
                  </Text>
                ) : null}
                <View style={styles.rememberRow}>
                  <Text style={[styles.rememberLabel, { color: COLORS.text }]}>
                    Mémoriser titulaire, 4 derniers chiffres et date (appareil)
                  </Text>
                  <Switch
                    value={rememberCard}
                    onValueChange={setRememberCard}
                    trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                    thumbColor={rememberCard ? COLORS.primary : '#f4f4f5'}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* --- FOOTER --- */}
          <View
            style={[
              styles.footer,
              { backgroundColor: COLORS.background, borderTopColor: COLORS.border, paddingBottom: 20 + bottomBarOffset },
            ]}
          >
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: COLORS.textMuted }]}>
                {isReservation ? 'Total de la réservation' : 'Total de la commande'}
              </Text>
              <Text style={[styles.totalValue, { color: COLORS.primary }]}>{totalFormatted}</Text>
            </View>
            
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void handlePayment()}
              disabled={submitting}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.payButton, submitting && { opacity: 0.85 }]}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.payButtonText}>Payer maintenant</Text>
                    <Ionicons name="lock-closed" size={20} color="white" style={{ marginLeft: 10 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  outerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  innerContainer: { flex: 1, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: -0.5 },
  headerBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  stepperContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingBottom: 10 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepDotActive: { width: 25 },
  scrollContent: { padding: 25, paddingBottom: 32 },
  virtualCard: {
    height: 200,
    borderRadius: 24,
    padding: 25,
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#065F46',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardBrandLabel: { color: 'white', fontSize: 12, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: 1.5 },
  cardTierLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'SpaceGrotesk-Medium', marginTop: 2 },
  cardMiddleRow: { marginVertical: 25 },
  cardLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: 1.2 },
  cardNumberText: { color: 'white', fontSize: 20, fontFamily: 'SpaceGrotesk-Bold', marginTop: 5, letterSpacing: 3 },
  cardBottomRow: { flexDirection: 'row', alignItems: 'flex-end' },
  cardValueText: { color: 'white', fontSize: 13, fontFamily: 'SpaceGrotesk-Bold', marginTop: 4, letterSpacing: 0.5 },
  form: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 11, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: 1 },
  input: {
    height: 55,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 15,
    fontFamily: 'SpaceGrotesk-Medium',
    borderWidth: 1,
  },
  row: { flexDirection: 'row' },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  securityText: { fontSize: 12, marginLeft: 8, fontFamily: 'SpaceGrotesk-Bold' },
  savedHint: { fontSize: 11, fontFamily: 'SpaceGrotesk-Medium', marginTop: 10, lineHeight: 16 },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingVertical: 8,
  },
  rememberLabel: { fontSize: 13, fontFamily: 'SpaceGrotesk-Bold', flex: 1, marginRight: 12 },
  footer: {
    padding: 25,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: { fontSize: 14, fontFamily: 'SpaceGrotesk-Medium' },
  totalValue: { fontSize: 22, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: -1 },
  payButton: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#065F46',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  payButtonText: { color: 'white', fontSize: 17, fontFamily: 'SpaceGrotesk-Bold' }
});