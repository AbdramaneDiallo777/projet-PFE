import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
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

type ServiceItem = {
    id: string;
    title: string;
    desc: string;
    price: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const SERVICES: ServiceItem[] = [
    {
        id: 's1',
        title: 'Conseil agronomique',
        desc: 'Visite parcelle, plan de fertilisation, rotation des cultures.',
        price: 'À partir de 75 000 FCFA',
        icon: 'sprout',
    },
    {
        id: 's2',
        title: 'Livraison fret agricole',
        desc: 'Transport réfrigéré ou benne pour récoltes et intrants.',
        price: 'Sur devis',
        icon: 'truck-delivery',
    },
    {
        id: 's3',
        title: 'Formation équipe',
        desc: 'Sensibilisation sécurité, usage pulvérisateur, bonnes pratiques.',
        price: '150 000 FCFA / jour',
        icon: 'school',
    },
    {
        id: 's4',
        title: 'Mise en place irrigation',
        desc: 'Étude de besoin, goutte-à-goutte, pompage solaire.',
        price: 'Devis gratuit',
        icon: 'water',
    },
];

export default function ServicesMarketplaceScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const cw = Math.min(width, MAX_WIDTH);
    const [q, setQ] = useState('');

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return SERVICES;
        return SERVICES.filter((x) => `${x.title} ${x.desc}`.toLowerCase().includes(s));
    }, [q]);

    const reserve = (item: ServiceItem) => {
        router.push({
            pathname: '/marche/reserver',
            params: { serviceId: item.id, title: item.title },
        });
    };

    const message = () => {
        router.push('/marche/message');
    };

    return (
        <View style={[styles.root, { width: cw, alignSelf: 'center' }]}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safe}>
                <View style={styles.topbar}>
                    <TouchableOpacity style={styles.circle} onPress={() => router.back()}>
                        <Feather name="chevron-left" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.brand}>Services agricoles</Text>
                        <Text style={styles.headline}>Réserver un expert ou un transport</Text>
                    </View>
                </View>

                <View style={styles.search}>
                    <Feather name="search" size={18} color="#64748b" />
                    <TextInput
                        placeholder=" irrigation, livraison, formation…"
                        style={styles.input}
                        value={q}
                        onChangeText={setQ}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Text style={styles.intro}>
                        Pas de panier ici : vous réservez un créneau ou envoyez un message pour un devis. Les commandes de récoltes
                        passent par « Récoltes » ou le catalogue produits.
                    </Text>
                    {filtered.map((item) => (
                        <View key={item.id} style={styles.card}>
                            <View style={styles.cardTop}>
                                <View style={styles.iconWrap}>
                                    <MaterialCommunityIcons name={item.icon} size={26} color="#2563eb" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardDesc}>{item.desc}</Text>
                                    <Text style={styles.cardPrice}>{item.price}</Text>
                                </View>
                            </View>
                            <View style={styles.actions}>
                                <TouchableOpacity style={styles.btnGhost} onPress={() => message()}>
                                    <Text style={styles.btnGhostText}>Message</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.btnPrimary} onPress={() => reserve(item)}>
                                    <Text style={styles.btnPrimaryText}>Réserver</Text>
                                    <Feather name="calendar" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#f0f9ff' },
    safe: { flex: 1 },
    topbar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, gap: 12, alignItems: 'flex-start' },
    circle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0f2fe',
    },
    brand: { fontSize: 11, fontWeight: '900', color: '#0369a1', letterSpacing: 1.2 },
    headline: { fontSize: 22, fontWeight: '900', color: '#0c4a6e', marginTop: 4 },
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
        borderColor: '#bae6fd',
        gap: 10,
    },
    input: { flex: 1, fontSize: 15, color: '#0f172a' },
    scroll: { padding: 16 },
    intro: { fontSize: 13, color: '#475569', lineHeight: 21, marginBottom: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#e0f2fe',
    },
    cardTop: { flexDirection: 'row', gap: 12 },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: { fontSize: 17, fontWeight: '900', color: '#0f172a' },
    cardDesc: { fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 20 },
    cardPrice: { fontSize: 14, fontWeight: '800', color: '#0369a1', marginTop: 8 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
    btnGhost: {
        flex: 1,
        height: 46,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnGhostText: { fontWeight: '800', color: '#2563eb', fontSize: 14 },
    btnPrimary: {
        flex: 1,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#2563eb',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    btnPrimaryText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
