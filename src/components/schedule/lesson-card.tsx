import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Lesson } from '@/data/schedule-11701126';
import { formatPlace, LESSON_TYPE_LABELS } from '@/lib/schedule';

export type HomeworkBadge = {
  text: string;
  photoCount: number;
  linkCount: number;
  hasContent: boolean;
};

type LessonCardProps = {
  lesson: Lesson;
  isCurrent?: boolean;
  homework?: HomeworkBadge;
  onPress?: () => void;
};

export function LessonCard({ lesson, isCurrent = false, homework, onPress }: LessonCardProps) {
  const theme = useTheme();
  const details = [
    homework?.text ? homework.text : null,
    homework && homework.photoCount > 0 ? `фото: ${homework.photoCount}` : null,
    homework && homework.linkCount > 0 ? `ссылки: ${homework.linkCount}` : null,
  ].filter(Boolean);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isCurrent ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.card, isCurrent && { backgroundColor: theme.accentSoft }]}>
        <ThemedView style={[styles.timeCol, { backgroundColor: 'transparent' }]}>
          <ThemedText type="smallBold">{lesson.start}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {lesson.end}
          </ThemedText>
        </ThemedView>

        <ThemedView style={[styles.body, { backgroundColor: 'transparent' }]}>
          <ThemedText type="smallBold">{lesson.subject}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {lesson.type === 'pe' ? lesson.teacher : `${LESSON_TYPE_LABELS[lesson.type]} · ${lesson.teacher}`}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatPlace(lesson)}
            {lesson.subgroup ? ` · подгруппа ${lesson.subgroup}` : ''}
          </ThemedText>
          {isCurrent ? (
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Сейчас
            </ThemedText>
          ) : null}
          {homework?.hasContent ? (
            <ThemedText type="small" style={{ color: theme.accent }} numberOfLines={2}>
              ДЗ · {details.join(' · ')}
            </ThemedText>
          ) : null}
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  timeCol: {
    minWidth: 52,
    gap: 2,
  },
  body: {
    flex: 1,
    gap: 2,
  },
});
