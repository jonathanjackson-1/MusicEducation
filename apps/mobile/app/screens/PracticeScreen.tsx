import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Audio } from 'expo-av';

import { PracticeTimer } from '../components/PracticeTimer';
import { usePracticeQueue } from '../hooks/usePracticeQueue';
import { uploadAudioRecording } from '../services/api/client';
import { useAuth } from '../providers/AuthProvider';

const categories = ['Technique', 'Repertoire', 'Theory'];

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export function PracticeScreen() {
  const { queueLog, logs, retryLog, removeLog, sync, isSyncing } = usePracticeQueue();
  const { token } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const handleToggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleResetTimer = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
  }, []);

  const handleLogPractice = useCallback(async () => {
    if (elapsedSeconds < 60) {
      Alert.alert('Keep going', 'Log at least one minute of practice before saving.');
      return;
    }
    await queueLog({
      category: selectedCategory,
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      notes: notes.trim().length > 0 ? notes.trim() : undefined
    });
    setNotes('');
    handleResetTimer();
    Alert.alert('Logged offline', 'Your practice has been added to the offline queue.');
  }, [elapsedSeconds, handleResetTimer, notes, queueLog, selectedCategory]);

  const startRecording = useCallback(async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone needed', 'Enable microphone access to record your practice.');
      return;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true
    });
    const newRecording = new Audio.Recording();
    await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await newRecording.startAsync();
    setRecording(newRecording);
    setRecordedUri(null);
    setUploadedUrl(null);
    setUploadState('idle');
    setUploadProgress(0);
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    setRecordedUri(uri ?? null);
    setUploadState('idle');
    setUploadProgress(0);
  }, [recording]);

  const uploadRecording = useCallback(async () => {
    if (!recordedUri || !token) return;
    setUploadState('uploading');
    setUploadProgress(0);
    try {
      const { remoteUrl } = await uploadAudioRecording(token, recordedUri, (progress) => {
        setUploadProgress(progress);
      });
      setUploadedUrl(remoteUrl);
      setUploadState('success');
    } catch (error) {
      setUploadState('error');
    }
  }, [recordedUri, token]);

  const offlineLogs = useMemo(() => logs.slice(0, 5), [logs]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timer</Text>
        <PracticeTimer elapsedSeconds={elapsedSeconds} />
        <View style={styles.actionsRow}>
          <PrimaryButton label={isRunning ? 'Pause' : 'Start'} onPress={handleToggleTimer} />
          <SecondaryButton label="Reset" onPress={handleResetTimer} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.categoryRow}>
          {categories.map((category) => {
            const isActive = category === selectedCategory;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>{category}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          placeholder="What did you focus on?"
          placeholderTextColor="#64748b"
          value={notes}
          onChangeText={setNotes}
        />
        <PrimaryButton label="Log offline" onPress={handleLogPractice} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Offline queue</Text>
          <SecondaryButton label={isSyncing ? 'Syncing…' : 'Sync now'} onPress={sync} disabled={isSyncing} />
        </View>
        {offlineLogs.length === 0 ? (
          <Text style={styles.emptyState}>No offline logs yet.</Text>
        ) : (
          offlineLogs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.logTitle}>
                  {log.category} • {log.durationMinutes} min
                </Text>
                <Text style={styles.logMeta}>
                  {new Date(log.recordedAt).toLocaleString()} ({log.status})
                </Text>
                {log.auditNote ? <Text style={styles.logAudit}>{log.auditNote}</Text> : null}
              </View>
              <View style={styles.logActions}>
                {log.status !== 'synced' ? (
                  <SecondaryButton label="Retry" onPress={() => retryLog(log.id)} fullWidth={false} />
                ) : null}
                <SecondaryButton label="Remove" onPress={() => removeLog(log.id)} fullWidth={false} />
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Record &amp; upload</Text>
        <View style={styles.actionsRow}>
          <PrimaryButton
            label={recording ? 'Stop recording' : 'Start recording'}
            onPress={recording ? stopRecording : startRecording}
          />
          <SecondaryButton
            label="Upload"
            onPress={uploadRecording}
            disabled={!recordedUri || uploadState === 'uploading'}
          />
        </View>
        {uploadState === 'uploading' ? (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round(uploadProgress * 100)}%` }]} />
            <Text style={styles.progressLabel}>{Math.round(uploadProgress * 100)}%</Text>
          </View>
        ) : null}
        {uploadState === 'success' ? (
          <Text style={styles.successText}>Uploaded to {uploadedUrl}</Text>
        ) : null}
        {uploadState === 'error' ? (
          <Text style={styles.errorText}>Upload failed. Try again.</Text>
        ) : null}
        {!recordedUri && uploadState === 'idle' ? (
          <Text style={styles.emptyState}>Record your session to upload it for feedback.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
  fullWidth = true
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.buttonPrimary, !fullWidth && styles.buttonCompact, disabled && styles.buttonDisabled]}
      accessibilityRole="button"
    >
      <Text style={styles.buttonPrimaryLabel}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
  disabled,
  fullWidth = true
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.buttonSecondary, !fullWidth && styles.buttonCompact, disabled && styles.buttonDisabled]}
      accessibilityRole="button"
    >
      <Text style={styles.buttonSecondaryLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    gap: 24
  },
  section: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 18,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    gap: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(30, 41, 59, 0.65)'
  },
  categoryChipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.5)'
  },
  categoryLabel: {
    color: '#cbd5f5'
  },
  categoryLabelActive: {
    color: '#f8fafc',
    fontWeight: '600'
  },
  notesInput: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    minHeight: 80,
    padding: 12,
    color: '#f8fafc',
    backgroundColor: 'rgba(15, 23, 42, 0.5)'
  },
  emptyState: {
    color: '#64748b',
    fontStyle: 'italic'
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)'
  },
  logTitle: {
    color: '#f8fafc',
    fontWeight: '600'
  },
  logMeta: {
    color: '#94a3b8',
    fontSize: 12
  },
  logAudit: {
    color: '#f97316',
    fontSize: 12,
    marginTop: 4
  },
  logActions: {
    gap: 8
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  buttonPrimaryLabel: {
    color: '#0f172a',
    fontWeight: '700'
  },
  buttonSecondary: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    paddingVertical: 12,
    alignItems: 'center'
  },
  buttonCompact: {
    flex: undefined,
    paddingHorizontal: 16,
    minWidth: 96
  },
  buttonSecondaryLabel: {
    color: '#cbd5f5',
    fontWeight: '600'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  progressBar: {
    position: 'relative',
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    overflow: 'hidden',
    justifyContent: 'center'
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#38bdf8'
  },
  progressLabel: {
    color: '#0f172a',
    fontWeight: '700',
    textAlign: 'center'
  },
  successText: {
    color: '#4ade80'
  },
  errorText: {
    color: '#f87171'
  }
});
