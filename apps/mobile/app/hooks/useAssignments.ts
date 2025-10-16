import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fetchAssignments,
  toggleAssignmentCompletion,
  type Assignment
} from '../services/api/client';
import { useAuth } from '../providers/AuthProvider';

interface UseAssignmentsResult {
  assignments: Assignment[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  toggleCompletion: (assignmentId: string, nextValue: boolean) => Promise<void>;
}

export function useAssignments(): UseAssignmentsResult {
  const { token } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAssignments(token);
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load assignments');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleCompletion = useCallback(
    async (assignmentId: string, nextValue: boolean) => {
      if (!token) return;
      setAssignments((prev) =>
        prev.map((item) => (item.id === assignmentId ? { ...item, completed: nextValue } : item))
      );
      try {
        const updated = await toggleAssignmentCompletion(token, assignmentId, nextValue);
        setAssignments((prev) =>
          prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
        );
      } catch (err) {
        setAssignments((prev) =>
          prev.map((item) =>
            item.id === assignmentId ? { ...item, completed: !nextValue } : item
          )
        );
        setError(err instanceof Error ? err.message : 'Unable to update assignment');
        throw err;
      }
    },
    [token]
  );

  return useMemo(
    () => ({ assignments, isLoading, error, refresh: load, toggleCompletion }),
    [assignments, error, isLoading, load, toggleCompletion]
  );
}
