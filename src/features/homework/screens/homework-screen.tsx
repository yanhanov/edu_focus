import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/shared/ui/app-icon';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import {
  SubjectSearchBar,
  SubjectSearchToggle,
  useSubjectSearch,
} from '@/shared/ui/subject-search';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/shared/theme/theme';
import { useHomeworkMap } from '@/features/homework/hooks/use-homework';
import { HomeworkRow } from '@/features/homework/components/homework-row';
import { HomeworkWeekSearchSection } from '@/features/homework/components/homework-week-search-section';
import { useNow } from '@/shared/hooks/use-now';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/shared/hooks/use-theme';
import {
  dedupeHomeworkEntriesBySubject,
  groupLessonsBySubject,
  subjectMatchesQuery,
} from '@/features/homework/lib/homework-subject';
import { listHomeworkEntries, type HomeworkEntry } from '@/features/homework/lib/homework';
import {
  getMatchingLessonsForWeek,
  isIsoInStudyWeek,
} from '@/features/schedule/lib/week-search';
import {
  addDays,
  formatDate,
  getLessonById,
  getLessonsForDate,
  getWeekday,
  toIsoDate,
  WEEKDAY_SHORT,
} from '@/features/schedule/lib/schedule';

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

export default function HomeworkListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const { group, profile } = useProfile();
  const homeworkMap = useHomeworkMap();
  const search = useSubjectSearch();
  const todayIso = toIsoDate(now);
  const weekSearchActive = search.query.trim().length > 0;
  const todayLessons = getLessonsForDate(now, group.lessons, profile.subgroup);
  const todayGroups = useMemo(
    () => groupLessonsBySubject(todayLessons),
    [todayLessons],
  );
  const weekSearchHitCount = useMemo(() => {
    if (!weekSearchActive) {
      return 0;
    }
    return getMatchingLessonsForWeek(now, group.lessons, profile.subgroup, search.query).length;
  }, [weekSearchActive, now, group.lessons, profile.subgroup, search.query]);
  const saved = listHomeworkEntries(homeworkMap).filter((item) =>
    Boolean(getLessonById(item.lessonId, group.lessons)),
  );
  const earlier = saved.filter((item) => {
    if (item.date === todayIso) {
      return false;
    }
    if (weekSearchActive && isIsoInStudyWeek(item.date, now)) {
      return false;
    }
    return true;
  });
  const earlierGroups = useMemo(() => {
    const byDate = groupByDate(earlier);
    return byDate
      .map((bucket) => ({
        date: bucket.date,
        rows: dedupeHomeworkEntriesBySubject(bucket.items, (lessonId) =>
          getLessonById(lessonId, group.lessons),
        ).filter((row) => !weekSearchActive || subjectMatchesQuery(row.lessons[0]!, search.query)),
      }))
      .filter((bucket) => bucket.rows.length > 0);
  }, [earlier, group.lessons, search.query, weekSearchActive]);

  const showEmptySearch =
    weekSearchActive && weekSearchHitCount === 0 && earlierGroups.length === 0;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
          },
        ]}>
        <ThemedView style={styles.header}>
          <ThemedView style={styles.headerTop}>
            <ThemedView style={styles.headerCopy}>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDate(now)}
              </ThemedText>
              <ThemedText type="subtitle">ДЗ</ThemedText>
            </ThemedView>
            <SubjectSearchToggle
              active={search.active}
              onPress={() => (search.open ? search.closeSearch() : search.openSearch())}
            />
          </ThemedView>
        </ThemedView>

        {search.open ? (
          <SubjectSearchBar
            query={search.query}
            onChangeQuery={search.setQuery}
            onClose={search.closeSearch}
          />
        ) : null}

        {weekSearchActive ? (
          <HomeworkWeekSearchSection
            now={now}
            query={search.query}
            allLessons={group.lessons}
            subgroup={profile.subgroup}
            homeworkMap={homeworkMap}
          />
        ) : todayGroups.length > 0 ? (
          <ThemedView style={styles.block}>
            <ThemedText type="smallBold">Сегодняшние пары</ThemedText>
            {todayGroups.map((item) => (
              <HomeworkRow
                key={item.key}
                lessons={item.lessons}
                date={todayIso}
                homeworkMap={homeworkMap}
                emptyLabel="Добавить"
              />
            ))}
          </ThemedView>
        ) : null}

        {earlierGroups.length > 0 ? (
          <ThemedView style={styles.block}>
            {weekSearchActive ? (
              <ThemedText type="smallBold">Сохранённые задания</ThemedText>
            ) : null}
            {earlierGroups.map((groupItems) => (
              <ThemedView key={groupItems.date} style={styles.dateBucket}>
                <ThemedText type="smallBold">{dateHeading(groupItems.date, todayIso)}</ThemedText>
                {groupItems.rows.map((row) => (
                  <HomeworkRow
                    key={row.key}
                    lessons={row.lessons}
                    date={row.date}
                    homeworkMap={homeworkMap}
                    entry={row.entry}
                  />
                ))}
              </ThemedView>
            ))}
          </ThemedView>
        ) : null}

        {showEmptySearch ? (
          <ThemedView type="backgroundElement" style={styles.empty}>
            <ThemedText type="smallBold">Ничего не найдено</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Нет пар и сохранённых заданий по этому запросу
            </ThemedText>
          </ThemedView>
        ) : null}

        {!showEmptySearch &&
        !weekSearchActive &&
        todayGroups.length === 0 &&
        earlierGroups.length === 0 ? (
          <ThemedView type="backgroundElement" style={styles.empty}>
            <ThemedView style={[styles.emptyIcon, { backgroundColor: theme.accentSoft }]}>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  block: {
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  dateBucket: {
    gap: Spacing.two,
    backgroundColor: 'transparent',
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
});
