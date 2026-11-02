import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import {
  AccentPalettePicker,
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

const STEP_META: Record<Step, { title: string; subtitle: string }> = {
  intro: {
    title: 'Edu Focus',
    subtitle: 'Расписание и домашние задания без лишнего',
  },
  group: {
    title: 'Группа',
    subtitle: 'Выберите свою — расписание подтянется автоматически',
  },
  subgroup: {
    title: 'Подгруппа',
    subtitle: 'Лабораторные другой подгруппы скрываются',
  },
  notifications: {
    title: 'Напоминания',
    subtitle: 'Вечером накануне пары, если ДЗ записано и ещё не сделано',
  },
  theme: {
    title: 'Оформление',
    subtitle: 'Режим и цветовая гамма — потом в профиле',
  },
};

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
  const meta = STEP_META[step];

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
      <ThemedView
        style={[
          styles.top,
          { paddingTop: insets.top + Spacing.three, maxWidth: MaxContentWidth },
        ]}>
        <ThemedView style={styles.progressRow}>
          {STEPS.map((item, index) => (
            <View
              key={item}
              style={[
                styles.progressSegment,
                { backgroundColor: index <= stepIndex ? theme.accent : theme.backgroundElement },
              ]}
            />
          ))}
        </ThemedView>
        <ThemedText type="small" themeColor="textSecondary">
          {stepIndex + 1} / {STEPS.length}
        </ThemedText>
        <ThemedText type="subtitle">{meta.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {meta.subtitle}
        </ThemedText>
      </ThemedView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Spacing.three, maxWidth: MaxContentWidth },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {step === 'intro' ? <IntroStep /> : null}
        {step === 'group' ? (
          <GroupPicker hideTitle groupId={draft.groupId} onSelect={(groupId: GroupId) => setDraft({ ...draft, groupId })} />
        ) : null}
        {step === 'subgroup' ? (
          <SubgroupPicker
            hideTitle
            subgroup={draft.subgroup}
            onSelect={(subgroup: SubgroupPreference) => setDraft({ ...draft, subgroup })}
          />
        ) : null}
        {step === 'notifications' ? (
          <NotificationPicker
            hideTitle
            compact
            settings={draft.notifications}
            onChange={(notifications: NotificationSettings) => setDraft({ ...draft, notifications })}
          />
        ) : null}
        {step === 'theme' ? (
          <>
            <ThemePicker
              hideTitle
              theme={draft.theme}
              onSelect={(themePreference: ThemePreference) => setDraft({ ...draft, theme: themePreference })}
            />
            <AccentPalettePicker
              hideTitle
              palette={draft.accentPalette}
              onSelect={(accentPalette) => setDraft({ ...draft, accentPalette })}
            />
          </>
        ) : null}
      </ScrollView>

      <ThemedView
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.three,
            borderTopColor: theme.backgroundElement,
            maxWidth: MaxContentWidth,
          },
        ]}>
        {stepIndex > 0 ? (
          <Pressable
            onPress={() => setStep(STEPS[stepIndex - 1])}
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Назад
            </ThemedText>
          </Pressable>
        ) : (
          <ThemedView style={styles.backButton} />
        )}
        <Pressable
          onPress={() => void next()}
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: theme.accent },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            {isLast ? 'Начать' : 'Далее'}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

function IntroStep() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.intro}>
      <ThemedView style={[styles.introMark, { backgroundColor: theme.accentSoft }]}>
        <AppIcon ios="calendar" android="calendar_month" color={theme.accent} size={32} />
      </ThemedView>
      <IntroLine
        ios="list.bullet.rectangle"
        android="view_agenda"
        title="Расписание по дням"
        detail="Текущая пара и свайп между днями недели"
      />
      <IntroLine
        ios="square.and.pencil"
        android="edit_note"
        title="ДЗ к парам"
        detail="Текст, фото и ссылки — статус «сделано»"
      />
      <IntroLine
        ios="bell"
        android="notifications"
        title="Напоминания"
        detail="Только если задание записано и не отмечено"
      />
    </ThemedView>
  );
}

function IntroLine({
  ios,
  android,
  title,
  detail,
}: {
  ios: string;
  android: string;
  title: string;
  detail: string;
}) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.introLine}>
      <ThemedView style={[styles.introLineIcon, { backgroundColor: theme.backgroundSelected }]}>
        <AppIcon ios={ios} android={android} color={theme.accent} size={18} />
      </ThemedView>
      <ThemedView style={styles.introLineCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {detail}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  top: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  progressRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    flexGrow: 1,
  },
  footer: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    minWidth: 72,
    paddingVertical: Spacing.two,
  },
  primary: {
    minWidth: 120,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
    alignItems: 'center',
  },
  intro: {
    gap: Spacing.three,
    backgroundColor: 'transparent',
  },
  introMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  introLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  introLineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introLineCopy: {
    flex: 1,
    gap: 2,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.75,
  },
});
