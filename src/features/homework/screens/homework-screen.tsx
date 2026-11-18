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
import { groupHomeworkBySubject } from '@/features/homework/lib/homework-subject';
import { listHomeworkEntries } from '@/features/homework/lib/homework';
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
  const weekSearchHitCount = useMemo(() => {
    if (!weekSearchActive) {
      return 0;
    }
    return getMatchingLessonsForWeek(now, group.lessons, profile.subgroup, search.query).length;
  }, [weekSearchActive, now, group.lessons, profile.subgroup, search.query]);
  const saved = useMemo(
    () =>
      listHomeworkEntries(homeworkMap).filter((item) =>
        Boolean(getLessonById(item.lessonId, group.lessons)),
      ),
    [homeworkMap, group.lessons],
  );
  const savedForList = useMemo(
    () => (weekSearchActive ? saved.filter((item) => !isIsoInStudyWeek(item.date, now)) : saved),
    [weekSearchActive, saved, now],
  );

  const subjectGroups = useMemo(
    () =>
      groupHomeworkBySubject({
        todayIso,
        todayLessons,
        saved: savedForList,
        homeworkMap,
        resolveLesson: (lessonId) => getLessonById(lessonId, group.lessons),
        query: search.query,
        includeTodaySlots: !weekSearchActive,
      }),
    [
      todayIso,
      todayLessons,
      savedForList,
      homeworkMap,
      group.lessons,
      search.query,
      weekSearchActive,
    ],
  );

  const showEmptySearch =
    weekSearchActive && weekSearchHitCount === 0 && subjectGroups.length === 0;

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
        ) : null}

        {subjectGroups.length > 0 ? (
          <ThemedView style={styles.block}>
            {weekSearchActive ? (
              <ThemedText type="smallBold">Сохранённые задания</ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                По предметам
              </ThemedText>
            )}
            {subjectGroups.map((subjectGroup) => (
              <ThemedView key={subjectGroup.key} type="backgroundElement" style={styles.subjectCard}>
                <ThemedView style={styles.subjectHeader}>
                  <ThemedText type="smallBold" style={styles.subjectTitle}>
                    {subjectGroup.subject}
                  </ThemedText>
                  {subjectGroup.teacher ? (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {subjectGroup.teacher}
                    </ThemedText>
                  ) : null}
                </ThemedView>
                {subjectGroup.dateBuckets.map((bucket) => (
                  <ThemedView key={bucket.date} style={styles.dateBucket}>
                    <ThemedText type="smallBold">{dateHeading(bucket.date, todayIso)}</ThemedText>
                    {bucket.rows.map((row) => (
                      <HomeworkRow
                        key={row.key}
                        lessons={row.lessons}
                        date={bucket.date}
                        homeworkMap={homeworkMap}
                        entry={row.entry}
                        emptyLabel="Добавить"
                        nested
                      />
                    ))}
                  </ThemedView>
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

        {!showEmptySearch && !weekSearchActive && subjectGroups.length === 0 ? (
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
    gap: Spacing.three,
    backgroundColor: 'transparent',
  },
  subjectCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  subjectHeader: {
    gap: 2,
    backgroundColor: 'transparent',
  },
  subjectTitle: {
    fontSize: 16,
    lineHeight: 22,
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
