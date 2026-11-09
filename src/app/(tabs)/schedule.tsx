import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DaySwitcher } from '@/components/schedule/day-switcher';
import { ScheduleAddButton } from '@/components/schedule/schedule-add-button';
import { ScheduleDayPanel } from '@/components/schedule/schedule-day-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { SCHEDULE_PERIOD } from '@/data/groups';
import { useHomeworkMap } from '@/hooks/use-homework';
import { useNow } from '@/hooks/use-now';
import { useProfile } from '@/hooks/use-profile';
import {
  dateForWeekday,
  getLessonsForDate,
  getNowStatus,
  getWeekParity,
  getWeekday,
  startOfDay,
  STUDY_WEEKDAYS,
  toIsoDate,
  weekParityLabel,
  type Weekday,
} from '@/lib/schedule';
import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { width: pageWidth } = useWindowDimensions();
  const now = useNow();
  const { group, profile } = useProfile();
  const homeworkMap = useHomeworkMap();
  const todayWeekday = getWeekday(now);
  const initialDay = todayWeekday === 7 ? 1 : todayWeekday;
  const [selectedDay, setSelectedDay] = useState<Exclude<Weekday, 7>>(initialDay);
  const pagerRef = useRef<FlatList<Exclude<Weekday, 7>>>(null);

  const selectedDate = dateForWeekday(now, selectedDay);
  const isToday = startOfDay(selectedDate).getTime() === startOfDay(now).getTime();
  const weekLabel = weekParityLabel(getWeekParity(isToday ? now : selectedDate));
  const todayLessons = getLessonsForDate(now, group.lessons, profile.subgroup);
  const nowStatus = getNowStatus(todayLessons, now);
  const currentLessonId = nowStatus.kind === 'now' ? nowStatus.lesson.id : undefined;

  useEffect(() => {
    syncScheduleWidget(now);
  }, [now]);

  const scrollToDay = useCallback(
    (day: Exclude<Weekday, 7>, animated: boolean) => {
      const index = STUDY_WEEKDAYS.indexOf(day);
      if (index < 0) {
        return;
      }
      pagerRef.current?.scrollToIndex({ index, animated });
    },
    [],
  );

  const onSelectDay = useCallback(
    (day: Exclude<Weekday, 7>) => {
      setSelectedDay(day);
      scrollToDay(day, true);
    },
    [scrollToDay],
  );

  const onPagerScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      const day = STUDY_WEEKDAYS[index];
      if (day) {
        setSelectedDay((prev) => (prev === day ? prev : day));
      }
    },
    [pageWidth],
  );

  const openLesson = useCallback((lessonId: string, date: string) => {
    router.push({
      pathname: '/lesson',
      params: { lessonId, date },
    });
  }, []);

  const initialIndex = STUDY_WEEKDAYS.indexOf(initialDay);

  return (
    <ThemedView style={styles.screen}>
      <ThemedView
        style={[
          styles.headerBlock,
          { paddingTop: insets.top + Spacing.three, maxWidth: MaxContentWidth },
        ]}>
        <ThemedView style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            Группа {group.id}
            {profile.subgroup ? ` · подгруппа ${profile.subgroup}` : ''}
          </ThemedText>
          <ThemedView style={styles.titleRow}>
            <ThemedView style={styles.titleCopy}>
              <ThemedText type="subtitle">Расписание</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {weekLabel}
              </ThemedText>
            </ThemedView>
            <ScheduleAddButton
              onPress={() =>
                router.push({
                  pathname: '/add-activity',
                  params: { date: toIsoDate(selectedDate) },
                })
              }
            />
          </ThemedView>
          <ThemedText type="small" themeColor="textSecondary">
            {SCHEDULE_PERIOD}
          </ThemedText>
        </ThemedView>

        <DaySwitcher selected={selectedDay} today={todayWeekday} onSelect={onSelectDay} />
      </ThemedView>

      <FlatList
        ref={pagerRef}
        data={STUDY_WEEKDAYS}
        horizontal
        pagingEnabled
        bounces={false}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(day) => String(day)}
        initialScrollIndex={initialIndex >= 0 ? initialIndex : 0}
        getItemLayout={(_, index) => ({
          length: pageWidth,
          offset: pageWidth * index,
          index,
        })}
        onMomentumScrollEnd={onPagerScrollEnd}
        onScrollToIndexFailed={({ index }) => {
          pagerRef.current?.scrollToOffset({ offset: pageWidth * index, animated: false });
        }}
        renderItem={({ item: day }) => (
          <ScheduleDayPanel
            day={day}
            now={now}
            todayWeekday={todayWeekday}
            group={group}
            subgroup={profile.subgroup}
            homeworkMap={homeworkMap}
            pageWidth={pageWidth}
            bottomInset={insets.bottom}
            currentLessonId={currentLessonId}
            onOpenHomework={openLesson}
          />
        )}
        style={styles.pager}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBlock: {
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.three,
  },
  header: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  titleCopy: {
    flex: 1,
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  pager: {
    flex: 1,
  },
});
