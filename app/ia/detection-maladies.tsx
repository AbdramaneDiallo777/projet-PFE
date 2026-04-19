import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DARK_GREEN = '#064E3B';

/**
 * Le flux caméra + envoi au backend ML est implémenté dans
 * `tableau-de-bord/scan.tsx` (POST /api/v1/ml/predict).
 */
export default function DetectionMaladiesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={DARK_GREEN} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Scan IA AgroConnect Africa</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.cameraFrame}>
        <View style={styles.emptyView}>
          <Ionicons name="camera-outline" size={80} color={DARK_GREEN} />
          <Text style={styles.guideText}>
            Utilisez l&apos;écran « Diagnostic IA » du tableau de bord : la photo est analysée via le backend
            (service ML TFLite).
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/tableau-de-bord/scan')}>
        <Text style={styles.btnText}>Ouvrir le scan caméra</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: DARK_GREEN },
  cameraFrame: { flex: 1, margin: 20, borderRadius: 30, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F1F5F9', borderStyle: 'dashed' },
  emptyView: { alignItems: 'center' },
  guideText: { marginTop: 15, color: '#64748B', textAlign: 'center' },
  actionBtn: { backgroundColor: DARK_GREEN, margin: 25, height: 65, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 17 },
  loaderBox: { alignItems: 'center' },
  loaderText: { marginTop: 15, fontWeight: '600', color: DARK_GREEN },
  resultBox: { padding: 20, alignItems: 'center' },
  resTitle: { fontSize: 22, fontWeight: 'bold', color: '#B91C1C', marginVertical: 10 },
  resText: { textAlign: 'center', color: '#475569', lineHeight: 22 }
});