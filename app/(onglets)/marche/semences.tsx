import { fetchProducts, productImageUrl, type ApiProduct } from '@/lib/agroconnectApi';
import { inferSegmentFromText } from '@/lib/marketplaceSearch';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ImageSourcePropType,
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
const FALLBACK = require('../../../assets/images/recolte.jpg');

export default function SemencesBioScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const cw = Math.min(width, MAX_WIDTH);
    const [q, setQ] = useState('');
    const [items, setItems] = useState<ApiProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        fetchProducts(0, 80, q.trim() || undefined)
            .then((list) => {
                if (!alive) return;
                const seeds = list.filter((p) => inferSegmentFromText(p.name, p.description) === 'semences' || /semence|graine|seed/i.test(p.name));
                setItems(seeds.length ? seeds : list);
            })
            .catch(() => {
                if (alive) setItems([]);
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [q]);

    const title = useMemo(() => 'Semences & intrants bio', []);

    return (
        <View style={[styles.root, { width: cw, alignSelf: 'center' }]}>
            <StatusBar barStyle="dark-content" />
            <LinearGradient colors={['#fefce8', '#ecfdf5', '#ffffff']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                            <Feather name="chevron-left" size={22} color="#14532d" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.kicker}>GRAINES CERTIFIÉES</Text>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.sub}>
                                Parcours commande identique aux récoltes : choisissez un lot, quantité, puis validez depuis la fiche
                                produit.
                            </Text>
                        </View>
                    </View>
                    <View style={styles.search}>
                        <Feather name="search" size={18} color="#64748b" />
                        <TextInput
                            placeholder="Maïs, riz, soja, variété…"
                            style={styles.searchInput}
                            value={q}
                            onChangeText={(t) => {
                                setLoading(true);
                                setQ(t);
                            }}
                            placeholderTextColor="#94a3b8"
                        />
                        {loading ? <ActivityIndicator size="small" color="#059669" /> : null}
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                <Text style={styles.hint}>
                    Les articles mènent à la fiche détail → « Commander » enregistre une commande API (si connecté).
                </Text>
                {items.map((p) => {
                    const uri = productImageUrl(p.image_url);
                    const img: ImageSourcePropType = uri ? { uri } : FALLBACK;
                    return (
                        <TouchableOpacity
                            key={p.id}
                            style={styles.row}
                            onPress={() => router.push(`/marche/product/${p.id}`)}
                            activeOpacity={0.9}
                        >
                            <Image source={img} style={styles.thumb} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name} numberOfLines={2}>
                                    {p.name}
                                </Text>
                                <Text style={styles.price}>
                                    {p.price_per_unit != null ? `${p.price_per_unit} / ${p.unit}` : 'Prix sur demande'}
                                </Text>
                                {p.location ? <Text style={styles.loc}>{p.location}</Text> : null}
                            </View>
                            <Feather name="chevron-right" size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    );
                })}
                {!loading && items.length === 0 ? (
                    <Text style={styles.empty}>Aucun résultat — élargissez la recherche ou consultez le catalogue complet.</Text>
                ) : null}
                <TouchableOpacity style={styles.linkOut} onPress={() => router.push('/marche/produit')}>
                    <Text style={styles.linkOutText}>Voir tout le catalogue récoltes & produits</Text>
                    <Feather name="arrow-right" size={16} color="#059669" />
                </TouchableOpacity>
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#fff' },
    header: { paddingBottom: 12 },
    headerRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, alignItems: 'flex-start' },
    back: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    kicker: { fontSize: 10, letterSpacing: 2, fontWeight: '900', color: '#059669' },
    title: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginTop: 4 },
    sub: { fontSize: 13, color: '#475569', lineHeight: 20, marginTop: 8 },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 14,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 50,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 10,
    },
    searchInput: { flex: 1, fontSize: 15, color: '#0f172a' },
    list: { padding: 16 },
    hint: { fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 18 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 12,
    },
    thumb: { width: 72, height: 72, borderRadius: 14, backgroundColor: '#f1f5f9' },
    name: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
    price: { fontSize: 14, fontWeight: '800', color: '#059669', marginTop: 4 },
    loc: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    empty: { textAlign: 'center', color: '#64748b', marginTop: 24 },
    linkOut: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
        paddingVertical: 12,
    },
    linkOutText: { fontWeight: '800', color: '#059669', fontSize: 14 },
});
