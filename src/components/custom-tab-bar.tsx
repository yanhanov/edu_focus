import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { APP_TABS } from '@/constants/tabs';
import { useTheme } from '@/hooks/use-theme';

export function CustomTabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.barOuter,
        {
          paddingBottom: Math.max(insets.bottom, 6),
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundSelected,
        },
      ]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = APP_TABS.find((item) => item.name === route.name);
        if (!tab) {
          return null;
        }

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              if (!focused) {
                navigateToTab(route.key);
              }
            }}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={tab.label}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
            <View style={[styles.iconBadge, focused && { backgroundColor: theme.accentSoft }]}>
              <AppIcon
                ios={focused ? tab.icon.ios.selected : tab.icon.ios.default}
                android={focused ? tab.icon.android.selected : tab.icon.android.default}
                color={focused ? theme.accent : theme.textSecondary}
                size={22}
              />
            </View>
            <ThemedText
              type="small"
              numberOfLines={1}
              style={[styles.label, { color: focused ? theme.accent : theme.textSecondary }]}>
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barOuter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    minWidth: 0,
  },
  iconBadge: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.65,
  },
});
