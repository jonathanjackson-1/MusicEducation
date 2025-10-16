import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import {
  fetchNotificationSettings,
  registerPushToken,
  updateNotificationSettings,
  type NotificationSettings
} from '../services/api/client';
import { useAuth } from '../providers/AuthProvider';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

interface UseNotificationsResult {
  settings: NotificationSettings | null;
  isLoading: boolean;
  permissionStatus: Notifications.PermissionStatus | null;
  pushToken: string | null;
  refresh: () => Promise<void>;
  requestPermissions: () => Promise<void>;
  updateSetting: <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const { token } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const remote = await fetchNotificationSettings(token);
      setSettings(remote);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const ensurePermissions = useCallback(async () => {
    const permissions = await Notifications.getPermissionsAsync();
    setPermissionStatus(permissions.status);
    if (permissions.status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      setPermissionStatus(requested.status);
      if (requested.status !== 'granted') {
        return null;
      }
    }
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const expoToken = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return expoToken.data;
  }, []);

  const requestPermissions = useCallback(async () => {
    if (!token) return;
    const obtained = await ensurePermissions();
    if (obtained) {
      setPushToken(obtained);
      await registerPushToken(token, obtained);
    }
  }, [ensurePermissions, token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const permissions = await Notifications.getPermissionsAsync();
      setPermissionStatus(permissions.status);
      if (permissions.status === 'granted') {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        const expoToken = projectId
          ? await Notifications.getExpoPushTokenAsync({ projectId })
          : await Notifications.getExpoPushTokenAsync();
        setPushToken(expoToken.data);
      }
    })();
  }, [token]);

  const updateSetting = useCallback(
    async <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
      if (!token || !settings) return;
      const optimistic = { ...settings, [key]: value } as NotificationSettings;
      setSettings(optimistic);
      try {
        const saved = await updateNotificationSettings(token, optimistic);
        setSettings(saved);
      } catch (err) {
        setSettings(settings);
        throw err;
      }
    },
    [settings, token]
  );

  return useMemo(
    () => ({
      settings,
      isLoading,
      permissionStatus,
      pushToken,
      refresh: loadSettings,
      requestPermissions,
      updateSetting
    }),
    [isLoading, loadSettings, permissionStatus, pushToken, requestPermissions, settings, updateSetting]
  );
}
