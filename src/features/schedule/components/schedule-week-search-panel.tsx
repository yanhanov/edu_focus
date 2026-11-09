import { ScrollView, StyleSheet } from 'react-native';

import { LessonCard } from '@/features/schedule/components/lesson-card';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/shared/theme/theme';
import { homeworkSummary } from '@/features/homework/hooks/use-homework';
import type { HomeworkMap } from '@/features/homework/lib/homework';
import { homeworkKey, isHomeworkContentEmpty } from '@/features/homework/lib/homework';
import type { Group } from '@/features/schedule/data/groups';
import { getMatchingLessonsForWeek } from '@/features/schedule/lib/week-search';
import { formatDate, WEEKDAY_LABELS, type Weekday } from '@/features/schedule/lib/schedule';

type ScheduleWeekSearchPanelProps = {
  now: Date;
  query: string;
  group: Group;
  subgroup: 1 | 2 | null;
  homeworkMap: HomeworkMap;
  bottomInset: number;
  todayWeekday: Weekday;
  currentLessonId?: string;
  onOpenLesson: (lessonId: string, date: string) => void;
};

export function ScheduleWeekSearchPanel({
  now,
  query,
  group,
  subgroup,
  homeworkMap,
  bottomInset,
  todayWeekday,
  currentLessonId,
  onOpenLesson,
}: ScheduleWeekSearchPanelProps) {
  const hits = getMatchingLessonsForWeek(now, group.lessons, subgroup, query);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomInset + BottomTabInset + Spacing.three },
      ]}>
      <ThemedView style={[styles.inner, { maxWidth: MaxContentWidth }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Результаты на неделе пн–сб
        </ThemedText>

        {hits.length === 0 ? (
          <ThemedView type="backgroundElement" style={styles.empty}>
            <ThemedText type="smallBold">Ничего не найдено</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Нет пар с таким предметом или преподавателем на этой неделе
            </ThemedText>
          </ThemedView>
        ) : (
          hits.map((hit) => {
            const isToday = hit.date.getTime() === todayStart;
            return (
              <ThemedView key={hit.dateIso} style={styles.dayBlock}>
                <ThemedView style={styles.dayHeader}>
                  <ThemedText type="smallBold">
                    {WEEKDAY_LABELS[hit.day]}, {formatDate(hit.date)}
                  </ThemedText>
                  {isToday ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      сегодня
                    </ThemedText>
                  ) : null}
                </ThemedView>
                <ThemedView style={styles.list}>
                  {hit.lessons.map((lesson) => {
                    const entry = homeworkMap[homeworkKey(hit.dateIso, lesson.id)];
                    const summary = homeworkSummary(entry);
                    const showHomework = entry && !isHomeworkContentEmpty(entry);
                    return (
                      <LessonCard
                        key={`${hit.dateIso}:${lesson.id}`}
                        lesson={lesson}
                        isCurrent={isToday && todayWeekday !== 7 && lesson.id === currentLessonId}
                        homework={showHomework ? summary : undefined}
                        onPress={() => onOpenLesson(lesson.id, hit.dateIso)}
                      />
                    );
                  })}
                </ThemedView>
              </ThemedView>
            );
          })
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  inner: {
    width: '100%',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  dayBlock: {
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: Spacing.two,
  },
  empty: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
});
