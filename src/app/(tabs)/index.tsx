import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import type { Lesson } from '@/data/schedule-11701126';
import { homeworkSummary, useHomeworkMap } from '@/hooks/use-homework';
import { useNow } from '@/hooks/use-now';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { isHomeworkEmpty, listHomeworkEntries } from '@/lib/homework';
import {
  addDays,
  currentMinutes,
  describeNowStatus,
  formatDate,
  formatPlace,
  getLessonsForDate,
  getNowStatus,
  getWeekParity,
  getWeekday,
  minutesFromMidnight,
  toIsoDate,
  WEEKDAY_SHORT,
  weekParityLabel,
  type NowStatus,
} from '@/lib/schedule';
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
  const nowMinutes = currentMinutes(now);
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
      pathname: '/homework-entry',
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
                {currentLesson ? 'Записать ДЗ' : 'Открыть расписание'}
              </ThemedText>
              <AppIcon ios="chevron.right" android="chevron_right" color={theme.accent} size={16} />
            </ThemedView>
          </ThemedView>
        </Pressable>

        <ThemedView style={styles.quickRow}>
          <QuickAction
            label="Расписание"
            iosIcon="calendar"
            androidIcon="calendar_month"
            onPress={() => router.navigate('/schedule')}
          />
          <QuickAction
            label="ДЗ"
            iosIcon="note.text"
            androidIcon="edit_note"
            badge={homeworkItems.length > 0 ? String(homeworkItems.length) : undefined}
            onPress={() => router.navigate('/homework')}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <SectionHeader
            title="Сегодня"
            subtitle={`${todayLessons.length} ${pairsLabel(todayLessons.length)}`}
            action="Все"
            onAction={() => router.navigate('/schedule')}
          />
          {todayLessons.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" themeColor="textSecondary">
                {weekday === 7 ? 'Воскресенье — отдых' : 'На сегодня пар нет'}
              </ThemedText>
            </ThemedView>
          ) : (
            todayLessons.map((lesson) => (
              <LessonTimelineRow
                key={lesson.id}
                lesson={lesson}
                date={todayIso}
                status={nowStatus}
                nowMinutes={nowMinutes}
                hasHomework={!isHomeworkEmpty(homeworkMap[`${todayIso}:${lesson.id}`])}
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

        <ThemedView style={styles.section}>
          <SectionHeader
            title="Домашние задания"
            subtitle={todayHomework.length > 0 ? `на сегодня: ${todayHomework.length}` : 'на сегодня пусто'}
            action="Открыть"
            onAction={() => router.navigate('/homework')}
          />
          {todayHomework.length === 0 ? (
            <Pressable
              onPress={() => router.navigate('/homework')}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.homeworkEmpty}>
                <ThemedView style={[styles.homeworkEmptyIcon, { backgroundColor: theme.accentSoft }]}>
                  <AppIcon ios="plus" android="add" color={theme.accent} size={22} />
                </ThemedView>
                <ThemedText type="smallBold">Добавить ДЗ к сегодняшним парам</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {homeworkItems.length > 0
                    ? `В архиве ${homeworkItems.length} ${entriesLabel(homeworkItems.length)}`
                    : 'Пока ничего не записано'}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ) : (
            todayHomework.slice(0, 3).map((item) => {
              const lesson = todayLessons.find((entry) => entry.id === item.lessonId);
              const summary = homeworkSummary(item);
              return (
                <Pressable
                  key={`${item.date}:${item.lessonId}`}
                  onPress={() =>
                    router.push({
                      pathname: '/homework-entry',
                      params: { lessonId: item.lessonId, date: item.date },
                    })
                  }
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedView type="backgroundElement" style={styles.homeworkRow}>
                    <ThemedView style={styles.homeworkMeta}>
                      <ThemedText type="smallBold">{lesson?.start ?? '—'}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {lesson?.subject ?? 'Пара'}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.homeworkPreview}>
                      {summary.text ||
                        (summary.photoCount > 0 ? `Фото: ${summary.photoCount}` : '') ||
                        (summary.linkCount > 0 ? `Ссылки: ${summary.linkCount}` : '') ||
                        'Открыть'}
                    </ThemedText>
                    <AppIcon ios="chevron.right" android="chevron_right" color={theme.textSecondary} size={16} />
                  </ThemedView>
                </Pressable>
              );
            })
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

function QuickAction({
  label,
  iosIcon,
  androidIcon,
  badge,
  onPress,
}: {
  label: string;
  iosIcon: string;
  androidIcon: string;
  badge?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.quickActionInner}>
        <ThemedView style={[styles.quickIconWrap, { backgroundColor: theme.accentSoft }]}>
          <AppIcon ios={iosIcon} android={androidIcon} color={theme.accent} size={22} />
        </ThemedView>
        <ThemedText type="smallBold">{label}</ThemedText>
        {badge ? (
          <ThemedView style={[styles.quickBadge, { backgroundColor: theme.accent }]}>
            <ThemedText type="smallBold" style={{ color: theme.background, fontSize: 11 }}>
              {badge}
            </ThemedText>
          </ThemedView>
        ) : null}
      </ThemedView>
    </Pressable>
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
  lesson,
  date,
  status,
  nowMinutes,
  hasHomework,
}: {
  lesson: Lesson;
  date: string;
  status: NowStatus;
  nowMinutes: number;
  hasHomework: boolean;
}) {
  const theme = useTheme();
  const isNow = status.kind === 'now' && status.lesson.id === lesson.id;
  const isPast = minutesFromMidnight(lesson.end) <= nowMinutes;
  const isNext =
    (status.kind === 'upcoming' || status.kind === 'break') && status.next.id === lesson.id;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/homework-entry',
          params: { lessonId: lesson.id, date },
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
            {lesson.start}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {lesson.end}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.lessonBody}>
          <ThemedText
            type="smallBold"
            themeColor={isPast && !isNow ? 'textSecondary' : undefined}
            numberOfLines={1}>
            {lesson.subject}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {formatPlace(lesson)}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.lessonTrail}>
          {hasHomework ? (
            <ThemedView style={[styles.hwDot, { backgroundColor: theme.accent }]} />
          ) : (
            <AppIcon ios="plus" android="add" color={theme.textSecondary} size={16} />
          )}
        </ThemedView>
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

function entriesLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return 'запись';
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return 'записи';
  }
  return 'записей';
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
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  quickAction: {
    flex: 1,
  },
  quickActionInner: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 96,
    justifyContent: 'center',
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
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
  lessonTrail: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  hwDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
  homeworkEmpty: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  homeworkEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeworkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  homeworkMeta: {
    width: 88,
    gap: 2,
    backgroundColor: 'transparent',
  },
  homeworkPreview: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
