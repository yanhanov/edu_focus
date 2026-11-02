import { Pressable, StyleSheet, Switch } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { GROUPS, type GroupId } from '@/data/groups';
import { useTheme } from '@/hooks/use-theme';
import type { NotificationSettings, SubgroupPreference, ThemePreference } from '@/lib/profile';
import { formatReminderTime, reminderTimeOptions } from '@/lib/notifications-config';

type GroupPickerProps = {
  groupId: GroupId;
  onSelect: (groupId: GroupId) => void;
};

export function GroupPicker({ groupId, onSelect }: GroupPickerProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.block}>
      <ThemedText type="smallBold">Группа</ThemedText>
      {GROUPS.map((item) => {
        const selected = item.id === groupId;
        return (
          <Pressable key={item.id} onPress={() => onSelect(item.id)}>
            <ThemedView
              type={selected ? 'backgroundSelected' : 'backgroundElement'}
              style={[styles.card, selected && { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="smallBold">{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.specialty}
                {item.lessons.length === 0 ? ' · расписание скоро' : ''}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

type SubgroupPickerProps = {
  subgroup: SubgroupPreference;
  onSelect: (subgroup: SubgroupPreference) => void;
};

export function SubgroupPicker({ subgroup, onSelect }: SubgroupPickerProps) {
  return (
    <ThemedView style={styles.block}>
      <ThemedText type="smallBold">Подгруппа</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Лабораторные другой подгруппы скрываются
      </ThemedText>
      <ThemedView style={styles.row}>
        <Chip label="Вся группа" selected={subgroup === null} onPress={() => onSelect(null)} />
        <Chip label="1" selected={subgroup === 1} onPress={() => onSelect(1)} />
        <Chip label="2" selected={subgroup === 2} onPress={() => onSelect(2)} />
      </ThemedView>
    </ThemedView>
  );
}

type ThemePickerProps = {
  theme: ThemePreference;
  onSelect: (theme: ThemePreference) => void;
};

export function ThemePicker({ theme, onSelect }: ThemePickerProps) {
  return (
    <ThemedView style={styles.block}>
      <ThemedText type="smallBold">Тема</ThemedText>
      <ThemedView style={styles.row}>
        <Chip label="Система" selected={theme === 'system'} onPress={() => onSelect('system')} />
        <Chip label="Светлая" selected={theme === 'light'} onPress={() => onSelect('light')} />
        <Chip label="Тёмная" selected={theme === 'dark'} onPress={() => onSelect('dark')} />
      </ThemedView>
    </ThemedView>
  );
}

type NotificationPickerProps = {
  settings: NotificationSettings;
  onChange: (settings: NotificationSettings) => void;
};

export function NotificationPicker({ settings, onChange }: NotificationPickerProps) {
  const theme = useTheme();
  const timeLabel = formatReminderTime(settings);
  const timeOptions = reminderTimeOptions(settings);

  return (
    <ThemedView style={styles.block}>
      <ThemedText type="smallBold">Уведомления</ThemedText>
      <ThemedView type="backgroundElement" style={styles.notificationCard}>
        <ThemedView style={styles.switchRow}>
          <ThemedView style={styles.switchCopy}>
            <ThemedText type="smallBold">Напоминания о ДЗ</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {settings.enabled
                ? `Обычно приходят в ${timeLabel} накануне пары`
                : 'Сейчас выключены — время можно выбрать заранее'}
            </ThemedText>
          </ThemedView>
          <Switch
            value={settings.enabled}
            onValueChange={(enabled) => onChange({ ...settings, enabled })}
            trackColor={{ false: theme.backgroundSelected, true: theme.accentSoft }}
            thumbColor={settings.enabled ? theme.accent : theme.textSecondary}
          />
        </ThemedView>

        <ThemedView style={styles.timeSection}>
          <ThemedText type="smallBold">Время уведомления</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Вечером за день до пары, если ДЗ записано
          </ThemedText>
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
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={selected ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.chip, selected && { backgroundColor: theme.accent }]}>
        <ThemedText type="smallBold" style={selected ? { color: theme.background } : undefined}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  chip: {
    minWidth: 72,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: 'transparent',
  },
  switchCopy: {
    flex: 1,
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  notificationCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  timeSection: {
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.7,
  },
});
