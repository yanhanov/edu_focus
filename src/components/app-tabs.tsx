import { NativeTabs } from 'expo-router/native-tabs';
import { Platform } from 'react-native';

import { APP_TABS } from '@/constants/tabs';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      iconColor={{
        default: colors.textSecondary,
        selected: colors.accent,
      }}
      tintColor={colors.accent}
      indicatorColor={colors.accentSoft}
      rippleColor={colors.accentSoft}
      labelVisibilityMode="unlabeled"
      tabBarRespectsIMEInsets={Platform.OS === 'android'}>
      {APP_TABS.map((tab) => (
        <NativeTabs.Trigger
          key={tab.name}
          name={tab.name}
          accessibilityLabel={tab.label}>
          <NativeTabs.Trigger.Label hidden />
          <NativeTabs.Trigger.Icon
            sf={{
              default: tab.icon.ios.default as never,
              selected: tab.icon.ios.selected as never,
            }}
            md={{
              default: tab.icon.android.default as never,
              selected: tab.icon.android.selected as never,
            }}
          />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
