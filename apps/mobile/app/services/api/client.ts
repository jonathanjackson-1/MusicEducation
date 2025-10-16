import { LessonSummary } from '@soundstudio/types';

type Token = string;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  streakDays: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueAt: string;
  completed: boolean;
  category: 'technique' | 'theory' | 'repertoire';
}

export interface PracticeLogPayload {
  id: string;
  category: string;
  durationMinutes: number;
  recordedAt: string;
  updatedAt: number;
  notes?: string;
}

export interface PracticeLogRecord extends PracticeLogPayload {
  status: 'pending' | 'synced' | 'conflict';
  auditNote?: string | null;
}

export interface PracticeSyncResult {
  status: PracticeLogRecord['status'];
  log: PracticeLogRecord;
}

export interface NotificationSettings {
  dailyReminder: boolean;
  assignmentUpdates: boolean;
  productNews: boolean;
}

interface RemoteState {
  assignments: Assignment[];
  practiceLogs: Map<string, PracticeLogRecord>;
  users: Map<Token, UserProfile>;
  notificationSettings: Map<Token, NotificationSettings>;
  pushTokens: Set<string>;
}

const remoteState: RemoteState = {
  assignments: [
    {
      id: 'asg-1',
      title: 'Major scale warm-up',
      description: 'Play C major scale at 90bpm with metronome for 5 minutes.',
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      completed: false,
      category: 'technique'
    },
    {
      id: 'asg-2',
      title: 'Sight-reading etude',
      description: 'Practice the new etude on page 12 for 10 minutes.',
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
      completed: false,
      category: 'repertoire'
    },
    {
      id: 'asg-3',
      title: 'Theory quiz prep',
      description: 'Review intervals for the upcoming quiz.',
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      completed: true,
      category: 'theory'
    }
  ],
  practiceLogs: new Map(),
  users: new Map(),
  notificationSettings: new Map(),
  pushTokens: new Set()
};

const defaultProfile: UserProfile = {
  id: 'user-1',
  name: 'Taylor Rivers',
  email: 'taylor@soundstudio.app',
  avatarColor: '#38bdf8',
  streakDays: 5
};

const defaultLesson: LessonSummary = {
  id: 'lesson-42',
  title: 'Arpeggios and Voicings',
  level: 'intermediate',
  durationMinutes: 35
};

const defaultNotificationSettings: NotificationSettings = {
  dailyReminder: true,
  assignmentUpdates: true,
  productNews: false
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function ensureUser(token: Token) {
  if (!remoteState.users.has(token)) {
    remoteState.users.set(token, { ...defaultProfile, id: `user-${token.slice(0, 6)}` });
  }
  if (!remoteState.notificationSettings.has(token)) {
    remoteState.notificationSettings.set(token, { ...defaultNotificationSettings });
  }
}

export async function requestMagicLink(email: string): Promise<{ deepLink: string }> {
  await delay(400);
  const token = `token-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  const deepLink = `soundstudio://auth?token=${encodeURIComponent(token)}`;
  ensureUser(token);
  return { deepLink };
}

export async function resolveProfile(token: Token): Promise<UserProfile> {
  await delay(200);
  ensureUser(token);
  const profile = remoteState.users.get(token)!;
  return { ...profile };
}

export async function fetchNextLesson(token: Token): Promise<LessonSummary> {
  await delay(150);
  ensureUser(token);
  return { ...defaultLesson };
}

export async function fetchAssignments(token: Token): Promise<Assignment[]> {
  await delay(200);
  ensureUser(token);
  return remoteState.assignments.map((assignment) => ({ ...assignment }));
}

export async function toggleAssignmentCompletion(
  token: Token,
  assignmentId: string,
  completed: boolean
): Promise<Assignment> {
  await delay(250);
  ensureUser(token);
  const assignment = remoteState.assignments.find((item) => item.id === assignmentId);
  if (!assignment) {
    throw new Error('Assignment not found');
  }
  assignment.completed = completed;
  return { ...assignment };
}

export async function uploadAudioRecording(
  token: Token,
  fileUri: string,
  onProgress?: (progress: number) => void
): Promise<{ remoteUrl: string }> {
  await delay(100);
  ensureUser(token);
  const steps = 10;
  for (let i = 1; i <= steps; i += 1) {
    await delay(120);
    onProgress?.(i / steps);
  }
  const remoteUrl = `https://cdn.soundstudio.app/uploads/${encodeURIComponent(
    fileUri.split('/').pop() ?? 'practice'
  )}`;
  return { remoteUrl };
}

export async function syncPracticeLog(
  token: Token,
  payload: PracticeLogPayload
): Promise<PracticeSyncResult> {
  await delay(220);
  ensureUser(token);
  const existing = remoteState.practiceLogs.get(payload.id);
  if (!existing || payload.updatedAt >= existing.updatedAt) {
    const record: PracticeLogRecord = {
      ...payload,
      status: 'synced',
      auditNote: existing && payload.updatedAt > existing.updatedAt ? existing.auditNote : null
    };
    remoteState.practiceLogs.set(payload.id, record);
    return { status: 'synced', log: { ...record } };
  }

  const record: PracticeLogRecord = {
    ...existing,
    status: 'conflict',
    auditNote: `Server version kept. Local update at ${new Date(payload.updatedAt).toLocaleString()} overwritten.`
  };
  remoteState.practiceLogs.set(payload.id, record);
  return { status: 'conflict', log: { ...record } };
}

export async function fetchNotificationSettings(token: Token): Promise<NotificationSettings> {
  await delay(150);
  ensureUser(token);
  return { ...(remoteState.notificationSettings.get(token) ?? defaultNotificationSettings) };
}

export async function updateNotificationSettings(
  token: Token,
  settings: NotificationSettings
): Promise<NotificationSettings> {
  await delay(200);
  ensureUser(token);
  remoteState.notificationSettings.set(token, { ...settings });
  return { ...settings };
}

export async function registerPushToken(token: Token, pushToken: string): Promise<void> {
  await delay(120);
  ensureUser(token);
  remoteState.pushTokens.add(pushToken);
}
