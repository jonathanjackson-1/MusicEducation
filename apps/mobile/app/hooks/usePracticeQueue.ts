import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';

import { syncPracticeLog, type PracticeLogRecord } from '../services/api/client';
import { useAuth } from '../providers/AuthProvider';

const db = SQLite.openDatabase('practice-queue.db');

interface PracticeQueueItem extends PracticeLogRecord {}

interface QueueInput {
  category: string;
  durationMinutes: number;
  notes?: string;
}

interface PracticeQueueValue {
  logs: PracticeQueueItem[];
  isSyncing: boolean;
  queueLog: (input: QueueInput) => Promise<void>;
  sync: () => Promise<void>;
  retryLog: (id: string) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
}

function executeSql(sql: string, params: (string | number | null)[] = []): Promise<SQLite.SQLResultSet> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, result) => {
          resolve(result);
          return false;
        },
        (_, error) => {
          reject(error);
          return true;
        }
      );
    });
  });
}

function mapRow(row: Record<string, unknown>): PracticeQueueItem {
  return {
    id: String(row.id),
    category: String(row.category),
    durationMinutes: Number(row.durationMinutes),
    recordedAt: String(row.recordedAt),
    notes: row.notes ? String(row.notes) : undefined,
    status: row.status as PracticeQueueItem['status'],
    updatedAt: Number(row.updatedAt),
    auditNote: row.auditNote ? String(row.auditNote) : null
  };
}

function useProvidePracticeQueue(): PracticeQueueValue {
  const { token } = useAuth();
  const [logs, setLogs] = useState<PracticeQueueItem[]>([]);
  const [isSyncing, setSyncing] = useState(false);

  const loadLogs = useCallback(async () => {
    await executeSql(
      'CREATE TABLE IF NOT EXISTS practice_logs (id TEXT PRIMARY KEY NOT NULL, category TEXT NOT NULL, durationMinutes INTEGER NOT NULL, recordedAt TEXT NOT NULL, notes TEXT, status TEXT NOT NULL, updatedAt INTEGER NOT NULL, auditNote TEXT)'
    );
    const result = await executeSql(
      'SELECT * FROM practice_logs ORDER BY updatedAt DESC'
    );
    const rows: PracticeQueueItem[] = [];
    for (let i = 0; i < result.rows.length; i += 1) {
      rows.push(mapRow(result.rows.item(i)));
    }
    setLogs(rows);
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const queueLog = useCallback(
    async (input: QueueInput) => {
      const id = `log-${Math.random().toString(36).slice(2)}`;
      const recordedAt = new Date().toISOString();
      const updatedAt = Date.now();
      await executeSql(
        'INSERT OR REPLACE INTO practice_logs (id, category, durationMinutes, recordedAt, notes, status, updatedAt, auditNote) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          input.category,
          input.durationMinutes,
          recordedAt,
          input.notes ?? null,
          'pending',
          updatedAt,
          null
        ]
      );
      await loadLogs();
    },
    [loadLogs]
  );

  const syncLogById = useCallback(
    async (id: string) => {
      if (!token) return;
      const result = await executeSql('SELECT * FROM practice_logs WHERE id = ? LIMIT 1', [id]);
      if (result.rows.length === 0) return;
      const row = mapRow(result.rows.item(0));
      const payload = {
        id: row.id,
        category: row.category,
        durationMinutes: row.durationMinutes,
        recordedAt: row.recordedAt,
        updatedAt: Date.now(),
        notes: row.notes
      };
      const response = await syncPracticeLog(token, payload);
      await executeSql(
        'UPDATE practice_logs SET category = ?, durationMinutes = ?, recordedAt = ?, notes = ?, status = ?, updatedAt = ?, auditNote = ? WHERE id = ?',
        [
          response.log.category,
          response.log.durationMinutes,
          response.log.recordedAt,
          response.log.notes ?? null,
          response.status,
          response.log.updatedAt,
          response.log.auditNote ?? null,
          id
        ]
      );
    },
    [token]
  );

  const sync = useCallback(async () => {
    if (!token) return;
    setSyncing(true);
    try {
      const result = await executeSql('SELECT id FROM practice_logs WHERE status != ? ORDER BY updatedAt ASC', [
        'synced'
      ]);
      for (let i = 0; i < result.rows.length; i += 1) {
        const row = result.rows.item(i);
        await syncLogById(String(row.id));
      }
    } finally {
      setSyncing(false);
      await loadLogs();
    }
  }, [loadLogs, syncLogById, token]);

  const retryLog = useCallback(
    async (id: string) => {
      await syncLogById(id);
      await loadLogs();
    },
    [loadLogs, syncLogById]
  );

  const removeLog = useCallback(
    async (id: string) => {
      await executeSql('DELETE FROM practice_logs WHERE id = ?', [id]);
      await loadLogs();
    },
    [loadLogs]
  );

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        sync();
      }
    });
    return () => unsubscribe();
  }, [sync]);

  return useMemo(
    () => ({ logs, isSyncing, queueLog, sync, retryLog, removeLog }),
    [isSyncing, logs, queueLog, removeLog, retryLog, sync]
  );
}

const PracticeQueueContext = createContext<PracticeQueueValue | undefined>(undefined);

export function PracticeQueueProvider({ children }: { children: ReactNode }) {
  const value = useProvidePracticeQueue();
  return <PracticeQueueContext.Provider value={value}>{children}</PracticeQueueContext.Provider>;
}

export function usePracticeQueue(): PracticeQueueValue {
  const ctx = useContext(PracticeQueueContext);
  if (!ctx) {
    throw new Error('usePracticeQueue must be used within a PracticeQueueProvider');
  }
  return ctx;
}
