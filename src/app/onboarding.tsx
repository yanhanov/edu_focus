import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  GroupPicker,
  NotificationPicker,
  SubgroupPicker,
  ThemePicker,
} from '@/components/profile/profile-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import type { GroupId } from '@/data/groups';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { ensureNotificationPermissionsRuntime } from '@/lib/notifications-runtime';
import type { NotificationSettings, Profile, SubgroupPreference, ThemePreference } from '@/lib/profile';

const STEPS = ['intro', 'group', 'subgroup', 'notifications', 'theme'] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, completeOnboarding } = useProfile();
  const [step, setStep] = useState<Step>('intro');
  const [draft, setDraft] = useState<Profile>(profile);

  if (profile.onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  const stepIndex = STEPS.indexOf(step);
  const isLast = step === 'theme';

  const next = async () => {
    if (step === 'notifications' && draft.notifications.enabled) {
      await ensureNotificationPermissionsRuntime();
    }
    if (isLast) {
      await completeOnboarding(draft);
      router.replace('/(tabs)');
      return;
    }
    setStep(STEPS[stepIndex + 1]);
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + Spacing.four,
          },
        ]}>
        <ThemedView style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            Шаг {stepIndex + 1} из {STEPS.length}
          </ThemedText>
          <ThemedText type="subtitle">Edu Focus</ThemedText>
        </ThemedView>

        {step === 'intro' ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Расписание и ДЗ в одном месте</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Сначала выберем группу и подгруппу, а также время вечернего напоминания о записанном
              домашнем задании накануне пары.
            </ThemedText>
          </ThemedView>
        ) : null}

        {step === 'group' ? (
          <GroupPicker
            groupId={draft.groupId}
            onSelect={(groupId: GroupId) => setDraft({ ...draft, groupId })}
          />
        ) : null}

        {step === 'subgroup' ? (
          <SubgroupPicker
            subgroup={draft.subgroup}
            onSelect={(subgroup: SubgroupPreference) => setDraft({ ...draft, subgroup })}
          />
        ) : null}

        {step === 'notifications' ? (
          <NotificationPicker
            settings={draft.notifications}
            onChange={(notifications: NotificationSettings) => setDraft({ ...draft, notifications })}
          />
        ) : null}

        {step === 'theme' ? (
          <ThemePicker
            theme={draft.theme}
            onSelect={(themePreference: ThemePreference) => setDraft({ ...draft, theme: themePreference })}
          />
        ) : null}

        <ThemedView style={styles.actions}>
          {stepIndex > 0 ? (
            <Pressable
              onPress={() => setStep(STEPS[stepIndex - 1])}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Назад
              </ThemedText>
            </Pressable>
          ) : (
            <ThemedView />
          )}
          <Pressable
            onPress={() => void next()}
            style={({ pressed }) => [styles.primary, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              {isLast ? 'Начать' : 'Далее'}
            </ThemedText>
          </Pressable>
        </ThemedView>
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
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  primary: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
  },
  pressed: {
    opacity: 0.7,
  },
});
