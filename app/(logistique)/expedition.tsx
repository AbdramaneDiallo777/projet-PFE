import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Calendar,
    ChevronRight,
    Info,
    MapPin,
    Package,
    Scale,
    Truck
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';

const MAX_WIDTH = 500; // Largeur maximale fixée
const GREEN_DEEP = '#065F46';
const GREEN_LIGHT = '#10B981';

export default function NouvelleExpedition() {
    const router = useRouter();
    const [transportType, setTransportType] = useState('standard');
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    // Calcul de la largeur dynamique
    const CONTAINER_WIDTH = SCREEN_WIDTH > MAX_WIDTH ? MAX_WIDTH : SCREEN_WIDTH;

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    if (!fontsLoaded) return null;

    return (
        <View style={styles.outerContainer}>
            <StatusBar barStyle="dark-content" />
            
            {/* Conteneur principal centré avec Max Width */}
            <View style={[styles.innerContainer, { width: CONTAINER_WIDTH }]}>
                <SafeAreaView style={styles.safeArea}>
                    
                    {/* --- HEADER --- */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <ArrowLeft size={24} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Nouvelle Expédition</Text>
                        <View style={{ width: 44 }} /> 
                    </View>

                    <KeyboardAvoidingView 
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{ flex: 1 }}
                    >
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            
                            {/* --- SECTION ITINÉRAIRE --- */}
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>ITINÉRAIRE</Text>
                                <View style={styles.inputGroup}>
                                    <View style={styles.inputWrapper}>
                                        <MapPin size={20} color={GREEN_DEEP} />
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="Lieu d'enlèvement (ex: Dakar)" 
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                    <View style={styles.verticalLine} />
                                    <View style={styles.inputWrapper}>
                                        <MapPin size={20} color="#EF4444" />
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="Destination finale (ex: Saint-Louis)" 
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* --- TYPE DE TRANSPORT --- */}
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>TYPE DE TRANSPORT</Text>
                                <View style={styles.typeSelector}>
                                    <TypeCard 
                                        label="Standard" 
                                        active={transportType === 'standard'} 
                                        onPress={() => setTransportType('standard')} 
                                    />
                                    <TypeCard 
                                        label="Frigo" 
                                        active={transportType === 'frigo'} 
                                        onPress={() => setTransportType('frigo')} 
                                    />
                                    <TypeCard 
                                        label="Express" 
                                        active={transportType === 'express'} 
                                        onPress={() => setTransportType('express')} 
                                    />
                                </View>
                            </View>

                            {/* --- DÉTAILS CARGAISON --- */}
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>DÉTAILS CARGAISON</Text>
                                <View style={styles.rowInputs}>
                                    <View style={[styles.inputWrapper, { flex: 1, marginRight: 10 }]}>
                                        <Scale size={20} color={GREEN_DEEP} />
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="Poids (kg)" 
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                                        <Package size={20} color={GREEN_DEEP} />
                                        <TextInput 
                                            style={styles.input} 
                                            placeholder="Nb Colis" 
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity style={[styles.inputWrapper, { marginTop: 12 }]}>
                                    <Calendar size={20} color={GREEN_DEEP} />
                                    <Text style={styles.datePickerText}>Date d'enlèvement</Text>
                                    <ChevronRight size={18} color="#CBD5E1" />
                                </TouchableOpacity>
                            </View>

                            {/* --- INFO BOX --- */}
                            <View style={styles.infoBox}>
                                <Info size={18} color={GREEN_DEEP} />
                                <Text style={styles.infoText}>
                                    Vos produits sont assurés durant toute la durée du transit via AgroProtect.
                                </Text>
                            </View>

                        </ScrollView>
                    </KeyboardAvoidingView>

                    {/* --- FOOTER ACTION --- */}
                    <View style={styles.footer}>
                        <View style={styles.priceRecap}>
                            <Text style={styles.priceLabel}>Estimation</Text>
                            <Text style={styles.priceValue}>~ 45.000 F</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.submitButton}
                            onPress={() => router.push('/marche/paiement')}
                        >
                            <LinearGradient
                                colors={[GREEN_LIGHT, GREEN_DEEP]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitGradient}
                            >
                                <Text style={styles.submitText}>Commander</Text>
                                <Truck size={20} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </View>
    );
}

const TypeCard = ({ label, active, onPress }: any) => (
    <TouchableOpacity 
        style={[styles.typeCard, active && styles.typeCardActive]} 
        onPress={onPress}
    >
        <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    outerContainer: { 
        flex: 1, 
        backgroundColor: '#F1F5F9', // Fond extérieur (gris léger)
        alignItems: 'center' 
    },
    innerContainer: { 
        flex: 1, 
        backgroundColor: '#FFFFFF', // Fond de l'application
        overflow: 'hidden'
    },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'PJS-ExtraBold',
        color: '#0F172A'
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40
    },
    section: {
        marginBottom: 25
    },
    sectionLabel: {
        fontSize: 11,
        fontFamily: 'PJS-ExtraBold',
        color: GREEN_DEEP,
        letterSpacing: 1.2,
        marginBottom: 12
    },
    inputGroup: {
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        paddingHorizontal: 16,
        height: 60,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        fontFamily: 'PJS-SemiBold',
        color: '#0F172A'
    },
    verticalLine: {
        width: 1,
        height: 20,
        backgroundColor: '#CBD5E1',
        marginLeft: 25,
        marginVertical: 4
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 10
    },
    typeCard: {
        flex: 1,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    typeCardActive: {
        backgroundColor: '#ECFDF5',
        borderColor: GREEN_LIGHT
    },
    typeLabel: {
        fontSize: 14,
        fontFamily: 'PJS-Bold',
        color: '#94A3B8'
    },
    typeLabelActive: {
        color: GREEN_DEEP
    },
    rowInputs: {
        flexDirection: 'row'
    },
    datePickerText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        fontFamily: 'PJS-SemiBold',
        color: '#94A3B8'
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#ECFDF5',
        borderRadius: 20,
        padding: 16,
        gap: 12,
        alignItems: 'center'
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'PJS-Regular',
        color: GREEN_DEEP,
        lineHeight: 18
    },
    footer: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF'
    },
    priceRecap: {
        flex: 1
    },
    priceLabel: {
        fontSize: 12,
        fontFamily: 'PJS-SemiBold',
        color: '#94A3B8'
    },
    priceValue: {
        fontSize: 20,
        fontFamily: 'PJS-ExtraBold',
        color: GREEN_DEEP
    },
    submitButton: {
        flex: 1.5,
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: GREEN_DEEP,
        shadowOpacity: 0.2,
        shadowRadius: 10
    },
    submitGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
    },
    submitText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'PJS-Bold'
    }
});