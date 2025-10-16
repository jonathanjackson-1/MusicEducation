import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

export default function App() {
  const now = useMemo(() => new Date().toLocaleTimeString(), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Soundstudio Mobile</Text>
        <Text style={styles.subtitle}>Practice anywhere, anytime.</Text>
        <Text style={styles.timestamp}>Synced at {now}</Text>
        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050816'
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#f9fafb'
  },
  subtitle: {
    fontSize: 18,
    color: '#d1d5db'
  },
  timestamp: {
    fontSize: 14,
    color: '#9ca3af'
  }
});
