import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { AppIcon } from '@/shared/ui/app-icon';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { Spacing } from '@/shared/theme/theme';
import { homeworkSummary } from '@/features/homework/hooks/use-homework';
import { HomeworkStatusChip } from '@/features/homework/components/homework-status-chip';
import {
  formatLessonTimes,
  groupHomeworkStatus,
  homeworkRowTimeColumn,
  pickHomeworkEntryForLessons,
} from '@/features/homework/lib/homework-subject';
import {
  homeworkCompletionStatus,
  homeworkKey,
  setHomeworkDone,
  type HomeworkEntry,
} from '@/features/homework/lib/homework';
import { LessonTypeBadge } from '@/features/schedule/components/lesson-type-badge';
import type { Lesson } from '@/features/schedule/data/schedule-11701126';
import { useTheme } from '@/shared/hooks/use-theme';

export type HomeworkRowProps = {
  lessons: Lesson[];
  date: string;
  homeworkMap: Record<string, HomeworkEntry>;
  entry?: HomeworkEntry;
  emptyLabel?: string;
};

function openLesson(lessonId: string, date: string) {
  router.push({
    pathname: '/lesson',
    params: { lessonId, date },
  });
}

export function HomeworkRow({
  lessons,
  date,
  homeworkMap,
  entry: entryOverride,
  emptyLabel,
}: HomeworkRowProps) {
  const theme = useTheme();
  const primary = lessons[0]!;
  const entry =
    entryOverride ?? pickHomeworkEntryForLessons(date, lessons, homeworkMap);
  const summary = homeworkSummary(entry);
  const photos = entry?.photos.slice(0, 3) ?? [];
  const completion = groupHomeworkStatus(date, lessons, homeworkMap);
  const openTargetId = entry?.lessonId ?? primary.id;
  const { start: timeStart, end: timeEnd } = homeworkRowTimeColumn(lessons);
  const slotTimes = lessons.length > 1 ? formatLessonTimes(lessons) : null;
  const lessonTypes = [...new Set(lessons.map((lesson) => lesson.type))];

  const toggleDone = () => {
    const nextDone = completion !== 'done';
    for (const lesson of lessons) {
      const status = homeworkCompletionStatus(homeworkMap[homeworkKey(date, lesson.id)]);
      if (status !== 'none') {
        void setHomeworkDone(date, lesson.id, nextDone);
      }
    }
  };

  return (
    <Pressable
      onPress={() => openLesson(openTargetId, date)}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedView style={styles.timeCol}>
          <ThemedText type="smallBold">{timeStart}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {timeEnd}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.body}>
          <ThemedView style={styles.subjectRow}>
            <ThemedText type="smallBold" style={styles.subjectTitle} numberOfLines={2}>
              {primary.subject}
            </ThemedText>
            <ThemedView style={styles.subjectMeta}>
              {lessonTypes.length === 1 ? (
                <LessonTypeBadge type={lessonTypes[0]!} />
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  {lessons.length} пары
                </ThemedText>
              )}
              {completion !== 'none' ? (
                <HomeworkStatusChip
                  status={completion === 'done' ? 'done' : 'todo'}
                  compact
                  onToggle={toggleDone}
                />
              ) : null}
            </ThemedView>
          </ThemedView>
          {primary.teacher ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {primary.teacher}
            </ThemedText>
          ) : null}
          {slotTimes ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {slotTimes}
            </ThemedText>
          ) : null}
          {summary.hasContent ? (
            <>
              {summary.text ? (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                  {summary.text}
                </ThemedText>
              ) : null}
              {photos.length > 0 ? (
                <ThemedView style={styles.thumbs}>
                  {photos.map((photo) => (
                    <Image key={photo.id} source={{ uri: photo.uri }} style={styles.thumb} />
                  ))}
                  {summary.photoCount > photos.length ? (
                    <ThemedView type="backgroundSelected" style={styles.moreThumb}>
                      <ThemedText type="smallBold">+{summary.photoCount - photos.length}</ThemedText>
                    </ThemedView>
                  ) : null}
                </ThemedView>
              ) : null}
              {summary.linkCount > 0 ? (
                <ThemedText type="small" style={{ color: theme.accent }}>
                  {summary.linkCount === 1 ? '1 ссылка' : `ссылок: ${summary.linkCount}`}
                </ThemedText>
              ) : null}
            </>
          ) : (
            <ThemedView style={styles.addRow}>
              <AppIcon ios="plus" android="add" color={theme.accent} size={16} />
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                {emptyLabel ?? 'Открыть'}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  timeCol: {
    width: 44,
    gap: 2,
    backgroundColor: 'transparent',
  },
  body: {
    flex: 1,
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  subjectTitle: {
    flex: 1,
    flexShrink: 1,
  },
  subjectMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.one,
    maxWidth: '46%',
    backgroundColor: 'transparent',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  thumbs: {
    flexDirection: 'row',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Spacing.two,
  },
  moreThumb: {
    width: 56,
    height: 56,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
