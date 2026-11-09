import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { Spacing } from '@/shared/theme/theme';
import { groupLessonsBySubject } from '@/features/homework/lib/homework-subject';
import type { HomeworkEntry } from '@/features/homework/lib/homework';
import type { SubgroupPreference } from '@/features/profile/lib/profile';
import type { Lesson } from '@/features/schedule/data/schedule-11701126';
import { getMatchingLessonsForWeek } from '@/features/schedule/lib/week-search';
import { formatDate, WEEKDAY_LABELS } from '@/features/schedule/lib/schedule';

import { HomeworkRow } from './homework-row';

type HomeworkWeekSearchSectionProps = {
  now: Date;
  query: string;
  allLessons: readonly Lesson[];
  subgroup: SubgroupPreference;
  homeworkMap: Record<string, HomeworkEntry>;
};

export function HomeworkWeekSearchSection({
  now,
  query,
  allLessons,
  subgroup,
  homeworkMap,
}: HomeworkWeekSearchSectionProps) {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const hits = useMemo(
    () =>
      getMatchingLessonsForWeek(now, allLessons, subgroup, query).map((hit) => ({
        ...hit,
        groups: groupLessonsBySubject(hit.lessons),
      })),
    [now, allLessons, subgroup, query],
  );

  if (hits.length === 0) {
    return null;
  }

  return (
    <ThemedView style={styles.wrap}>
      <ThemedText type="small" themeColor="textSecondary">
        Результаты на неделе пн–сб
      </ThemedText>
      {hits.map((hit) => {
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
              {hit.groups.map((item) => (
                <HomeworkRow
                  key={`${hit.dateIso}:${item.key}`}
                  lessons={item.lessons}
                  date={hit.dateIso}
                  homeworkMap={homeworkMap}
                  emptyLabel="Добавить"
                />
              ))}
            </ThemedView>
          </ThemedView>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.three,
    backgroundColor: 'transparent',
  },
  dayBlock: {
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  list: {
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
});
