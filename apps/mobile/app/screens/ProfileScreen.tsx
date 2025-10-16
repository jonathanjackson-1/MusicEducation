import { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View, Pressable } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { useNotifications } from '../hooks/useNotifications';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { settings, updateSetting, permissionStatus, requestPermissions, pushToken } = useNotifications();

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const handleRequestPermissions = useCallback(async () => {
    await requestPermissions();
    Alert.alert('All set', 'Notification preferences updated.');
  }, [requestPermissions]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{user?.name?.[0] ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Unknown student'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Pressable style={styles.signOutButton} onPress={handleSignOut} accessibilityRole="button">
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Push notifications</Text>
        <Text style={styles.caption}>Permission status: {permissionStatus ?? 'unknown'}</Text>
        <Pressable style={styles.primaryButton} onPress={handleRequestPermissions} accessibilityRole="button">
          <Text style={styles.primaryButtonLabel}>Enable push notifications</Text>
        </Pressable>
        {pushToken ? <Text style={styles.caption}>Expo token: {pushToken}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Notification settings</Text>
        {settings ? (
          <View style={styles.settingsList}>
            <NotificationToggle
              label="Daily reminder"
              value={settings.dailyReminder}
              onChange={(value) => updateSetting('dailyReminder', value)}
            />
            <NotificationToggle
              label="Assignment updates"
              value={settings.assignmentUpdates}
              onChange={(value) => updateSetting('assignmentUpdates', value)}
            />
            <NotificationToggle
              label="Product news"
              value={settings.productNews}
              onChange={(value) => updateSetting('productNews', value)}
            />
          </View>
        ) : (
          <Text style={styles.caption}>Loading settings…</Text>
        )}
      </View>
    </ScrollView>
  );
}

function NotificationToggle({
  label,
  value,
  onChange
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} thumbColor="#38bdf8" trackColor={{ true: '#bae6fd', false: '#64748b' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    gap: 24
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 18,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    gap: 16,
    alignItems: 'center'
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600'
  },
  caption: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center'
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarLabel: {
    fontSize: 28,
    color: '#38bdf8',
    fontWeight: '700'
  },
  name: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600'
  },
  email: {
    color: '#94a3b8'
  },
  signOutButton: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(248, 113, 113, 0.6)',
    paddingVertical: 10,
    paddingHorizontal: 18
  },
  signOutLabel: {
    color: '#f87171',
    fontWeight: '600'
  },
  primaryButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  primaryButtonLabel: {
    color: '#0f172a',
    fontWeight: '700'
  },
  settingsList: {
    alignSelf: 'stretch',
    gap: 12
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  toggleLabel: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '500'
  }
});
