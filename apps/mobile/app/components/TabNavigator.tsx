import { ReactNode, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type TabKey = 'home' | 'assignments' | 'practice' | 'profile';

export interface TabConfig {
  key: TabKey;
  title: string;
  icon?: ReactNode;
  badge?: number;
  content: ReactNode;
}

interface TabNavigatorProps {
  tabs: TabConfig[];
  initialTab?: TabKey;
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
}

export function TabNavigator({ tabs, initialTab = 'home', activeTab: controlledTab, onTabChange }: TabNavigatorProps) {
  const [uncontrolledTab, setUncontrolledTab] = useState<TabKey>(initialTab);
  const activeTab = controlledTab ?? uncontrolledTab;

  const active = useMemo(() => tabs.find((tab) => tab.key === activeTab) ?? tabs[0], [activeTab, tabs]);

  const handleChange = (tab: TabKey) => {
    if (controlledTab === undefined) {
      setUncontrolledTab(tab);
    }
    onTabChange?.(tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{active?.content}</View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleChange(tab.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              {tab.icon ? <View style={styles.icon}>{tab.icon}</View> : null}
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.title}</Text>
              {typeof tab.badge === 'number' && tab.badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeLabel}>{tab.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816'
  },
  content: {
    flex: 1
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.9)'
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    gap: 6
  },
  tabButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)'
  },
  icon: {
    marginRight: 4
  },
  tabLabel: {
    color: '#cbd5f5',
    fontSize: 13,
    fontWeight: '500'
  },
  tabLabelActive: {
    color: '#f8fafc'
  },
  badge: {
    marginLeft: 6,
    backgroundColor: '#f97316',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  badgeLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600'
  }
});
