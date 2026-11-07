import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { APP_TABS } from '@/constants/tabs';
import { useTheme } from '@/hooks/use-theme';

export function CustomTabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const iconSize = compact ? 20 : 22;

  return (
    <View
      style={[
        styles.barOuter,
        {
          paddingBottom: Math.max(insets.bottom, 8),
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
            <View
              style={[
                styles.iconBadge,
                compact && styles.iconBadgeCompact,
                focused && { backgroundColor: theme.accentSoft },
              ]}>
              <AppIcon
                ios={focused ? tab.icon.ios.selected : tab.icon.ios.default}
                android={focused ? tab.icon.android.selected : tab.icon.android.default}
                color={focused ? theme.accent : theme.textSecondary}
                size={iconSize}
              />
            </View>
            <ThemedText
              type="small"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              style={[
                styles.label,
                compact && styles.labelCompact,
                { color: focused ? theme.accent : theme.textSecondary },
              ]}>
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
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    minWidth: 0,
    maxWidth: '25%',
  },
  iconBadge: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeCompact: {
    width: 36,
    height: 28,
    borderRadius: 14,
  },
  label: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  labelCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
  pressed: {
    opacity: 0.65,
  },
});
