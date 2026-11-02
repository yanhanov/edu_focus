// @ts-nocheck
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { APP_TABS, type AppTabName } from '@/constants/tabs';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedView } from './themed-view';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <FloatingTabBar />
      </TabList>
    </Tabs>
  );
}

function FloatingTabBar(props: TabListProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[
        styles.outer,
        props.style,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.two),
        },
      ]}>
      <ThemedView
        type="backgroundElement"
        style={[
          styles.bar,
          Platform.OS === 'web'
            ? { boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }
            : {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: theme.background === '#000000' ? 0.35 : 0.12,
                shadowRadius: 20,
                elevation: 12,
              },
        ]}>
        {APP_TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabIconButton name={tab.name} />
          </TabTrigger>
        ))}
      </ThemedView>
    </View>
  );
}

function TabIconButton({
  name,
  isFocused,
  ...props
}: TabTriggerSlotProps & { name: AppTabName }) {
  const theme = useTheme();
  const tab = APP_TABS.find((item) => item.name === name);
  if (!tab) {
    return null;
  }

  return (
    <Pressable
      {...props}
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [styles.tabPressable, pressed && styles.pressed]}>
      <ThemedView
        style={[
          styles.tabSlot,
          isFocused && { backgroundColor: theme.accentSoft },
        ]}>
        <AppIcon
          ios={isFocused ? tab.icon.ios.selected : tab.icon.ios.default}
          android={isFocused ? tab.icon.android.selected : tab.icon.android.default}
          color={isFocused ? theme.accent : theme.textSecondary}
          size={24}
        />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  bar: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 28,
    gap: Spacing.one,
  },
  tabPressable: {
    flex: 1,
    alignItems: 'center',
  },
  tabSlot: {
    width: 52,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.75,
  },
});
