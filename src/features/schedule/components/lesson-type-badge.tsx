import { StyleSheet } from 'react-native';

import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import type { LessonType } from '@/features/schedule/data/schedule-11701126';
import { useTheme } from '@/shared/hooks/use-theme';
import { LESSON_TYPE_LABELS } from '@/features/schedule/lib/schedule';

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
          backgroundColor: highlighted ? theme.accent : theme.accentSoft,
          borderColor: theme.accent,
          borderWidth: 1,
        },
      ]}>
      <ThemedText
        type="smallBold"
        numberOfLines={1}
        style={[styles.label, { color: highlighted ? theme.background : theme.accent }]}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
    maxWidth: 120,
  },
  label: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
});
