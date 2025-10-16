import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useMemo } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useNextLesson } from '../hooks/useNextLesson';
import { usePracticeQueue } from '../hooks/usePracticeQueue';
import type { TabKey } from '../components/TabNavigator';

interface HomeScreenProps {
  onNavigate?: (tab: TabKey) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user } = useAuth();
  const { lesson } = useNextLesson();
  const { logs } = usePracticeQueue();

  const pendingLogs = useMemo(() => logs.filter((log) => log.status !== 'synced').length, [logs]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] ?? 'there'} 👋</Text>
      <Text style={styles.subtitle}>Here&apos;s what&apos;s ahead for your practice.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next lesson</Text>
        {lesson ? (
          <View>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            <Text style={styles.lessonMeta}>
              {lesson.level.toUpperCase()} • {lesson.durationMinutes} minutes
            </Text>
          </View>
        ) : (
          <Text style={styles.lessonEmpty}>Fetching your next lesson...</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick actions</Text>
        <View style={styles.quickActions}>
          <QuickAction
            title="Start practice"
            description="Jump to the timer and queue a log."
            onPress={() => onNavigate?.('practice')}
          />
          <QuickAction
            title="Check assignments"
            description="See what&apos;s due this week."
            onPress={() => onNavigate?.('assignments')}
          />
          <QuickAction
            title="Manage profile"
            description="Notifications, recordings and more."
            onPress={() => onNavigate?.('profile')}
          />
        </View>
      </View>

      {pendingLogs > 0 ? (
        <View style={[styles.card, styles.pendingCard]}>
          <Text style={styles.cardTitle}>Offline queue</Text>
          <Text style={styles.pendingText}>
            {pendingLogs} practice log{pendingLogs === 1 ? '' : 's'} will sync when you&apos;re back online.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function QuickAction({
  title,
  description,
  onPress
}: {
  title: string;
  description: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.quickAction}>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionDescription}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    gap: 24
  },
  greeting: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '600'
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 15
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 18,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    gap: 12
  },
  cardTitle: {
    color: '#cbd5f5',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontSize: 12
  },
  lessonTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600'
  },
  lessonMeta: {
    color: '#94a3b8'
  },
  lessonEmpty: {
    color: '#64748b',
    fontStyle: 'italic'
  },
  quickActions: {
    gap: 12
  },
  quickAction: {
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.25)'
  },
  quickActionTitle: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 16
  },
  quickActionDescription: {
    color: '#94a3b8',
    marginTop: 4,
    fontSize: 13
  },
  pendingCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)'
  },
  pendingText: {
    color: '#fde68a',
    fontSize: 14
  }
});
