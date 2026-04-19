import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

export default function MapsWebScreen() {
  const openDocs = () => {
    Linking.openURL('https://docs.expo.dev/versions/latest/sdk/map-view/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Carte indisponible sur le web</Text>
        <Text style={styles.body}>
          Cette vue utilise des composants natifs mobiles. Utilise Expo Go (Android/iOS)
          pour tester toutes les fonctionnalites cartographiques.
        </Text>
        <TouchableOpacity style={styles.button} onPress={openDocs} activeOpacity={0.85}>
          <Text style={styles.buttonText}>En savoir plus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  title: {
    color: '#f9fafb',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  body: {
    color: '#d1d5db',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
