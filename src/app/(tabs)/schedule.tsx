import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DaySwitcher } from '@/components/schedule/day-switcher';
import { LessonCard } from '@/components/schedule/lesson-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { SCHEDULE_PERIOD } from '@/data/groups';
import { homeworkSummary, useHomeworkMap } from '@/hooks/use-homework';
import { useNow } from '@/hooks/use-now';
import { useProfile } from '@/hooks/use-profile';
import { homeworkKey } from '@/lib/homework';
import {
  dateForWeekday,
  describeNowStatus,
  formatDate,
  getLessonsForDate,
  getNowStatus,
  getWeekParity,
  getWeekday,
  startOfDay,
  toIsoDate,
  WEEKDAY_LABELS,
  weekParityLabel,
  type Weekday,
} from '@/lib/schedule';
import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const now = useNow();
  const { group, profile } = useProfile();
  const homeworkMap = useHomeworkMap();
  const todayWeekday = getWeekday(now);
  const initialDay = todayWeekday === 7 ? 1 : todayWeekday;
  const [selectedDay, setSelectedDay] = useState<Exclude<Weekday, 7>>(initialDay);

  const selectedDate = dateForWeekday(now, selectedDay);
  const lessons = getLessonsForDate(selectedDate, group.lessons, profile.subgroup);
  const todayLessons = getLessonsForDate(now, group.lessons, profile.subgroup);
  const nowStatus = getNowStatus(todayLessons, now);
  const isToday = startOfDay(selectedDate).getTime() === startOfDay(now).getTime();
  const currentId = nowStatus.kind === 'now' ? nowStatus.lesson.id : undefined;
  const weekLabel = weekParityLabel(getWeekParity(isToday ? now : selectedDate));
  const statusCopy = describeNowStatus(nowStatus, todayWeekday);

  useEffect(() => {
    syncScheduleWidget(now);
  }, [now]);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
          },
        ]}>
        <ThemedView style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            Группа {group.id}
            {profile.subgroup ? ` · подгруппа ${profile.subgroup}` : ''}
          </ThemedText>
          <ThemedText type="subtitle">Расписание</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {group.specialty} · {weekLabel}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {SCHEDULE_PERIOD}
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.banner}>
          <ThemedText type="smallBold">{statusCopy.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {statusCopy.detail}
          </ThemedText>
        </ThemedView>

        <DaySwitcher selected={selectedDay} today={todayWeekday} onSelect={setSelectedDay} />

        <ThemedView style={styles.dayHeader}>
          <ThemedText type="smallBold">
            {WEEKDAY_LABELS[selectedDay]}, {formatDate(selectedDate)}
          </ThemedText>
          {isToday ? (
            <ThemedText type="small" themeColor="textSecondary">
              сегодня
            </ThemedText>
          ) : null}
        </ThemedView>

        {lessons.length === 0 ? (
          <ThemedView type="backgroundElement" style={styles.empty}>
            <ThemedText type="smallBold">Пар нет</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {group.lessons.length === 0
                ? 'Расписание этой группы пока не добавлено'
                : todayWeekday === 7 && isToday
                  ? 'Воскресенье — выходной день'
                  : 'В этот день занятий нет'}
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.list}>
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                isCurrent={isToday && lesson.id === currentId}
                homework={homeworkSummary(homeworkMap[homeworkKey(toIsoDate(selectedDate), lesson.id)])}
                onPress={() =>
                  router.push({
                    pathname: '/homework-entry',
                    params: { lessonId: lesson.id, date: toIsoDate(selectedDate) },
                  })
                }
              />
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.three,
  },
  header: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.one,
  },
  banner: {
    marginHorizontal: Spacing.four,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  dayHeader: {
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  empty: {
    marginHorizontal: Spacing.four,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
});
