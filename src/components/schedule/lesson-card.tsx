import { Pressable, StyleSheet } from 'react-native';

import { LessonTypeBadge } from '@/components/schedule/lesson-type-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Lesson } from '@/data/schedule-11701126';
import { formatPlace } from '@/lib/schedule';

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
        style={[
          styles.card,
          isCurrent && {
            backgroundColor: theme.accentSoft,
            borderColor: theme.accent,
            borderWidth: 2,
          },
        ]}>
        <ThemedView style={[styles.timeCol, { backgroundColor: 'transparent' }]}>
          <ThemedText type="smallBold" style={isCurrent ? { color: theme.accent } : undefined}>
            {lesson.start}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {lesson.end}
          </ThemedText>
        </ThemedView>

        <ThemedView style={[styles.body, { backgroundColor: 'transparent' }]}>
          <ThemedView style={[styles.titleRow, { backgroundColor: 'transparent' }]}>
            <ThemedText
              type="smallBold"
              style={[styles.subject, isCurrent ? { color: theme.accent } : undefined]}
              numberOfLines={2}>
              {lesson.subject}
            </ThemedText>
            <LessonTypeBadge type={lesson.type} highlighted={isCurrent} />
          </ThemedView>
          {lesson.teacher ? (
            <ThemedText type="small" themeColor="textSecondary">
              {lesson.teacher}
            </ThemedText>
          ) : null}
          {formatPlace(lesson) || lesson.subgroup ? (
            <ThemedText type="small" themeColor="textSecondary">
              {formatPlace(lesson)}
              {lesson.subgroup ? `${formatPlace(lesson) ? ' · ' : ''}подгруппа ${lesson.subgroup}` : ''}
            </ThemedText>
          ) : null}
          {homework?.hasContent && details.length > 0 ? (
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  subject: {
    flex: 1,
    minWidth: 0,
  },
});
