import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { LessonType } from '@/data/schedule-11701126';
import { useTheme } from '@/hooks/use-theme';
import { LESSON_TYPE_LABELS } from '@/lib/schedule';

type LessonTypeBadgeProps = {
  type: LessonType;
  /** Accent styling when the pair is current / highlighted */
  highlighted?: boolean;
};

export function LessonTypeBadge({ type, highlighted = false }: LessonTypeBadgeProps) {
  const theme = useTheme();
  const label = LESSON_TYPE_LABELS[type];

  return (
    <ThemedView
      style={[
        styles.badge,
        {
          backgroundColor: highlighted ? theme.background : theme.backgroundSelected,
          borderColor: highlighted ? theme.accent : 'transparent',
          borderWidth: highlighted ? 1 : 0,
        },
      ]}>
      <ThemedText
        type="small"
        numberOfLines={1}
        style={[styles.label, highlighted ? { color: theme.accent } : { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
});
