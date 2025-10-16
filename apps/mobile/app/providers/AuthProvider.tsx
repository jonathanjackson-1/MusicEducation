import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

import {
  requestMagicLink,
  resolveProfile,
  type UserProfile
} from '../services/api/client';

interface AuthContextValue {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  lastMagicLink?: string | null;
  requestSignInLink: (email: string) => Promise<string>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'soundstudio/authToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [lastMagicLink, setLastMagicLink] = useState<string | null>(null);

  const handleToken = useCallback(async (nextToken: string | null) => {
    if (!nextToken) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      setUser(null);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
    setToken(nextToken);
  }, []);

  const handleIncomingUrl = useCallback(
    async (url: string | null) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const tokenParam = parsed.queryParams?.token;
      if (typeof tokenParam === 'string' && tokenParam.length > 0) {
        setLastMagicLink(url);
        await handleToken(tokenParam);
      }
    },
    [handleToken]
  );

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) {
        setToken(stored);
      }
      setInitializing(false);
    })();
  }, []);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      handleIncomingUrl(event.url);
    });
    return () => subscription.remove();
  }, [handleIncomingUrl]);

  useEffect(() => {
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleIncomingUrl(initialUrl);
      }
    })();
  }, [handleIncomingUrl]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    resolveProfile(token)
      .then((profile) => {
        if (!cancelled) {
          setUser(profile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProfileLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const requestSignInLink = useCallback(async (email: string) => {
    const { deepLink } = await requestMagicLink(email.trim().toLowerCase());
    setLastMagicLink(deepLink);
    return deepLink;
  }, []);

  const signOut = useCallback(async () => {
    await handleToken(null);
  }, [handleToken]);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isLoading: initializing || profileLoading,
    lastMagicLink,
    requestSignInLink,
    signOut
  }), [initializing, lastMagicLink, profileLoading, requestSignInLink, signOut, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
