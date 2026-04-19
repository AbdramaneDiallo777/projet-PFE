import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router'; // Importation de expo-router
import {
    ArrowRight,
    ChevronDown,
    Leaf
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const MAX_WIDTH = 480;
const GREEN_PRIMARY = '#065F46'; 

export default function RegisterScreen() {
    const router = useRouter(); // Hook de navigation
    const { register, isReady } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [role, setRole] = useState('farmer');
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });

    let [fontsLoaded] = useFonts({
        'PJS-Regular': PlusJakartaSans_400Regular,
        'PJS-SemiBold': PlusJakartaSans_600SemiBold,
        'PJS-Bold': PlusJakartaSans_700Bold,
        'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
    });

    // En mode tunnel/public, le chargement des polices peut échouer ; on laisse l'écran s'afficher.
    if (!isReady) return null;

    const handleSignup = async () => {
        if (!form.name.trim() || !form.email.trim()) {
            Alert.alert('Information', 'Veuillez remplir votre nom et votre email.');
            return;
        }
        const emailTrim = form.email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
            Alert.alert('E-mail', 'Adresse e-mail invalide (ex. prenom@domaine.com).');
            return;
        }
        if (form.password.length < 8) {
            Alert.alert('Mot de passe', 'Au moins 8 caractères (exigence du serveur).');
            return;
        }
        if (form.password !== form.confirm) {
            Alert.alert('Mot de passe', 'La confirmation ne correspond pas.');
            return;
        }
        setIsLoading(true);
        try {
            await register({
                email: emailTrim,
                password: form.password,
                full_name: form.name.trim(),
                phone_number: form.phone.trim() || undefined,
                role,
            });
            router.replace('/tableau-de-bord');
        } catch (e) {
            Alert.alert('Inscription', e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.flex1}
                >
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent} 
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.responsiveWrapper}>
                            
                            {/* Header avec Icône Moderne */}
                            <View style={styles.header}>
                                <View style={styles.brandIcon}>
                                    <Leaf color="#FFF" size={28} fill="#FFF" />
                                </View>
                                <Text style={styles.title}>Créer un compte</Text>
                                <Text style={styles.subtitle}>
                                    Compte producteur ou <Text style={{ fontFamily: 'PJS-Bold', color: GREEN_PRIMARY }}>client acheteur</Text> (commandes, carte des terrains).
                                </Text>
                            </View>

                            {/* Sélecteur de Rôle Moderne */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>VOTRE RÔLE</Text>
                                <View style={styles.roleRow}>
                                    {[
                                        { id: 'farmer', label: 'Agriculteur' },
                                        { id: 'client', label: 'Client (UE)' },
                                        { id: 'investor', label: 'Invest.' },
                                        { id: 'pro', label: 'Pro' },
                                    ].map((item) => (
                                        <TouchableOpacity 
                                            key={item.id}
                                            onPress={() => setRole(item.id)}
                                            style={[
                                                styles.roleTab, 
                                                role === item.id && styles.roleTabActive
                                            ]}
                                        >
                                            <Text style={[
                                                styles.roleTabText, 
                                                role === item.id && styles.roleTabTextActive
                                            ]}>{item.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Formulaire */}
                            <View style={styles.form}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, focusedInput === 'name' && { color: GREEN_PRIMARY }]}>NOM COMPLET</Text>
                                    <TextInput 
                                        placeholder="Ibrahim Traoré" 
                                        placeholderTextColor="#94a3b8" 
                                        style={[styles.input, focusedInput === 'name' && styles.inputActive]} 
                                        onFocus={() => setFocusedInput('name')}
                                        onBlur={() => setFocusedInput(null)}
                                        onChangeText={(t) => setForm({...form, name: t})} 
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, focusedInput === 'email' && { color: GREEN_PRIMARY }]}>ADRESSE E-MAIL</Text>
                                    <TextInput 
                                        placeholder="ibrahim@agro.ai" 
                                        placeholderTextColor="#94a3b8" 
                                        style={[styles.input, focusedInput === 'email' && styles.inputActive]} 
                                        onFocus={() => setFocusedInput('email')}
                                        onBlur={() => setFocusedInput(null)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        onChangeText={(t) => setForm({...form, email: t})} 
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, focusedInput === 'phone' && { color: GREEN_PRIMARY }]}>TÉLÉPHONE</Text>
                                    <View style={[styles.phoneInputRow, focusedInput === 'phone' && styles.inputActive]}>
                                        <TouchableOpacity style={styles.countrySelector}>
                                            <Text style={styles.countryText}>ML</Text>
                                            <ChevronDown size={14} color={GREEN_PRIMARY} />
                                        </TouchableOpacity>
                                        <TextInput 
                                            placeholder="00 00 00 00" 
                                            placeholderTextColor="#94a3b8" 
                                            style={styles.phoneInput} 
                                            onFocus={() => setFocusedInput('phone')}
                                            onBlur={() => setFocusedInput(null)}
                                            keyboardType="phone-pad"
                                            onChangeText={(t) => setForm({...form, phone: t})} 
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, focusedInput === 'password' && { color: GREEN_PRIMARY }]}>MOT DE PASSE</Text>
                                    <TextInput 
                                        placeholder="••••••••" 
                                        placeholderTextColor="#94a3b8" 
                                        style={[styles.input, focusedInput === 'password' && styles.inputActive]} 
                                        onFocus={() => setFocusedInput('password')}
                                        onBlur={() => setFocusedInput(null)}
                                        secureTextEntry
                                        onChangeText={(t) => setForm({...form, password: t})} 
                                        value={form.password}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, focusedInput === 'confirm' && { color: GREEN_PRIMARY }]}>CONFIRMER</Text>
                                    <TextInput 
                                        placeholder="••••••••" 
                                        placeholderTextColor="#94a3b8" 
                                        style={[styles.input, focusedInput === 'confirm' && styles.inputActive]} 
                                        onFocus={() => setFocusedInput('confirm')}
                                        onBlur={() => setFocusedInput(null)}
                                        secureTextEntry
                                        onChangeText={(t) => setForm({...form, confirm: t})} 
                                        value={form.confirm}
                                    />
                                </View>

                                <TouchableOpacity 
                                    style={[
                                        styles.submitBtn, 
                                        (!form.name || !form.email || !form.password) && { backgroundColor: '#cbd5e1', shadowOpacity: 0 } 
                                    ]} 
                                    onPress={handleSignup}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Text style={styles.submitBtnText}>Continuer</Text>
                                            <ArrowRight color="#FFF" size={20} strokeWidth={2.5} />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity 
                                style={styles.loginLink} 
                                onPress={() => router.push('/connexion')} // Navigation vers la connexion
                            >
                                <Text style={styles.loginLinkText}>
                                    Déjà membre ? <Text style={{ color: GREEN_PRIMARY, fontFamily: 'PJS-Bold' }}>Se connecter</Text>
                                </Text>
                            </TouchableOpacity>

                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    safeArea: { flex: 1 },
    flex1: { flex: 1 },
    responsiveWrapper: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: 32 },
    scrollContent: { flexGrow: 1, paddingTop: 20, paddingBottom: 40 },
    header: { marginBottom: 35, alignItems: 'flex-start' },
    brandIcon: { 
        width: 58, height: 58, borderRadius: 20, 
        backgroundColor: GREEN_PRIMARY, 
        justifyContent: 'center', alignItems: 'center', marginBottom: 24,
        shadowColor: GREEN_PRIMARY, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5
    },
    title: { fontSize: 32, fontFamily: 'PJS-ExtraBold', color: '#0f172a', letterSpacing: -1 },
    subtitle: { fontSize: 16, fontFamily: 'PJS-Regular', color: '#64748b', marginTop: 12, lineHeight: 24 },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 11, fontFamily: 'PJS-Bold', color: '#94a3b8', letterSpacing: 1 },
    input: { 
        height: 60, borderRadius: 16, paddingHorizontal: 20, fontSize: 16, 
        fontFamily: 'PJS-SemiBold', backgroundColor: '#f8fafc', color: '#0f172a',
        borderWidth: 1.5, borderColor: '#f1f5f9'
    },
    inputActive: { 
        borderColor: GREEN_PRIMARY, 
        backgroundColor: '#FFF' 
    },
    roleRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        backgroundColor: '#f8fafc',
        padding: 6,
        borderRadius: 18,
    },
    roleTab: {
        flexGrow: 1,
        minWidth: '44%',
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
    },
    roleTabActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    roleTabText: { fontSize: 14, fontFamily: 'PJS-SemiBold', color: '#94a3b8' },
    roleTabTextActive: { color: GREEN_PRIMARY, fontFamily: 'PJS-Bold' },
    phoneInputRow: { 
        height: 60, borderRadius: 16, backgroundColor: '#f8fafc', 
        borderWidth: 1.5, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16
    },
    countrySelector: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 12, borderRightWidth: 1, borderRightColor: '#e2e8f0', paddingRight: 12 },
    countryText: { fontFamily: 'PJS-Bold', color: '#0f172a', fontSize: 15 },
    phoneInput: { flex: 1, fontFamily: 'PJS-SemiBold', fontSize: 16, color: '#0f172a' },
    submitBtn: { 
        height: 64, borderRadius: 18, flexDirection: 'row', 
        justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 12,
        backgroundColor: GREEN_PRIMARY,
        shadowColor: GREEN_PRIMARY, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 15, elevation: 8
    },
    submitBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'PJS-ExtraBold', letterSpacing: 0.5 },
    loginLink: { marginTop: 30, alignItems: 'center' },
    loginLinkText: { fontSize: 15, fontFamily: 'PJS-Regular', color: '#64748b' }
});