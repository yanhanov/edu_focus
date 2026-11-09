import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/shared/ui/app-icon';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/shared/theme/theme';
import type { Lesson } from '@/features/schedule/data/schedule-11701126';
import { HomeworkStatusChip } from '@/features/homework/components/homework-status-chip';
import { LessonTypeBadge } from '@/features/schedule/components/lesson-type-badge';
import { homeworkSummary, useHomeworkMap } from '@/features/homework/hooks/use-homework';
import { useNow } from '@/shared/hooks/use-now';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/shared/hooks/use-theme';
import {
  formatLessonTimes,
  homeworkRowTimeColumn,
  groupHomeworkStatus,
  groupHomeworkTodoCount,
  groupLessonsBySubject,
  pickHomeworkEntryForLessons,
} from '@/features/homework/lib/homework-subject';
import {
  homeworkCompletionStatus,
  homeworkKey,
  setHomeworkDone,
  type HomeworkMap,
} from '@/features/homework/lib/homework';
import {
  addDays,
  currentMinutes,
  describeNowStatus,
  formatDate,
  formatPlace,
  getLessonsForDate,
  getPublicHolidayOnDate,
  getNowStatus,
  getWeekParity,
  getWeekday,
  minutesFromMidnight,
  toIsoDate,
  WEEKDAY_SHORT,
  weekParityLabel,
  type NowStatus,
} from '@/features/schedule/lib/schedule';
import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const { group, profile } = useProfile();
  const homeworkMap = useHomeworkMap();
  const weekday = getWeekday(now);
  const weekLabel = weekParityLabel(getWeekParity(now));
  const todayLessons = getLessonsForDate(now, group.lessons, profile.subgroup);
  const tomorrow = addDays(now, 1);
  const tomorrowLessons = getLessonsForDate(tomorrow, group.lessons, profile.subgroup);
  const todayHoliday = getPublicHolidayOnDate(now);
  const nowStatus = getNowStatus(todayLessons, now);
  const statusCopy = describeNowStatus(nowStatus, weekday, todayHoliday?.localName);
  const currentLesson =
    nowStatus.kind === 'now'
      ? nowStatus.lesson
      : nowStatus.kind === 'upcoming' || nowStatus.kind === 'break'
        ? nowStatus.next
        : undefined;
  const todayIso = toIsoDate(now);
  const nowMinutes = currentMinutes(now);
  const todaySubjectGroups = groupLessonsBySubject(todayLessons);
  const pendingHomeworkCount = groupHomeworkTodoCount(todayIso, todayLessons, homeworkMap);
  const doneToday = todayLessons.filter((lesson) => minutesFromMidnight(lesson.end) <= nowMinutes).length;

  useEffect(() => {
    syncScheduleWidget(now);
  }, [now]);

  const openCurrentHomework = () => {
    if (!currentLesson) {
      router.navigate('/schedule');
      return;
    }
    router.push({
      pathname: '/lesson',
      params: { lessonId: currentLesson.id, date: todayIso },
    });
  };

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
          <ThemedView style={styles.headerTop}>
            <ThemedView style={[styles.weekPill, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                {weekLabel}
              </ThemedText>
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary">
              {group.id}
              {profile.subgroup ? ` · п/г ${profile.subgroup}` : ''}
            </ThemedText>
          </ThemedView>
          <ThemedText type="subtitle">{WEEKDAY_SHORT[weekday]}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(now)} · {group.specialty}
          </ThemedText>
        </ThemedView>

        <Pressable onPress={openCurrentHomework} style={({ pressed }) => pressed && styles.pressed}>
          <ThemedView style={[styles.hero, { backgroundColor: theme.accentSoft }]}>
            <ThemedView style={styles.heroTop}>
              <StatusBadge status={nowStatus} />
              {todayLessons.length > 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {doneToday}/{todayLessons.length} пар
                </ThemedText>
              ) : null}
            </ThemedView>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              {statusCopy.title}
            </ThemedText>
            <ThemedText style={styles.heroDetail}>{statusCopy.detail}</ThemedText>
            {currentLesson ? (
              <ThemedText type="small" themeColor="textSecondary">
                {formatPlace(currentLesson)}
              </ThemedText>
            ) : null}
            <ThemedView style={[styles.heroAction, { backgroundColor: theme.background }]}>
              <AppIcon
                ios={currentLesson ? 'square.and.pencil' : 'calendar'}
                android={currentLesson ? 'edit_note' : 'calendar_month'}
                color={theme.accent}
                size={18}
              />
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                {currentLesson ? 'Подробнее о паре' : 'Открыть расписание'}
              </ThemedText>
              <AppIcon ios="chevron.right" android="chevron_right" color={theme.accent} size={16} />
            </ThemedView>
          </ThemedView>
        </Pressable>

        <ThemedView style={styles.section}>
          <SectionHeader
            title="Сегодня"
            subtitle={
              pendingHomeworkCount > 0
                ? `${todayLessons.length} ${pairsLabel(todayLessons.length)} · ДЗ не сделано: ${pendingHomeworkCount}`
                : `${todayLessons.length} ${pairsLabel(todayLessons.length)}`
            }
            action="Расписание"
            onAction={() => router.navigate('/schedule')}
          />
          {todayLessons.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" themeColor="textSecondary">
                {weekday === 7 ? 'Воскресенье — отдых' : 'На сегодня пар нет'}
              </ThemedText>
            </ThemedView>
          ) : (
            todaySubjectGroups.map((group, index) => (
              <LessonTimelineRow
                key={group.key}
                lessons={group.lessons}
                date={todayIso}
                status={nowStatus}
                nowMinutes={nowMinutes}
                prevGroup={index > 0 ? todaySubjectGroups[index - 1] : undefined}
                homeworkMap={homeworkMap}
              />
            ))
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <SectionHeader
            title="Завтра"
            subtitle={`${WEEKDAY_SHORT[getWeekday(tomorrow)]} · ${tomorrowLessons.length} ${pairsLabel(tomorrowLessons.length)}`}
          />
          {tomorrowLessons.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Завтра пар нет
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView type="backgroundElement" style={styles.tomorrowCard}>
              {tomorrowLessons.slice(0, 4).map((lesson) => (
                <ThemedView key={lesson.id} style={styles.tomorrowRow}>
                  <ThemedText type="smallBold" style={styles.tomorrowTime}>
                    {lesson.start}
                  </ThemedText>
                  <ThemedText type="small" style={styles.tomorrowSubject} numberOfLines={1}>
                    {lesson.subject}
                  </ThemedText>
                  <LessonTypeBadge type={lesson.type} />
                </ThemedView>
              ))}
              {tomorrowLessons.length > 4 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  ещё {tomorrowLessons.length - 4}
                </ThemedText>
              ) : null}
            </ThemedView>
          )}
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
}

function StatusBadge({ status }: { status: NowStatus }) {
  const theme = useTheme();
  const config =
    status.kind === 'now'
      ? { label: 'Идёт пара', dot: true }
      : status.kind === 'upcoming'
        ? { label: 'Скоро', dot: false }
        : status.kind === 'break'
          ? { label: 'Перемена', dot: false }
          : status.kind === 'done'
            ? { label: 'День завершён', dot: false }
            : { label: 'Свободно', dot: false };

  return (
    <ThemedView style={[styles.badge, { backgroundColor: theme.background }]}>
      {config.dot ? (
        <ThemedView style={[styles.liveDot, { backgroundColor: theme.accent }]} />
      ) : null}
      <ThemedText type="smallBold">{config.label}</ThemedText>
    </ThemedView>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <ThemedView style={styles.sectionHeader}>
      <ThemedView style={styles.sectionTitles}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </ThemedView>
      {action && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            {action}
          </ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

function LessonTimelineRow({
  lessons,
  date,
  status,
  nowMinutes,
  prevGroup,
  homeworkMap,
}: {
  lessons: Lesson[];
  date: string;
  status: NowStatus;
  nowMinutes: number;
  prevGroup?: { lessons: Lesson[] };
  homeworkMap: HomeworkMap;
}) {
  const theme = useTheme();
  const lesson = lessons[0]!;
  const lastLesson = lessons[lessons.length - 1]!;
  const lessonIds = new Set(lessons.map((item) => item.id));
  const isNow = status.kind === 'now' && lessonIds.has(status.lesson.id);
  const isPast = minutesFromMidnight(lastLesson.end) <= nowMinutes;
  const isNext =
    (status.kind === 'upcoming' || status.kind === 'break') && lessonIds.has(status.next.id);
  const entry = pickHomeworkEntryForLessons(date, lessons, homeworkMap);
  const hwStatus = groupHomeworkStatus(date, lessons, homeworkMap);
  const summary = homeworkSummary(entry);
  const prevStatus = prevGroup
    ? groupHomeworkStatus(date, prevGroup.lessons, homeworkMap)
    : 'none';
  const openLessonId = entry?.lessonId ?? lesson.id;
  const { start: timeStart, end: timeEnd } = homeworkRowTimeColumn(lessons);
  const slotTimes = lessons.length > 1 ? formatLessonTimes(lessons) : null;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/lesson',
          params: { lessonId: openLessonId, date },
        })
      }
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type="backgroundElement"
        style={[
          styles.lessonRow,
          isNow && { backgroundColor: theme.accentSoft, borderColor: theme.accent, borderWidth: 1 },
          isNext && !isNow && { borderColor: theme.backgroundSelected, borderWidth: 1 },
          isPast && !isNow && styles.lessonPast,
        ]}>
        <ThemedView style={styles.lessonTime}>
          <ThemedText
            type="smallBold"
            themeColor={isPast && !isNow ? 'textSecondary' : undefined}
            style={isNow ? { color: theme.accent } : undefined}>
            {timeStart}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {timeEnd}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.lessonBody}>
          <ThemedView style={[styles.lessonTitleRow, { backgroundColor: 'transparent' }]}>
            <ThemedText
              type="smallBold"
              themeColor={isPast && !isNow ? 'textSecondary' : undefined}
              numberOfLines={1}
              style={styles.lessonSubject}>
              {lesson.subject}
            </ThemedText>
            <LessonTypeBadge type={lesson.type} highlighted={isNow} />
          </ThemedView>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {formatPlace(lesson)}
          </ThemedText>
          {slotTimes ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {slotTimes}
            </ThemedText>
          ) : null}
          {prevStatus !== 'none' ? (
            <HomeworkStatusChip status={prevStatus} compact prefix="К след. паре" />
          ) : null}
          {summary.text ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {summary.text}
            </ThemedText>
          ) : null}
          {hwStatus !== 'none' ? (
            <HomeworkStatusChip
              status={hwStatus === 'done' ? 'done' : 'todo'}
              compact
              onToggle={() => {
                const nextDone = hwStatus !== 'done';
                for (const item of lessons) {
                  const itemStatus = homeworkCompletionStatus(homeworkMap[homeworkKey(date, item.id)]);
                  if (itemStatus !== 'none') {
                    void setHomeworkDone(date, item.id, nextDone);
                  }
                }
              }}
            />
          ) : null}
        </ThemedView>
        <AppIcon ios="chevron.right" android="chevron_right" color={theme.textSecondary} size={16} />
      </ThemedView>
    </Pressable>
  );
}

function pairsLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return 'пара';
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return 'пары';
  }
  return 'пар';
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
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  weekPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half + 2,
    borderRadius: Spacing.five,
  },
  hero: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  heroDetail: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: 600,
  },
  heroAction: {
    marginTop: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half + 2,
    borderRadius: Spacing.five,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  section: {
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  sectionTitles: {
    gap: 2,
    backgroundColor: 'transparent',
  },
  emptyCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  lessonPast: {
    opacity: 0.72,
  },
  lessonTime: {
    minWidth: 52,
    gap: 2,
    backgroundColor: 'transparent',
  },
  lessonBody: {
    flex: 1,
    gap: 2,
    backgroundColor: 'transparent',
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  lessonSubject: {
    flex: 1,
    minWidth: 0,
  },
  tomorrowCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  tomorrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: 'transparent',
  },
  tomorrowTime: {
    width: 48,
  },
  tomorrowSubject: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
