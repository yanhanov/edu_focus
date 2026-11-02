import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { GROUPS, type GroupId } from '@/data/groups';
import { useTheme } from '@/hooks/use-theme';
import { formatReminderTime, reminderTimeOptions } from '@/lib/notifications-config';
import type { NotificationSettings, SubgroupPreference, ThemePreference } from '@/lib/profile';

type PickerChromeProps = {
  hideTitle?: boolean;
};

export function ProfileSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <ThemedView style={styles.section}>
      <ThemedView style={styles.sectionHead}>
        <ThemedText type="smallBold">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </ThemedView>
      {children}
    </ThemedView>
  );
}

type GroupPickerProps = PickerChromeProps & {
  groupId: GroupId;
  onSelect: (groupId: GroupId) => void;
};

export function GroupPicker({ groupId, onSelect, hideTitle }: GroupPickerProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.block}>
      {hideTitle ? null : <ThemedText type="smallBold">Группа</ThemedText>}
      <ThemedView type="backgroundElement" style={styles.groupList}>
        {GROUPS.map((item, index) => {
          const selected = item.id === groupId;
          return (
            <Pressable key={item.id} onPress={() => onSelect(item.id)}>
              <ThemedView
                style={[
                  styles.groupRow,
                  index > 0 && styles.groupRowBorder,
                  { borderTopColor: theme.backgroundSelected },
                  selected && { backgroundColor: theme.accentSoft },
                ]}>
                <ThemedView style={styles.groupCopy}>
                  <ThemedText type="smallBold">{item.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.specialty}
                    {item.lessons.length === 0 ? ' · расписание скоро' : ''}
                  </ThemedText>
                </ThemedView>
                {selected ? (
                  <ThemedView style={[styles.checkCircle, { backgroundColor: theme.accent }]}>
                    <AppIcon ios="checkmark" android="check" color={theme.background} size={14} />
                  </ThemedView>
                ) : (
                  <ThemedView style={[styles.checkCircle, { borderColor: theme.backgroundSelected, borderWidth: 2 }]} />
                )}
              </ThemedView>
            </Pressable>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

type SubgroupPickerProps = PickerChromeProps & {
  subgroup: SubgroupPreference;
  onSelect: (subgroup: SubgroupPreference) => void;
};

export function SubgroupPicker({ subgroup, onSelect, hideTitle }: SubgroupPickerProps) {
  return (
    <ThemedView style={styles.block}>
      {hideTitle ? null : <ThemedText type="smallBold">Подгруппа</ThemedText>}
      {!hideTitle ? (
        <ThemedText type="small" themeColor="textSecondary">
          Лабораторные другой подгруппы скрываются
        </ThemedText>
      ) : null}
      <ThemedView type="backgroundElement" style={styles.chipCard}>
        <ThemedView style={styles.row}>
          <Chip label="Вся группа" selected={subgroup === null} onPress={() => onSelect(null)} flex />
          <Chip label="1" selected={subgroup === 1} onPress={() => onSelect(1)} flex />
          <Chip label="2" selected={subgroup === 2} onPress={() => onSelect(2)} flex />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

type ThemePickerProps = PickerChromeProps & {
  theme: ThemePreference;
  onSelect: (theme: ThemePreference) => void;
};

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  ios: string;
  android: string;
}[] = [
  { value: 'system', label: 'Система', ios: 'circle.lefthalf.filled', android: 'contrast' },
  { value: 'light', label: 'Светлая', ios: 'sun.max.fill', android: 'light_mode' },
  { value: 'dark', label: 'Тёмная', ios: 'moon.fill', android: 'dark_mode' },
];

export function ThemePicker({ theme, onSelect, hideTitle }: ThemePickerProps) {
  const colors = useTheme();

  return (
    <ThemedView style={styles.block}>
      {hideTitle ? null : <ThemedText type="smallBold">Тема</ThemedText>}
      <ThemedView style={styles.row}>
        {THEME_OPTIONS.map((option) => {
          const selected = theme === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={({ pressed }) => [styles.themeTile, pressed && styles.pressed]}>
              <ThemedView
                type="backgroundElement"
                style={[
                  styles.themeTileInner,
                  selected && { backgroundColor: colors.accentSoft, borderColor: colors.accent, borderWidth: 1 },
                ]}>
                <ThemedView style={[styles.themeIcon, { backgroundColor: colors.backgroundSelected }]}>
                  <AppIcon ios={option.ios} android={option.android} color={colors.accent} size={20} />
                </ThemedView>
                <ThemedText type="smallBold">{option.label}</ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

type NotificationPickerProps = {
  settings: NotificationSettings;
  onChange: (settings: NotificationSettings) => void;
  hideTitle?: boolean;
};

export function NotificationPicker({ settings, onChange, hideTitle }: NotificationPickerProps) {
  const theme = useTheme();
  const timeLabel = formatReminderTime(settings);
  const timeOptions = reminderTimeOptions(settings);

  return (
    <ThemedView style={styles.block}>
      {hideTitle ? null : <ThemedText type="smallBold">Уведомления</ThemedText>}
      <ThemedView type="backgroundElement" style={styles.notificationCard}>
        <ThemedView style={[styles.notificationHero, { backgroundColor: theme.accentSoft }]}>
          <ThemedView style={[styles.notificationIcon, { backgroundColor: theme.background }]}>
            <AppIcon ios="bell.badge.fill" android="notifications" color={theme.accent} size={22} />
          </ThemedView>
          <ThemedView style={styles.notificationHeroCopy}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              {settings.enabled ? `Напоминания в ${timeLabel}` : 'Напоминания выключены'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Вечером накануне пары, если ДЗ записано
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.switchRow}>
          <ThemedText type="smallBold">Включить уведомления</ThemedText>
          <Switch
            value={settings.enabled}
            onValueChange={(enabled) => onChange({ ...settings, enabled })}
            trackColor={{ false: theme.backgroundSelected, true: theme.accentSoft }}
            thumbColor={settings.enabled ? theme.accent : theme.textSecondary}
          />
        </ThemedView>

        <ThemedView style={styles.timeSection}>
          <ThemedText type="smallBold">Время</ThemedText>
          <ThemedView style={styles.row}>
            {timeOptions.map((preset) => {
              const selected = settings.hour === preset.hour && settings.minute === preset.minute;
              return (
                <Chip
                  key={`${preset.hour}:${preset.minute}`}
                  label={preset.label}
                  selected={selected}
                  onPress={() =>
                    onChange({ ...settings, hour: preset.hour, minute: preset.minute })
                  }
                />
              );
            })}
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

function Chip({
  label,
  selected,
  onPress,
  flex,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  flex?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [flex && styles.chipFlex, pressed && styles.pressed]}>
      <ThemedView
        type={selected ? 'backgroundSelected' : 'backgroundElement'}
        style={[
          styles.chip,
          flex && styles.chipFlex,
          selected && { backgroundColor: theme.accent },
        ]}>
        <ThemedText type="smallBold" style={selected ? { color: theme.background } : undefined}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  sectionHead: {
    gap: 2,
    backgroundColor: 'transparent',
  },
  block: {
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  groupList: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    backgroundColor: 'transparent',
  },
  groupRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  groupCopy: {
    flex: 1,
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCard: {
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  chip: {
    minWidth: 72,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    alignItems: 'center',
  },
  chipFlex: {
    flex: 1,
    minWidth: 0,
  },
  themeTile: {
    flex: 1,
    minWidth: 96,
  },
  themeTileInner: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  themeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    backgroundColor: 'transparent',
  },
  notificationCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  notificationHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationHeroCopy: {
    flex: 1,
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  timeSection: {
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.7,
  },
});
