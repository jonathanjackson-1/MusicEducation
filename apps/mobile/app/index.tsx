import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { TabNavigator, type TabKey } from './components/TabNavigator';
import { AuthProvider, useAuth } from './providers/AuthProvider';
import { PracticeQueueProvider, usePracticeQueue } from './hooks/usePracticeQueue';
import { HomeScreen } from './screens/HomeScreen';
import { AssignmentsScreen } from './screens/AssignmentsScreen';
import { PracticeScreen } from './screens/PracticeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SignInScreen } from './screens/SignInScreen';

function RootNavigator() {
  const { isLoading, token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const { logs } = usePracticeQueue();

  const pendingLogs = useMemo(() => logs.filter((log) => log.status !== 'synced').length, [logs]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#38bdf8" />
      </View>
    );
  }

  if (!token) {
    return <SignInScreen />;
  }

  return (
    <TabNavigator
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        {
          key: 'home',
          title: 'Home',
          icon: <Ionicons name="home-outline" size={18} color={activeTab === 'home' ? '#f8fafc' : '#94a3b8'} />,
          content: <HomeScreen onNavigate={setActiveTab} />
        },
        {
          key: 'assignments',
          title: 'Assignments',
          icon: (
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={activeTab === 'assignments' ? '#f8fafc' : '#94a3b8'}
            />
          ),
          content: <AssignmentsScreen />
        },
        {
          key: 'practice',
          title: 'Practice',
          badge: pendingLogs,
          icon: (
            <Ionicons
              name="timer-outline"
              size={18}
              color={activeTab === 'practice' ? '#f8fafc' : '#94a3b8'}
            />
          ),
          content: <PracticeScreen />
        },
        {
          key: 'profile',
          title: 'Profile',
          icon: (
            <Ionicons
              name="person-circle-outline"
              size={20}
              color={activeTab === 'profile' ? '#f8fafc' : '#94a3b8'}
            />
          ),
          content: <ProfileScreen />
        }
      ]}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PracticeQueueProvider>
          <StatusBar style="light" />
          <View style={styles.appContainer}>
            <RootNavigator />
          </View>
        </PracticeQueueProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#050816'
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050816'
  }
});
