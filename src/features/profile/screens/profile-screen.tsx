import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/shared/ui/app-icon";
import {
  AccentPalettePicker,
  GroupPicker,
  NotificationPicker,
  ProfileSection,
  SubgroupPicker,
  ThemePicker,
} from "@/features/profile/components/profile-fields";
import { ScheduleUpdateSection } from "@/features/profile/components/schedule-update-section";
import { ThemedText } from "@/shared/ui/themed-text";
import { ThemedView } from "@/shared/ui/themed-view";
import { ACCENT_PALETTES } from "@/shared/theme/accent-palettes";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/shared/theme/theme";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useTheme } from "@/shared/hooks/use-theme";
import { formatReminderTime } from "@/features/notifications/lib/notifications-config";
import { ensureNotificationPermissionsRuntime } from "@/features/notifications/lib/notifications-runtime";
import type { ThemePreference } from "@/features/profile/lib/profile";

const THEME_LABELS: Record<ThemePreference, string> = {
  system: "Системная",
  light: "Светлая",
  dark: "Тёмная",
};

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    profile,
    group,
    setGroupId,
    setSubgroup,
    setTheme,
    setAccentPalette,
    setNotifications,
  } = useProfile();

  const subgroupLabel =
    profile.subgroup === 1
      ? "Подгруппа 1"
      : profile.subgroup === 2
        ? "Подгруппа 2"
        : "Вся группа";
  const notifyLabel = profile.notifications.enabled
    ? `ДЗ в ${formatReminderTime(profile.notifications)}`
    : "Уведомления выкл.";

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
          },
        ]}
      >
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Профиль</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Расписание, напоминания и оформление
          </ThemedText>
        </ThemedView>

        <ThemedView
          style={[styles.summary, { backgroundColor: theme.accentSoft }]}
        >
          <ThemedView
            style={[styles.summaryIcon, { backgroundColor: theme.background }]}
          >
            <AppIcon
              ios="person.crop.circle.fill"
              android="account_circle"
              color={theme.accent}
              size={28}
            />
          </ThemedView>
          <ThemedView style={styles.summaryCopy}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              {group.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {group.specialty}
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.summaryPills}>
            <SummaryPill label={subgroupLabel} />
            <SummaryPill label={THEME_LABELS[profile.theme]} />
            <SummaryPill
              label={ACCENT_PALETTES[profile.accentPalette].label}
              accent
            />
            <SummaryPill
              label={notifyLabel}
              accent={profile.notifications.enabled}
            />
          </ThemedView>
        </ThemedView>

        <ProfileSection
          title="Учёба"
          subtitle="Группа и подгруппа — лабораторные другой подгруппы скрываются"
        >
          <GroupPicker
            hideTitle
            groupId={profile.groupId}
            onSelect={setGroupId}
          />
          <SubgroupPicker
            hideTitle
            subgroup={profile.subgroup}
            onSelect={setSubgroup}
          />
        </ProfileSection>

        <ScheduleUpdateSection groupId={profile.groupId} />

        <ProfileSection
          title="Уведомления"
          subtitle="Напоминание о записанном ДЗ накануне пары"
        >
          <NotificationPicker
            hideTitle
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
        </ProfileSection>

        <ProfileSection
          title="Оформление"
          subtitle="Светлый или тёмный режим и акцентный цвет"
        >
          <ThemePicker hideTitle theme={profile.theme} onSelect={setTheme} />
          <AccentPalettePicker
            hideTitle
            palette={profile.accentPalette}
            onSelect={setAccentPalette}
          />
        </ProfileSection>
      </ScrollView>
    </ThemedView>
  );
}

function SummaryPill({ label, accent }: { label: string; accent?: boolean }) {
  const theme = useTheme();
  return (
    <ThemedView style={[styles.pill, { backgroundColor: theme.background }]}>
      <ThemedText
        type="smallBold"
        style={accent ? { color: theme.accent } : undefined}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  summary: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCopy: {
    gap: Spacing.one,
    backgroundColor: "transparent",
  },
  summaryPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    backgroundColor: "transparent",
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half + 2,
    borderRadius: Spacing.five,
    maxWidth: "100%",
  },
});
