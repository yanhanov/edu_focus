import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { GROUP_ID, SCHEDULE_TITLE } from '@/data/schedule-11701126';
import { homeworkSummary, useHomeworkMap } from '@/hooks/use-homework';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { listHomeworkEntries } from '@/lib/homework';
import {
  addDays,
  describeNowStatus,
  formatDate,
  formatPlace,
  getLessonsForDate,
  getNowStatus,
  getWeekParity,
  getWeekday,
  toIsoDate,
  WEEKDAY_SHORT,
  weekParityLabel,
} from '@/lib/schedule';
import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const homeworkMap = useHomeworkMap();
  const weekday = getWeekday(now);
  const weekLabel = weekParityLabel(getWeekParity(now));
  const todayLessons = getLessonsForDate(now);
  const tomorrow = addDays(now, 1);
  const tomorrowLessons = getLessonsForDate(tomorrow);
  const nowStatus = getNowStatus(todayLessons, now);
  const statusCopy = describeNowStatus(nowStatus, weekday);
  const currentLesson =
    nowStatus.kind === 'now'
      ? nowStatus.lesson
      : nowStatus.kind === 'upcoming' || nowStatus.kind === 'break'
        ? nowStatus.next
        : undefined;
  const todayIso = toIsoDate(now);
  const homeworkItems = listHomeworkEntries(homeworkMap);
  const todayHomework = homeworkItems.filter((item) => item.date === todayIso);

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
            Группа {GROUP_ID}
          </ThemedText>
          <ThemedText type="subtitle">Главная</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {SCHEDULE_TITLE} · {weekLabel}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {WEEKDAY_SHORT[weekday]}, {formatDate(now)}
          </ThemedText>
        </ThemedView>

        <Pressable
          onPress={() => {
            if (!currentLesson) {
              router.navigate('/schedule');
              return;
            }
            router.push({
              pathname: '/homework-entry',
              params: { lessonId: currentLesson.id, date: todayIso },
            });
          }}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{statusCopy.title}</ThemedText>
            <ThemedText>{statusCopy.detail}</ThemedText>
            {currentLesson ? (
              <ThemedText type="small" themeColor="textSecondary">
                {formatPlace(currentLesson)}
              </ThemedText>
            ) : null}
          </ThemedView>
        </Pressable>

        <Pressable onPress={() => router.navigate('/schedule')}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Сегодня · {todayLessons.length} пар</ThemedText>
            {todayLessons.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Занятий нет
              </ThemedText>
            ) : (
              todayLessons.slice(0, 4).map((lesson) => (
                <ThemedText key={lesson.id} type="small" themeColor="textSecondary">
                  {lesson.start} · {lesson.subject}
                </ThemedText>
              ))
            )}
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Расписание
            </ThemedText>
          </ThemedView>
        </Pressable>

        <Pressable onPress={() => router.navigate('/schedule')}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">
              Завтра · {WEEKDAY_SHORT[getWeekday(tomorrow)]} · {tomorrowLessons.length} пар
            </ThemedText>
            {tomorrowLessons.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Завтра пар нет
              </ThemedText>
            ) : (
              tomorrowLessons.slice(0, 3).map((lesson) => (
                <ThemedText key={lesson.id} type="small" themeColor="textSecondary">
                  {lesson.start} · {lesson.subject}
                </ThemedText>
              ))
            )}
          </ThemedView>
        </Pressable>

        <Pressable onPress={() => router.navigate('/homework')}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Домашние задания</ThemedText>
            {todayHomework.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                На сегодня ДЗ не записано
              </ThemedText>
            ) : (
              todayHomework.slice(0, 3).map((item) => {
                const summary = homeworkSummary(item);
                return (
                  <ThemedText key={`${item.date}:${item.lessonId}`} type="small" themeColor="textSecondary">
                    {summary.text || `фото ${summary.photoCount} · ссылки ${summary.linkCount}`}
                  </ThemedText>
                );
              })
            )}
            <ThemedText type="small" themeColor="textSecondary">
              Всего записей: {homeworkItems.length}
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Открыть ДЗ
            </ThemedText>
          </ThemedView>
        </Pressable>
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
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
});
