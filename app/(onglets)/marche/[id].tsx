import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

// Import de la police Inter
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    useFonts,
} from '@expo-google-fonts/inter';

const MAX_WIDTH = 500;

const PRODUCTS_DATA = [
    { id: '1', name: 'Avocats Hass', price: '4.00', unit: 'kg', origin: 'KENYA', isBio: true, isLocal: false, image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?q=80&w=400' },
    { id: '2', name: 'Poivrons Rouges', price: '2.50', unit: 'kg', origin: 'NIGERIA', isBio: false, isLocal: true, image: 'https://images.unsplash.com/photo-1563513307168-a49629f48a60?q=80&w=400' },
    { id: '3', name: 'Mangues Douces', price: '3.00', unit: 'pc', origin: 'S. AFRICA', isBio: true, isLocal: false, image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=400' },
    { id: '4', name: 'Oignons Rouges', price: '1.80', unit: 'kg', origin: 'ÉGYPTE', isBio: false, isLocal: true, image: 'https://images.unsplash.com/photo-1508747703725-719777637510?q=80&w=400' },
];

const CATEGORIES = ['Tout', 'Fruits', 'Légumes', 'Graines'];

const COLORS = {
    primary: '#10B981',
    accent: '#34D399',
    dark: '#0F172A',
    muted: '#64748B',
    bg: '#F8FAFC',
    white: '#FFFFFF',
};

export default function MarketplacePage() {
    const [activeCat, setActiveCat] = useState('Tout');
    const [favorites, setFavorites] = useState<string[]>([]);
    const router = useRouter();
    
    // Chargement de la police Inter
    let [fontsLoaded] = useFonts({
        'Inter-Regular': Inter_400Regular,
        'Inter-Medium': Inter_500Medium,
        'Inter-SemiBold': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
    });

    const { width: SCREEN_WIDTH } = useWindowDimensions();
    const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH, MAX_WIDTH);
    const COLUMN_WIDTH = (CONTAINER_WIDTH - 54) / 2;

    const toggleFavorite = (id: string) => {
        setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };

    if (!fontsLoaded) return null;

    const renderProduct = ({ item }: { item: any }) => {
        const isFav = favorites.includes(item.id);
        return (
            <View style={[styles.cardWrapper, { width: COLUMN_WIDTH }]}>
                <TouchableOpacity 
                    style={styles.productCard}
                    activeOpacity={0.95}
                    onPress={() => router.push(`/marche/product/${item.id}`)}
                >
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: item.image }} style={styles.productImage} />
                        
                        <View style={styles.glassBadge}>
                            <Text style={styles.originText}>{item.origin}</Text>
                        </View>

                        {item.isBio && (
                            <View style={styles.bioBadge}>
                                <MaterialCommunityIcons name="leaf" size={10} color="white" />
                            </View>
                        )}

                        <TouchableOpacity 
                            style={styles.favBtn} 
                            onPress={() => toggleFavorite(item.id)}
                        >
                            <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#F43F5E" : COLORS.dark} />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceText}>{item.price}€</Text>
                            <Text style={styles.unitText}>/{item.unit}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickAdd}>
                    <Feather name="plus" size={20} color="white" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.outerContainer}>
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH }]}>
                <SafeAreaView style={styles.flex}>
                    
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.headerIconBtn}>
                            <Feather name="menu" size={22} color={COLORS.dark} />
                        </TouchableOpacity>
                        <View style={styles.titleContainer}>
                            <Text style={styles.headerLabel}>AGRO</Text>
                            <Text style={styles.headerTitle}>MARKET</Text>
                        </View>
                        <TouchableOpacity style={styles.cartBtn}>
                            <Feather name="shopping-bag" size={22} color={COLORS.dark} />
                            <View style={styles.cartBadge} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchSection}>
                        <View style={styles.searchWrapper}>
                            <Feather name="search" size={18} color={COLORS.muted} style={{marginLeft: 15}} />
                            <TextInput 
                                placeholder="Trouvez votre bonheur..." 
                                style={styles.searchInput}
                                placeholderTextColor={COLORS.muted}
                            />
                        </View>
                        <TouchableOpacity style={styles.tuneBtn}>
                            <MaterialCommunityIcons name="tune-variant" size={22} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.catContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity 
                                    key={cat} 
                                    onPress={() => setActiveCat(cat)}
                                    style={[styles.catPill, activeCat === cat && styles.catPillActive]}
                                >
                                    <Text style={[styles.catPillText, activeCat === cat && styles.catPillTextActive]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <FlatList
                        data={PRODUCTS_DATA}
                        renderItem={renderProduct}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        contentContainerStyle={styles.listPadding}
                        columnWrapperStyle={styles.columnGap}
                        showsVerticalScrollIndicator={false}
                    />

                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: '#EDF2F7', alignItems: 'center' },
    innerContainer: { flex: 1, backgroundColor: COLORS.bg },
    flex: { flex: 1 },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
    headerIconBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }) },
    titleContainer: { alignItems: 'center' },
    headerLabel: { fontSize: 10, fontFamily: 'Inter-Bold', color: COLORS.primary, letterSpacing: 3, marginBottom: -4 },
    headerTitle: { fontSize: 20, fontFamily: 'Inter-Bold', color: COLORS.dark },
    cartBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }) },
    cartBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: 'white' },

    searchSection: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
    searchWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 18, height: 55 },
    searchInput: { flex: 1, paddingHorizontal: 12, fontFamily: 'Inter-Medium', fontSize: 14, color: COLORS.dark },
    tuneBtn: { width: 55, height: 55, backgroundColor: COLORS.dark, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

    catContainer: { marginBottom: 25 },
    catScroll: { paddingHorizontal: 20, gap: 10 },
    catPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, backgroundColor: 'white' },
    catPillActive: { backgroundColor: COLORS.primary },
    catPillText: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: COLORS.muted },
    catPillTextActive: { color: 'white' },

    listPadding: { paddingHorizontal: 20, paddingBottom: 100 },
    columnGap: { justifyContent: 'space-between' },
    cardWrapper: { marginBottom: 24, position: 'relative' },
    productCard: { backgroundColor: 'white', borderRadius: 30, padding: 10, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.03, shadowRadius: 20 }, android: { elevation: 3 } }) },
    imageContainer: { height: 180, borderRadius: 25, overflow: 'hidden', backgroundColor: '#F1F5F9' },
    productImage: { width: '100%', height: '100%', borderRadius: 25 },
    
    glassBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    originText: { fontSize: 8, fontFamily: 'Inter-Bold', color: COLORS.dark },
    bioBadge: { position: 'absolute', bottom: 10, left: 10, backgroundColor: COLORS.primary, width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    favBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'white', width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    
    productInfo: { marginTop: 12, paddingHorizontal: 4 },
    productName: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: COLORS.dark },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
    priceText: { fontSize: 18, fontFamily: 'Inter-Bold', color: COLORS.primary },
    unitText: { fontSize: 10, fontFamily: 'Inter-Medium', color: COLORS.muted, marginLeft: 2 },
    
    quickAdd: { position: 'absolute', bottom: 50, right: -5, width: 40, height: 40, borderRadius: 15, backgroundColor: COLORS.dark, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: COLORS.bg }
});