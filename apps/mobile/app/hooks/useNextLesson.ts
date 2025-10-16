import { useCallback, useEffect, useState } from 'react';
import { fetchNextLesson } from '../services/api/client';
import { useAuth } from '../providers/AuthProvider';
import type { LessonSummary } from '@soundstudio/types';

export function useNextLesson() {
  const { token } = useAuth();
  const [lesson, setLesson] = useState<LessonSummary | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchNextLesson(token);
      setLesson(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load lesson');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { lesson, isLoading, error, refresh: load };
}
