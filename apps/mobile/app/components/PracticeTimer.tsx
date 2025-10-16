import { StyleSheet, Text, View } from 'react-native';

interface PracticeTimerProps {
  elapsedSeconds: number;
}

export function PracticeTimer({ elapsedSeconds }: PracticeTimerProps) {
  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(elapsedSeconds % 60)
    .toString()
    .padStart(2, '0');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Practice timer</Text>
      <Text style={styles.time}>
        {minutes}:{seconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.3)'
  },
  label: {
    color: '#cbd5f5',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 4
  },
  time: {
    color: '#f8fafc',
    fontSize: 56,
    fontWeight: '600',
    fontVariant: ['tabular-nums']
  }
});
