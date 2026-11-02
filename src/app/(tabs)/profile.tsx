import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  GroupPicker,
  NotificationPicker,
  SubgroupPicker,
  ThemePicker,
} from '@/components/profile/profile-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { ensureNotificationPermissionsRuntime } from '@/lib/notifications-runtime';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, group, setGroupId, setSubgroup, setTheme, setNotifications } = useProfile();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
          },
        ]}>
        <ThemedView style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            {group.title}
            {profile.subgroup ? ` · подгруппа ${profile.subgroup}` : ''}
          </ThemedText>
          <ThemedText type="subtitle">Профиль</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Группа, напоминания и оформление
          </ThemedText>
        </ThemedView>

        <NotificationPicker
          settings={profile.notifications}
          onChange={(notifications) => {
            void (async () => {
              if (notifications.enabled) {
                await ensureNotificationPermissionsRuntime();
              }
              setNotifications(notifications);
            })();
          }}
        />

        <GroupPicker groupId={profile.groupId} onSelect={setGroupId} />
        <SubgroupPicker subgroup={profile.subgroup} onSelect={setSubgroup} />
        <ThemePicker theme={profile.theme} onSelect={setTheme} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
});
