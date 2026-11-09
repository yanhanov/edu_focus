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

import { DaySwitcher } from '@/features/schedule/components/day-switcher';
import { ScheduleAddButton } from '@/features/schedule/components/schedule-add-button';
import { ScheduleDayPanel } from '@/features/schedule/components/schedule-day-panel';
import { ScheduleWeekSearchPanel } from '@/features/schedule/components/schedule-week-search-panel';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import {
  SubjectSearchBar,
  SubjectSearchToggle,
  useSubjectSearch,
} from '@/shared/ui/subject-search';
import { MaxContentWidth, Spacing } from '@/shared/theme/theme';
import { SCHEDULE_PERIOD } from '@/features/schedule/data/groups';
import { useHomeworkMap } from '@/features/homework/hooks/use-homework';
import { useNow } from '@/shared/hooks/use-now';
import { useProfile } from '@/features/profile/hooks/use-profile';
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
} from '@/features/schedule/lib/schedule';
import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { width: pageWidth } = useWindowDimensions();
  const search = useSubjectSearch();
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
  const weekSearchActive = search.query.trim().length > 0;

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
            <SubjectSearchToggle
              active={search.active}
              onPress={() => (search.open ? search.closeSearch() : search.openSearch())}
            />
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

        {weekSearchActive ? null : (
          <DaySwitcher selected={selectedDay} today={todayWeekday} onSelect={onSelectDay} />
        )}

        {search.open ? (
          <ThemedView style={styles.searchWrap}>
            <SubjectSearchBar
              query={search.query}
              onChangeQuery={search.setQuery}
              onClose={search.closeSearch}
            />
          </ThemedView>
        ) : null}
      </ThemedView>

      {weekSearchActive ? (
        <ScheduleWeekSearchPanel
          now={now}
          query={search.query}
          group={group}
          subgroup={profile.subgroup}
          homeworkMap={homeworkMap}
          bottomInset={insets.bottom}
          todayWeekday={todayWeekday}
          currentLessonId={currentLessonId}
          onOpenLesson={openLesson}
        />
      ) : (
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
      )}
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
  searchWrap: {
    paddingHorizontal: Spacing.four,
  },
  pager: {
    flex: 1,
  },
});
