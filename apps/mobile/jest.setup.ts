export {};

const emptyRows = {
  length: 0,
  item: () => undefined,
  _array: [] as unknown[]
};

jest.mock('expo-sqlite', () => {
  const mockResult = {
    rows: emptyRows,
    rowsAffected: 0,
    insertId: null
  };
  return {
    openDatabase: jest.fn(() => ({
      transaction: (callback: (tx: any) => void) => {
        const tx = {
          executeSql: (
            _sql: string,
            _params?: unknown[],
            success?: (_tx: unknown, result: typeof mockResult) => void,
            _error?: (_tx: unknown, err: Error) => void
          ) => {
            success?.(tx, mockResult);
            return false;
          }
        };
        callback(tx);
      }
    }))
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined)
}));

jest.mock('expo-linking', () => {
  const listeners = new Set<(event: { url: string }) => void>();
  return {
    addEventListener: jest.fn((_type: string, listener: (event: { url: string }) => void) => {
      listeners.add(listener);
      return {
        remove: () => listeners.delete(listener)
      };
    }),
    getInitialURL: jest.fn(async () => null),
    openURL: jest.fn(),
    parse: jest.fn((url: string) => {
      try {
        const parsed = new URL(url);
        const queryParams: Record<string, string> = {};
        parsed.searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });
        return {
          hostname: parsed.hostname,
          path: parsed.pathname,
          queryParams
        };
      } catch (error) {
        return { path: url, queryParams: {} };
      }
    })
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => () => undefined),
  fetch: jest.fn(async () => ({ isConnected: true }))
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'undetermined', granted: false })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted', granted: true })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[mock]' }))
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'mock-project' } } },
  easConfig: { projectId: 'mock-project' }
}));

class MockRecording {
  prepareToRecordAsync = jest.fn(async () => undefined);
  startAsync = jest.fn(async () => undefined);
  stopAndUnloadAsync = jest.fn(async () => undefined);
  getURI = jest.fn(() => 'file:///mock-recording.m4a');
}

jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
    setAudioModeAsync: jest.fn(async () => undefined),
    Recording: MockRecording
  }
}));
