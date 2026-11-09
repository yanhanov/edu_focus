import { ScrollView, StyleSheet } from 'react-native';

import { LessonCard } from '@/features/schedule/components/lesson-card';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/shared/theme/theme';
import type { Group } from '@/features/schedule/data/groups';
import { homeworkSummary } from '@/features/homework/hooks/use-homework';
import type { HomeworkMap } from '@/features/homework/lib/homework';
import { homeworkKey, isHomeworkContentEmpty } from '@/features/homework/lib/homework';
import {
  dateForWeekday,
  formatDate,
  getLessonsForDate,
  getPublicHolidayOnDate,
  toIsoDate,
  WEEKDAY_LABELS,
  type Weekday,
} from '@/features/schedule/lib/schedule';

type ScheduleDayPanelProps = {
  day: Exclude<Weekday, 7>;
  now: Date;
  todayWeekday: Weekday;
  group: Group;
  subgroup: 1 | 2 | null;
  homeworkMap: HomeworkMap;
  pageWidth: number;
  bottomInset: number;
  currentLessonId?: string;
  onOpenHomework: (lessonId: string, date: string) => void;
};

export function ScheduleDayPanel({
  day,
  now,
  todayWeekday,
  group,
  subgroup,
  homeworkMap,
  pageWidth,
  bottomInset,
  currentLessonId,
  onOpenHomework,
}: ScheduleDayPanelProps) {
  const selectedDate = dateForWeekday(now, day);
  const lessons = getLessonsForDate(selectedDate, group.lessons, subgroup);
  const holiday = getPublicHolidayOnDate(selectedDate);
  const dateIso = toIsoDate(selectedDate);
  const isToday =
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate();

  return (
    <ScrollView
      style={{ width: pageWidth }}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomInset + BottomTabInset + Spacing.three },
      ]}>
      <ThemedView style={[styles.inner, { maxWidth: MaxContentWidth }]}>
        <ThemedView style={styles.dayHeader}>
          <ThemedText type="smallBold">
            {WEEKDAY_LABELS[day]}, {formatDate(selectedDate)}
          </ThemedText>
          {isToday ? (
            <ThemedText type="small" themeColor="textSecondary">
              сегодня
            </ThemedText>
          ) : null}
        </ThemedView>

        {lessons.length === 0 ? (
          <ThemedView type="backgroundElement" style={styles.empty}>
            <ThemedText type="smallBold">
              {holiday ? 'Государственный праздник' : 'Пар нет'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {group.lessons.length === 0
                ? 'Расписание этой группы пока не добавлено'
                : holiday
                  ? holiday.localName
                  : todayWeekday === 7 && isToday
                    ? 'Воскресенье — выходной день'
                    : 'В этот день занятий нет'}
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.list}>
            {lessons.map((lesson) => {
              const entry = homeworkMap[homeworkKey(dateIso, lesson.id)];
              const summary = homeworkSummary(entry);
              const showHomework = entry && !isHomeworkContentEmpty(entry);
              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isCurrent={isToday && lesson.id === currentLessonId}
                  homework={showHomework ? summary : undefined}
                  onPress={() => onOpenHomework(lesson.id, dateIso)}
                />
              );
            })}
          </ThemedView>
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
