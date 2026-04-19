import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Image,
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
const HERO = require('../../../assets/images/T1.jpg');

type Listing = {
    id: string;
    title: string;
    location: string;
    priceLabel: string;
    tags: string[];
    owner: string;
    hours: string;
};

const MOCK_LISTINGS: Listing[] = [
    {
        id: 'm1',
        title: 'John Deere 8R 410',
        location: 'Dakar · 12 km',
        priceLabel: '250 000 FCFA / jour',
        tags: ['GPS', '410 ch', '2023'],
        owner: 'Amadou N.',
        hours: '420 h',
    },
    {
        id: 'm2',
        title: 'Kubota M7152',
        location: 'Thiès',
        priceLabel: '185 000 FCFA / jour',
        tags: ['4x4', 'Chargeur', 'Entretien'],
        owner: 'Fatou D.',
        hours: '890 h',
    },
    {
        id: 'm3',
        title: 'Pulvérisateur traîné 2000 L',
        location: 'Kaolack',
        priceLabel: '75 000 FCFA / jour',
        tags: ['Buse', 'Régulation', 'Livraison'],
        owner: 'Séné Agro Pro',
        hours: '—',
    },
];

export default function MaterielMarketplaceScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const cw = Math.min(width, MAX_WIDTH);
    const [q, setQ] = useState('');

    const list = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return MOCK_LISTINGS;
        return MOCK_LISTINGS.filter(
            (x) =>
                `${x.title} ${x.location} ${x.tags.join(' ')} ${x.owner}`.toLowerCase().includes(s)
        );
    }, [q]);

    const contactOwner = () => {
        router.push('/marche/message');
    };

    return (
        <View style={[styles.root, { width: cw, alignSelf: 'center' }]}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.hero}>
                <SafeAreaView>
                    <View style={styles.heroTop}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                            <Feather name="chevron-left" size={22} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.heroKicker}>LOCATION & VENTE</Text>
                            <Text style={styles.heroTitle}>Matériel agricole</Text>
                            <Text style={styles.heroSub}>
                                Tracteurs, outillage, pulvérisation — contactez le propriétaire pour négocier ou planifier une visite.
                            </Text>
                        </View>
                    </View>
                    <View style={styles.searchBox}>
                        <Feather name="search" size={18} color="#94a3b8" />
                        <TextInput
                            placeholder="Rechercher : marque, ville, type…"
                            placeholderTextColor="#64748b"
                            style={styles.searchInput}
                            value={q}
                            onChangeText={setQ}
                        />
                    </View>
                </SafeAreaView>
                <Image source={HERO} style={styles.heroImg} resizeMode="cover" />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>{list.length} annonce(s)</Text>
                {list.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <MaterialCommunityIcons name="tractor" size={26} color="#065F46" />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardLoc}>{item.location}</Text>
                            </View>
                            <Text style={styles.price}>{item.priceLabel}</Text>
                        </View>
                        <View style={styles.tagRow}>
                            {item.tags.map((t) => (
                                <View key={t} style={styles.tag}>
                                    <Text style={styles.tagText}>{t}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.meta}>Propriétaire : {item.owner}</Text>
                            <Text style={styles.meta}>Heures : {item.hours}</Text>
                        </View>
                        <TouchableOpacity style={styles.cta} onPress={() => contactOwner()} activeOpacity={0.9}>
                            <Feather name="message-circle" size={18} color="#fff" />
                            <Text style={styles.ctaText}>Contacter le propriétaire</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f8fafc' },
    hero: { paddingBottom: 18 },
    heroTop: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
    iconBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroKicker: { color: '#94a3b8', fontSize: 10, letterSpacing: 2, fontWeight: '800' },
    heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 },
    heroSub: { color: '#cbd5e1', fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: 340 },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: 'rgba(15,23,42,0.6)',
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(148,163,184,0.35)',
        gap: 10,
    },
    searchInput: { flex: 1, color: '#f8fafc', fontSize: 14 },
    heroImg: { height: 110, width: '100%', opacity: 0.35, marginTop: 12 },
    scroll: { padding: 16, paddingTop: 8 },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 10 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    cardTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
    cardLoc: { fontSize: 12, color: '#64748b', marginTop: 2 },
    price: { fontSize: 13, fontWeight: '800', color: '#065F46', maxWidth: 120, textAlign: 'right' },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    tagText: { fontSize: 11, fontWeight: '700', color: '#475569' },
    metaRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
    meta: { fontSize: 11, color: '#94a3b8' },
    cta: {
        marginTop: 14,
        backgroundColor: '#065F46',
        borderRadius: 14,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
