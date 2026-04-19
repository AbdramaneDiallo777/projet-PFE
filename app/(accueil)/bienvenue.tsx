import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts
} from '@expo-google-fonts/plus-jakarta-sans';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Globe, Leaf, Sprout } from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';

const { height } = Dimensions.get('window');
const MAX_WIDTH = 500;

// URL de l'image de fond (paysage agricole africain)
const BACKGROUND_IMAGE_URL = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000';

export default function WelcomeScreen() {
  const router = useRouter();

  let [fontsLoaded] = useFonts({
    'PJS-Regular': PlusJakartaSans_400Regular,
    'PJS-SemiBold': PlusJakartaSans_600SemiBold,
    'PJS-Bold': PlusJakartaSans_700Bold,
    'PJS-ExtraBold': PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ImageBackground 
        source={{ uri: BACKGROUND_IMAGE_URL }} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Dégradé pour assombrir le fond et assurer la lisibilité du texte */}
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
          style={styles.gradientOverlay}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.responsiveWrapper}>
              <View style={styles.content}>
                
                {/* --- LOGO / BRAND --- */}
                <View style={styles.brandContainer}>
                  <View style={styles.logoIcon}>
                    <Leaf color="#10B981" size={24} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.brandName}>AGROCONNECT AFRICA</Text>
                </View>

                {/* --- MAIN HERO TEXT --- */}
                <View style={styles.textContainer}>
                  <Text style={styles.title}>
                    L'agriculture{"\n"}
                    <Text style={{ color: '#10B981' }}>connectée</Text>{"\n"}
                    est ici.
                  </Text>
                  <Text style={styles.subtitle}>
                    Le futur de l'agriculture africaine entre vos mains. Connectez-vous aux ressources essentielles.
                  </Text>
                </View>

                {/* --- FEATURES MINI-CARDS --- */}
                <View style={styles.featuresRow}>
                  <View style={styles.featureItem}>
                    <Globe color="#FFF" size={18} strokeWidth={2} />
                    <Text style={styles.featureText}>Panafricain</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Sprout color="#FFF" size={18} strokeWidth={2} />
                    <Text style={styles.featureText}>Durable</Text>
                  </View>
                </View>

                {/* --- FOOTER ACTIONS --- */}
                <View style={styles.footer}>
                  <TouchableOpacity 
                    style={styles.mainBtn}
                    onPress={() => router.push('/(accueil)/choix-langue')}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.mainBtnText}>REJOINDRE LA RÉVOLUTION</Text>
                    <View style={styles.btnIcon}>
                      <ArrowRight color="#FFF" size={20} strokeWidth={3} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.secondaryBtn}
                    onPress={() => router.push('/(authentification)/connexion')}
                  >
                    <Text style={styles.secondaryBtnText}>
                      Déjà un compte ? <Text style={styles.boldText}>Se connecter</Text>
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
 container: { 
    flex: 1, 
    backgroundColor: '#000', 
    alignItems: 'center', // Centre le bloc de 500px au milieu de l'écran
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH, // Limite la largeur de l'image à 500px
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: { 
    flex: 1, 
    width: '100%', 
    alignItems: 'center' 
  },
  responsiveWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH, 
    ...(Platform.OS === 'web' && {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    })
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 32, 
    justifyContent: 'space-between', 
    paddingVertical: 40 
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Vert translucide
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(16, 185, 129, 0.2)' 
  },
  brandName: { fontSize: 13, fontFamily: 'PJS-ExtraBold', letterSpacing: 2, color: '#DCFCE7' }, // Vert très clair
  textContainer: { marginTop: height * 0.05 },
  title: { fontSize: 42, fontFamily: 'PJS-ExtraBold', color: '#FFF', lineHeight: 50, letterSpacing: -1.5 },
  subtitle: { fontSize: 16, fontFamily: 'PJS-Regular', color: 'rgba(255,255,255,0.8)', marginTop: 20, lineHeight: 26 },
  featuresRow: { flexDirection: 'row', gap: 12, marginTop: 30 },
  featureItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: 'rgba(255,255,255,0.1)', // Blanc translucide
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  featureText: { fontSize: 13, fontFamily: 'PJS-Bold', color: '#FFF' },
  footer: { gap: 15 },
  mainBtn: { 
    height: 72, 
    backgroundColor: '#000', // Noir pour un aspect premium
    borderRadius: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 24,
    shadowColor: '#10B981', // Ombre verte pour le bouton
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { height: 10, width: 0 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  mainBtnText: { color: '#FFF', fontSize: 14, fontFamily: 'PJS-ExtraBold', letterSpacing: 1 },
  btnIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  secondaryBtn: { alignItems: 'center', paddingVertical: 10 },
  secondaryBtnText: { fontSize: 14, fontFamily: 'PJS-Regular', color: 'rgba(255,255,255,0.7)' },
  boldText: { fontFamily: 'PJS-Bold', color: '#10B981' }
});