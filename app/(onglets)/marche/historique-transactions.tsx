import { useAuth } from '@/contexts/AuthContext';
import {
    fetchMyMarketplaceOrdersDetailed,
    fetchMySellerSales,
    fetchMyServiceReservations,
    type MarketplaceOrderDetail,
    type MarketplaceOrderRow,
    type ServiceReservationOut,
} from '@/lib/agroconnectApi';
import {
    loadStoredBuyerTransactions,
    mergeBuyerOrdersWithLocal,
    reservationOrderIdsFromStored,
    storedToOrderDetail,
} from '@/lib/localTransactionHistory';
import { isClientBuyer } from '@/lib/userDisplay';
import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Truck } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_WIDTH = 480;
const GREEN_PRIMARY = '#065F46';
const TAB_BAR_RESERVE = 88;

type TxRow = {
    id: string;
    ref: string;
    label: string;
    date: string;
    amount: string;
    status: 'Payé' | 'En cours' | 'Remboursé';
};

/** Démo vendeur (sans token réel). */
const MOCK_SALES: TxRow[] = [
    {
        id: 's1',
        ref: '#VENTE-A1B2',
        label: 'Vente · 2 lignes (vos produits)',
        date: '12 avr. 2026 · 10:20',
        amount: '142 000 XOF',
        status: 'En cours',
    },
    {
        id: 's2',
        ref: '#VENTE-C3D4',
        label: 'Vente · 1 ligne',
        date: '05 avr. 2026 · 16:05',
        amount: '89 500 XOF',
        status: 'Payé',
    },
];

const MOCK_TX: TxRow[] = [
    {
        id: '1',
        ref: '#AG-98234-TX',
        label: 'Marketplace — commande intrants',
        date: '10 avr. 2026 · 14:32',
        amount: '235,50 €',
        status: 'Payé',
    },
    {
        id: '2',
        ref: '#AG-88102-TX',
        label: 'Semences certifiées',
        date: '02 avr. 2026 · 09:15',
        amount: '89,00 €',
        status: 'Payé',
    },
    {
        id: '3',
        ref: '#AG-77001-TX',
        label: 'Location matériel',
        date: '28 mars 2026 · 16:40',
        amount: '420,00 €',
        status: 'En cours',
    },
    {
        id: '4',
        ref: '#AG-66120-TX',
        label: 'Récoltes — avocats',
        date: '15 mars 2026 · 11:08',
        amount: '156,75 €',
        status: 'Payé',
    },
];

function statusLabel(status: string): TxRow['status'] {
    const s = status.toLowerCase();
    if (s === 'delivered' || s === 'paid') return 'Payé';
    if (s === 'cancelled') return 'Remboursé';
    return 'En cours';
}

function formatAmount(cents: number, currency: string): string {
    const major = cents / 100;
    if (currency === 'EUR' || currency === '€') return `${major.toFixed(2)} €`;
    return `${major.toFixed(0)} ${currency}`;
}

function serviceReservationToOrderDetail(r: ServiceReservationOut): MarketplaceOrderDetail {
    return {
        id: r.id,
        status: r.status,
        total_cents: r.total_cents,
        currency: r.currency,
        created_at: r.created_at,
        line_count: 1,
        lines: [
            {
                product_id: 'reservation',
                product_title: r.title,
                seller_id: '',
                seller_name: 'AgroConnect Africa',
                quantity: 1,
                unit_price_cents: r.total_cents,
                line_total_cents: r.total_cents,
            },
        ],
    };
}

export default function HistoriqueTransactionsScreen() {
    const router = useRouter();
    const { token, user } = useAuth();
    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const bottomPad = TAB_BAR_RESERVE + Math.max(insets.bottom, 8);
    const CONTAINER_WIDTH = useMemo(() => Math.min(SCREEN_WIDTH, MAX_WIDTH), [SCREEN_WIDTH]);

    const [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
    });

    const [rows, setRows] = useState<TxRow[]>([]);
    /** Achats avec lignes vendeur — API détaillée. */
    const [buyerOrders, setBuyerOrders] = useState<MarketplaceOrderDetail[]>([]);
    /** IDs issus du stockage local marqués comme réservation (affichage libellé + pastille). */
    const [reservationOrderIds, setReservationOrderIds] = useState<Set<string>>(() => new Set());
    const [loading, setLoading] = useState(false);
    const [usedApi, setUsedApi] = useState(false);
    const [loadError, setLoadError] = useState(false);

    /** Producteur / vendeur : historique des ventes ; acheteur client : achats. */
    const sellerMode = !!(user && !isClientBuyer(user));

    const mapOrdersToRows = (list: MarketplaceOrderRow[], asSeller: boolean): TxRow[] =>
        list.map((o) => ({
            id: o.id,
            ref: `#${String(o.id).slice(0, 8).toUpperCase()}`,
            label: asSeller
                ? `Vente · ${o.line_count} ligne(s)`
                : `Marketplace · ${o.line_count} article(s)`,
            date: new Date(o.created_at).toLocaleString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
            amount: formatAmount(o.total_cents, o.currency),
            status: statusLabel(o.status),
        }));

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            const run = async () => {
                if (!token || token === 'dev-token') {
                    if (sellerMode) {
                        if (cancelled) return;
                        setRows(MOCK_SALES);
                        setBuyerOrders([]);
                        setReservationOrderIds(new Set());
                        setUsedApi(false);
                        setLoadError(false);
                        setLoading(false);
                        return;
                    }
                    const locals = await loadStoredBuyerTransactions();
                    if (cancelled) return;
                    if (locals.length > 0) {
                        setBuyerOrders(locals.map(storedToOrderDetail));
                        setReservationOrderIds(reservationOrderIdsFromStored(locals));
                        setRows([]);
                    } else {
                        setBuyerOrders([]);
                        setReservationOrderIds(new Set());
                        setRows(MOCK_TX);
                    }
                    setUsedApi(false);
                    setLoadError(false);
                    setLoading(false);
                    return;
                }

                setLoading(true);
                setLoadError(false);

                if (sellerMode) {
                    try {
                        const list = await fetchMySellerSales(token, 40);
                        if (cancelled) return;
                        setBuyerOrders([]);
                        setReservationOrderIds(new Set());
                        if (list.length === 0) {
                            setRows([]);
                        } else {
                            setRows(mapOrdersToRows(list, true));
                        }
                        setUsedApi(true);
                    } catch {
                        if (!cancelled) {
                            setRows([]);
                            setBuyerOrders([]);
                            setReservationOrderIds(new Set());
                            setUsedApi(true);
                            setLoadError(true);
                        }
                    } finally {
                        if (!cancelled) setLoading(false);
                    }
                    return;
                }

                try {
                    const [apiList, resApi, locals] = await Promise.all([
                        fetchMyMarketplaceOrdersDetailed(token, 40),
                        fetchMyServiceReservations(token, 40).catch(() => [] as ServiceReservationOut[]),
                        loadStoredBuyerTransactions(),
                    ]);
                    if (cancelled) return;
                    setRows([]);
                    const fromServer = [
                        ...apiList,
                        ...resApi.map(serviceReservationToOrderDetail),
                    ];
                    setBuyerOrders(mergeBuyerOrdersWithLocal(fromServer, locals));
                    const resIds = new Set(resApi.map((x) => x.id));
                    setReservationOrderIds(
                        new Set([...reservationOrderIdsFromStored(locals), ...resIds])
                    );
                    setUsedApi(true);
                } catch {
                    if (!cancelled) {
                        const locals = await loadStoredBuyerTransactions();
                        if (cancelled) return;
                        setRows([]);
                        setBuyerOrders(locals.map(storedToOrderDetail));
                        setReservationOrderIds(reservationOrderIdsFromStored(locals));
                        setUsedApi(true);
                        setLoadError(true);
                    }
                } finally {
                    if (!cancelled) setLoading(false);
                }
            };

            void run();
            return () => {
                cancelled = true;
            };
        }, [token, sellerMode])
    );

    if (!fontsLoaded) return null;

    return (
        <View style={styles.outer}>
            <StatusBar barStyle="dark-content" />
            <View style={[styles.inner, { width: CONTAINER_WIDTH }]}>
                <SafeAreaView style={styles.safe}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backBtn}
                            accessibilityLabel="Retour"
                        >
                            <Feather name="chevron-left" size={24} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>
                            {sellerMode ? 'Mes ventes' : 'Mes achats'}
                        </Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <Text style={styles.subtitle}>
                        {loadError
                            ? 'Impossible de charger les données. Vérifiez la connexion et que l’API tourne.'
                            : usedApi
                              ? sellerMode
                                  ? 'Montants = part sur vos lignes produits (commandes marketplace).'
                                  : 'Commandes serveur et achats enregistrés sur cet appareil (fusionnés, sans doublon).'
                              : sellerMode
                                ? 'Mode démo vendeur — connectez-vous pour voir vos vraies ventes.'
                                : 'Mode démo acheteur — connectez-vous pour voir vos vraies commandes.'}
                    </Text>

                    {loading ? (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={GREEN_PRIMARY} />
                        </View>
                    ) : null}

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
                    >
                        {!loading &&
                        !loadError &&
                        (sellerMode
                            ? rows.length === 0
                            : buyerOrders.length === 0 && rows.length === 0) ? (
                            <Text style={[styles.subtitle, { marginTop: 16 }]}>
                                {sellerMode
                                    ? 'Aucune vente pour l’instant. Publiez un produit sur le marché : les commandes qui le contiennent apparaîtront ici.'
                                    : 'Aucune commande pour l’instant. Passez par le marché puis validez le paiement.'}
                            </Text>
                        ) : null}
                        {!sellerMode && buyerOrders.length > 0
                            ? buyerOrders.map((order) => {
                                  const st = statusLabel(order.status);
                                  const isReservation = reservationOrderIds.has(order.id);
                                  const dateStr = new Date(order.created_at).toLocaleString('fr-FR', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                  });
                                  return (
                                      <View key={order.id} style={styles.card}>
                                          <View style={styles.cardTop}>
                                              <View style={{ flex: 1 }}>
                                                  {isReservation ? (
                                                      <View style={styles.kindTag}>
                                                          <Text style={styles.kindTagText}>Réservation</Text>
                                                      </View>
                                                  ) : null}
                                                  <Text style={styles.ref}>
                                                      #{String(order.id).slice(0, 8).toUpperCase()}
                                                  </Text>
                                              </View>
                                              <View
                                                  style={[
                                                      styles.badge,
                                                      st === 'Payé' && styles.badgeOk,
                                                      st === 'En cours' && styles.badgePending,
                                                      st === 'Remboursé' && styles.badgeRefund,
                                                  ]}
                                              >
                                                  <Text
                                                      style={[
                                                          styles.badgeText,
                                                          st === 'Payé' && styles.badgeTextOk,
                                                          st === 'En cours' && styles.badgeTextPending,
                                                      ]}
                                                  >
                                                      {st}
                                                  </Text>
                                              </View>
                                          </View>
                                          <Text style={styles.label}>
                                              {isReservation
                                                  ? `Réservation · ${order.line_count} ligne(s)`
                                                  : `${order.line_count} article(s)`}{' '}
                                              · {formatAmount(order.total_cents, order.currency)}
                                          </Text>
                                          <Text style={styles.date}>{dateStr}</Text>
                                          <View style={styles.linesBox}>
                                              {order.lines.map((ln) => (
                                                  <View key={`${order.id}-${ln.product_id}`} style={styles.lineRow}>
                                                      <Text style={styles.lineTitle} numberOfLines={2}>
                                                          {ln.product_title}
                                                      </Text>
                                                      <Text style={styles.lineSeller} numberOfLines={1}>
                                                          {isReservation ? 'Prestataire' : 'Vendeur'} :{' '}
                                                          {ln.seller_name}
                                                      </Text>
                                                      <Text style={styles.lineMeta}>
                                                          ×{ln.quantity} · {formatAmount(ln.line_total_cents, order.currency)}
                                                      </Text>
                                                  </View>
                                              ))}
                                          </View>
                                          <TouchableOpacity
                                              style={styles.trackBtn}
                                              activeOpacity={0.9}
                                              onPress={() =>
                                                  router.push({
                                                      pathname: '/marche/suivi-livraison',
                                                      params: {
                                                          orderRef: `#${String(order.id).slice(0, 8).toUpperCase()}`,
                                                      },
                                                  })
                                              }
                                          >
                                              <Truck size={18} color={GREEN_PRIMARY} strokeWidth={2} />
                                              <Text style={styles.trackBtnText}>Voir le trajet de livraison</Text>
                                          </TouchableOpacity>
                                      </View>
                                  );
                              })
                            : rows.map((tx) => (
                                  <View key={tx.id} style={styles.card}>
                                      <View style={styles.cardTop}>
                                          <Text style={styles.ref}>{tx.ref}</Text>
                                          <View
                                              style={[
                                                  styles.badge,
                                                  tx.status === 'Payé' && styles.badgeOk,
                                                  tx.status === 'En cours' && styles.badgePending,
                                                  tx.status === 'Remboursé' && styles.badgeRefund,
                                              ]}
                                          >
                                              <Text
                                                  style={[
                                                      styles.badgeText,
                                                      tx.status === 'Payé' && styles.badgeTextOk,
                                                      tx.status === 'En cours' && styles.badgeTextPending,
                                                  ]}
                                              >
                                                  {tx.status}
                                              </Text>
                                          </View>
                                      </View>
                                      <Text style={styles.label}>{tx.label}</Text>
                                      <View style={styles.cardBottom}>
                                          <Text style={styles.date}>{tx.date}</Text>
                                          <Text style={styles.amount}>{tx.amount}</Text>
                                      </View>
                                  </View>
                              ))}
                    </ScrollView>
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: { flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center' },
    inner: { flex: 1, backgroundColor: '#FFFFFF' },
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'PJS-Bold',
        fontSize: 17,
        color: '#0F172A',
        flex: 1,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'PJS-Regular',
        fontSize: 13,
        color: '#64748B',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
        lineHeight: 20,
    },
    scroll: { paddingHorizontal: 24, paddingTop: 8 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EEF2F6',
        padding: 16,
        marginBottom: 12,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ref: { fontFamily: 'PJS-SemiBold', fontSize: 13, color: GREEN_PRIMARY },
    kindTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    kindTagText: {
        fontFamily: 'PJS-SemiBold',
        fontSize: 10,
        color: GREEN_PRIMARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
    },
    badgeOk: { backgroundColor: '#ECFDF5' },
    badgePending: { backgroundColor: '#FFFBEB' },
    badgeRefund: { backgroundColor: '#F1F5F9' },
    badgeText: { fontFamily: 'PJS-SemiBold', fontSize: 11, color: '#64748B' },
    badgeTextOk: { color: GREEN_PRIMARY },
    badgeTextPending: { color: '#B45309' },
    label: { fontFamily: 'PJS-SemiBold', fontSize: 15, color: '#0F172A', marginBottom: 10 },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    date: { fontFamily: 'PJS-Regular', fontSize: 12, color: '#94A3B8' },
    amount: { fontFamily: 'PJS-Bold', fontSize: 16, color: '#0F172A' },
    linesBox: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EEF2F6',
        gap: 10,
    },
    lineRow: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
    },
    lineTitle: { fontFamily: 'PJS-SemiBold', fontSize: 14, color: '#0F172A' },
    lineSeller: { fontFamily: 'PJS-Regular', fontSize: 12, color: GREEN_PRIMARY, marginTop: 4 },
    lineMeta: { fontFamily: 'PJS-Regular', fontSize: 12, color: '#64748B', marginTop: 4 },
    trackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    trackBtnText: {
        fontFamily: 'PJS-SemiBold',
        fontSize: 14,
        color: GREEN_PRIMARY,
    },
});
