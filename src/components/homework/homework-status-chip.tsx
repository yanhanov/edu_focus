import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HomeworkCompletionStatus } from '@/lib/homework';

type HomeworkStatusChipProps = {
  status: Exclude<HomeworkCompletionStatus, 'none'>;
  compact?: boolean;
  prefix?: string;
  onToggle?: () => void;
};

export function HomeworkStatusChip({
  status,
  compact,
  prefix,
  onToggle,
}: HomeworkStatusChipProps) {
  const theme = useTheme();
  const done = status === 'done';
  const label = done ? 'Сделано' : 'Не сделано';
  const text = prefix ? `${prefix}: ${label}` : label;

  const chip = (
    <ThemedView
      style={[
        styles.chip,
        compact && styles.chipCompact,
        {
          backgroundColor: done ? theme.accentSoft : theme.backgroundElement,
          borderColor: done ? theme.accent : theme.backgroundSelected,
        },
      ]}>
      <ThemedText
        type="smallBold"
        style={{ color: done ? theme.accent : theme.textSecondary, fontSize: compact ? 11 : 12 }}>
        {text}
      </ThemedText>
    </ThemedView>
  );

  if (!onToggle) {
    return chip;
  }

  return (
    <Pressable onPress={onToggle} style={({ pressed }) => pressed && styles.pressed}>
      {chip}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half + 2,
    borderRadius: Spacing.five,
    borderWidth: 1,
  },
  chipCompact: {
    paddingVertical: 2,
  },
  pressed: {
    opacity: 0.75,
  },
});
