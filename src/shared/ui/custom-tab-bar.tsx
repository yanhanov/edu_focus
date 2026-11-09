import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/shared/ui/app-icon';
import { Spacing } from '@/shared/theme/theme';
import { APP_TABS } from '@/shared/theme/tabs';
import { useTheme } from '@/shared/hooks/use-theme';

const COMPACT_WIDTH = 380;

function CustomTabBarInner({ state, navigateToTab, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < COMPACT_WIDTH;
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? Spacing.two : Spacing.three);

  return (
    <View
      style={[
        styles.barOuter,
        {
          paddingBottom: bottomPad,
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundSelected,
        },
      ]}>
      <View style={styles.tabRow}>
        {APP_TABS.map((tab) => {
          const routeIndex = state.routes.findIndex((route) => route.name === tab.name);
          const route = state.routes[routeIndex];
          if (!route || routeIndex < 0) {
            return null;
          }
          const focused = state.index === routeIndex;
          const caption = tab.label;

          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                if (!focused) {
                  navigateToTab(route.key);
                }
              }}
              accessibilityRole="tab"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
              style={({ pressed }) => [
                styles.tabSlot,
                pressed && !focused && styles.tabPressed,
              ]}>
              <View
                style={[
                  styles.iconWrap,
                  focused && { backgroundColor: theme.accentSoft },
                ]}>
                <AppIcon
                  ios={focused ? tab.icon.ios.selected : tab.icon.ios.default}
                  android={focused ? tab.icon.android.selected : tab.icon.android.default}
                  color={focused ? theme.accent : theme.textSecondary}
                  size={focused ? 24 : 23}
                />
              </View>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.label,
                  compact && styles.labelCompact,
                  {
                    color: focused ? theme.accent : theme.textSecondary,
                    fontWeight: focused ? '700' : '500',
                  },
                ]}>
                {caption}
              </Text>
              <View
                style={[
                  styles.indicator,
                  { backgroundColor: focused ? theme.accent : 'transparent' },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const CustomTabBar = memo(CustomTabBarInner);

const styles = StyleSheet.create({
  barOuter: {
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.one,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    paddingVertical: Spacing.one,
    gap: 3,
  },
  tabPressed: {
    opacity: 0.55,
  },
  iconWrap: {
    width: 44,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    lineHeight: 13,
    textAlign: 'center',
    paddingHorizontal: 2,
    maxWidth: '100%',
  },
  labelCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
  indicator: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginTop: 1,
  },
});
