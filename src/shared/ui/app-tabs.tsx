import { NativeTabs } from "expo-router/native-tabs";
import { Platform } from "react-native";

import { APP_TABS } from "@/shared/theme/tabs";
import { useTheme } from "@/shared/hooks/use-theme";

export default function AppTabs() {
  const colors = useTheme();

  const androidTabs = Platform.OS === "android";

  return (
    <NativeTabs
      backgroundColor={colors.background}
      iconColor={{
        default: colors.textSecondary,
        selected: colors.accent,
      }}
      tintColor={colors.accent}
      disableIndicator={androidTabs}
      indicatorColor={colors.accentSoft}
      rippleColor={colors.accentSoft}
      labelVisibilityMode="unlabeled"
      tabBarRespectsIMEInsets={androidTabs}
    >
      {APP_TABS.map((tab) => (
        <NativeTabs.Trigger
          key={tab.name}
          name={tab.name}
          accessibilityLabel={tab.label}
        >
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
