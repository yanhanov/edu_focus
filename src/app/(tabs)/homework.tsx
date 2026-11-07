import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { homeworkSummary, useHomeworkMap } from '@/hooks/use-homework';
import { useNow } from '@/hooks/use-now';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { HomeworkStatusChip } from '@/components/homework/homework-status-chip';
import { LessonTypeBadge } from '@/components/schedule/lesson-type-badge';
import {
  homeworkCompletionStatus,
  listHomeworkEntries,
  setHomeworkDone,
  type HomeworkEntry,
} from '@/lib/homework';
import {
  addDays,
  formatDate,
  getLessonById,
  getLessonsForDate,
  getWeekday,
  toIsoDate,
  WEEKDAY_SHORT,
} from '@/lib/schedule';
import type { Lesson } from '@/data/schedule-11701126';

function parseDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dateHeading(iso: string, todayIso: string): string {
  if (iso === todayIso) {
    return 'Сегодня';
  }
  if (iso === toIsoDate(addDays(parseDate(todayIso), -1))) {
    return 'Вчера';
  }
  const date = parseDate(iso);
  return `${WEEKDAY_SHORT[getWeekday(date)]} · ${formatDate(date)}`;
}

function openEntry(lessonId: string, date: string) {
  router.push({
    pathname: '/homework-entry',
    params: { lessonId, date },
  });
}

export default function HomeworkListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const { group, profile } = useProfile();
  const homeworkMap = useHomeworkMap();
  const todayIso = toIsoDate(now);
  const todayLessons = getLessonsForDate(now, group.lessons, profile.subgroup);
  const saved = listHomeworkEntries(homeworkMap).filter((item) =>
    Boolean(getLessonById(item.lessonId, group.lessons))
  );
  const earlier = saved.filter((item) => item.date !== todayIso);
  const earlierGroups = groupByDate(earlier);

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
            {formatDate(now)}
          </ThemedText>
          <ThemedText type="subtitle">ДЗ</ThemedText>
        </ThemedView>

        {todayLessons.length > 0 ? (
          <ThemedView style={styles.block}>
            <ThemedText type="smallBold">Сегодняшние пары</ThemedText>
            {todayLessons.map((lesson) => (
              <HomeworkRow
                key={lesson.id}
                lesson={lesson}
                date={todayIso}
                entry={homeworkMap[`${todayIso}:${lesson.id}`]}
                emptyLabel="Добавить"
                alwaysShowStatus
              />
            ))}
          </ThemedView>
        ) : null}

        {earlierGroups.map((groupItems) => (
          <ThemedView key={groupItems.date} style={styles.block}>
            <ThemedText type="smallBold">{dateHeading(groupItems.date, todayIso)}</ThemedText>
            {groupItems.items.map((item) => {
              const lesson = getLessonById(item.lessonId, group.lessons);
              if (!lesson) {
                return null;
              }
              return (
                <HomeworkRow
                  key={`${item.date}:${item.lessonId}`}
                  lesson={lesson}
                  date={item.date}
                  entry={item}
                />
              );
            })}
          </ThemedView>
        ))}

        {todayLessons.length === 0 && earlier.length === 0 ? (
          <ThemedView type="backgroundElement" style={styles.empty}>
            <ThemedView
              style={[styles.emptyIcon, { backgroundColor: theme.accentSoft }]}>
              <AppIcon ios="note.text" android="edit_note" color={theme.accent} size={28} />
            </ThemedView>
            <ThemedText type="smallBold">Пока нет заданий</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Откройте пару в расписании или вернитесь в учебный день
            </ThemedText>
          </ThemedView>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function HomeworkRow({
  lesson,
  date,
  entry,
  emptyLabel,
  alwaysShowStatus = false,
}: {
  lesson: Lesson;
  date: string;
  entry?: HomeworkEntry;
  emptyLabel?: string;
  alwaysShowStatus?: boolean;
}) {
  const theme = useTheme();
  const summary = homeworkSummary(entry);
  const photos = entry?.photos.slice(0, 3) ?? [];
  const completion = homeworkCompletionStatus(entry);

  return (
    <Pressable
      onPress={() => openEntry(lesson.id, date)}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedView style={styles.timeCol}>
          <ThemedText type="smallBold">{lesson.start}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {lesson.end}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.body}>
          <ThemedView style={styles.subjectRow}>
            <ThemedText type="smallBold" style={styles.subjectTitle}>
              {lesson.subject}
            </ThemedText>
            <LessonTypeBadge type={lesson.type} />
            {alwaysShowStatus || completion !== 'none' ? (
              <HomeworkStatusChip
                status={completion === 'done' ? 'done' : 'todo'}
                compact
                onToggle={() => {
                  void setHomeworkDone(date, lesson.id, completion !== 'done');
                }}
              />
            ) : null}
          </ThemedView>
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

function groupByDate(items: HomeworkEntry[]): { date: string; items: HomeworkEntry[] }[] {
  const groups: { date: string; items: HomeworkEntry[] }[] = [];
  items.forEach((item) => {
    const last = groups[groups.length - 1];
    if (last && last.date === item.date) {
      last.items.push(item);
      return;
    }
    groups.push({ date: item.date, items: [item] });
  });
  return groups;
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
  block: {
    gap: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  timeCol: {
    minWidth: 52,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  subjectTitle: {
    flex: 1,
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
  empty: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
