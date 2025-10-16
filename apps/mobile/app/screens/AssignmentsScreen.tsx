import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Pressable
} from 'react-native';
import { useAssignments } from '../hooks/useAssignments';

export function AssignmentsScreen() {
  const { assignments, isLoading, refresh, toggleCompletion } = useAssignments();

  const handleToggle = useCallback(
    async (id: string, completed: boolean) => {
      try {
        await toggleCompletion(id, completed);
      } catch (error) {
        // handled in hook
      }
    },
    [toggleCompletion]
  );

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={assignments}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl tintColor="#f8fafc" refreshing={isLoading} onRefresh={refresh} />}
      ListHeaderComponent={() => (
        <View style={styles.header}>
          <Text style={styles.title}>Assignments</Text>
          <Text style={styles.caption}>Toggle items when you finish them.</Text>
        </View>
      )}
      ListEmptyComponent={() => (
        <View style={styles.empty}>
          {isLoading ? (
            <ActivityIndicator color="#38bdf8" />
          ) : (
            <Text style={styles.emptyText}>No assignments yet.</Text>
          )}
        </View>
      )}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => handleToggle(item.id, !item.completed)}
          style={[styles.assignment, item.completed && styles.assignmentCompleted]}
        >
          <View style={styles.assignmentHeader}>
            <Text style={styles.assignmentTitle}>{item.title}</Text>
            <Text style={styles.assignmentCategory}>{item.category.toUpperCase()}</Text>
          </View>
          <Text style={styles.assignmentDescription}>{item.description}</Text>
          <View style={styles.assignmentFooter}>
            <Text style={styles.assignmentDue}>Due {new Date(item.dueAt).toLocaleDateString()}</Text>
            <Text style={styles.assignmentStatus}>{item.completed ? 'Completed' : 'Mark complete'}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    gap: 12
  },
  header: {
    marginBottom: 12
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '600'
  },
  caption: {
    color: '#94a3b8'
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center'
  },
  emptyText: {
    color: '#64748b'
  },
  assignment: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    gap: 8
  },
  assignmentCompleted: {
    opacity: 0.6,
    borderColor: 'rgba(148, 163, 184, 0.5)'
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  assignmentTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    flex: 1
  },
  assignmentCategory: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600'
  },
  assignmentDescription: {
    color: '#cbd5f5',
    fontSize: 14
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  assignmentDue: {
    color: '#94a3b8',
    fontSize: 12
  },
  assignmentStatus: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600'
  }
});
