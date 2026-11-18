import type { Lesson } from '@/features/schedule/data/schedule-11701126';
import type { SubgroupPreference } from '@/features/profile/lib/profile';
import {
  addDays,
  getLessonsForDate,
  toIsoDate,
} from '@/features/schedule/lib/schedule';

import {
  homeworkCompletionStatus,
  homeworkKey,
  type HomeworkCompletionStatus,
  type HomeworkEntry,
  type HomeworkMap,
} from '@/features/homework/lib/homework';

export type SubjectDayGroup = {
  key: string;
  lessons: Lesson[];
  primaryLesson: Lesson;
};

export function lessonSubjectKey(lesson: Pick<Lesson, 'subject' | 'teacher'>): string {
  const subject = lesson.subject.trim().toLowerCase().replace(/\s+/g, ' ');
  const teacher = lesson.teacher.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${subject}|${teacher}`;
}

export function subjectMatchesQuery(
  lesson: Pick<Lesson, 'subject' | 'teacher'>,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    lesson.subject.toLowerCase().includes(q) || lesson.teacher.toLowerCase().includes(q)
  );
}

export function groupLessonsBySubject(lessons: Lesson[]): SubjectDayGroup[] {
  const map = new Map<string, Lesson[]>();
  for (const lesson of lessons) {
    const key = lessonSubjectKey(lesson);
    const list = map.get(key) ?? [];
    list.push(lesson);
    map.set(key, list);
  }

  return [...map.entries()]
    .map(([key, groupLessons]) => {
      const sorted = [...groupLessons].sort((a, b) => a.start.localeCompare(b.start));
      return { key, lessons: sorted, primaryLesson: sorted[0]! };
    })
    .sort((a, b) => a.primaryLesson.start.localeCompare(b.primaryLesson.start));
}

export function formatLessonTimes(lessons: Lesson[]): string {
  if (lessons.length === 0) {
    return '';
  }
  if (lessons.length === 1) {
    const only = lessons[0]!;
    return `${only.start}–${only.end}`;
  }
  const first = lessons[0]!;
  const last = lessons[lessons.length - 1]!;
  if (lessons.length === 2) {
    return `${first.start}–${first.end}, ${last.start}–${last.end}`;
  }
  return `${first.start}–${last.end}`;
}

/** Время для узкой колонки карточки ДЗ (как в расписании: начало / конец). */
export function homeworkRowTimeColumn(lessons: Lesson[]): { start: string; end: string } {
  const first = lessons[0];
  if (!first) {
    return { start: '', end: '' };
  }
  const last = lessons[lessons.length - 1]!;
  return {
    start: first.start,
    end: lessons.length === 1 ? first.end : last.end,
  };
}

export function pickHomeworkEntryForLessons(
  date: string,
  lessons: Lesson[],
  map: HomeworkMap,
): HomeworkEntry | undefined {
  const entries = lessons
    .map((lesson) => map[homeworkKey(date, lesson.id)])
    .filter((entry): entry is HomeworkEntry => Boolean(entry));

  if (entries.length === 0) {
    return undefined;
  }

  return [...entries].sort((a, b) => {
    const aRank = homeworkCompletionStatus(a) === 'none' ? 0 : 1;
    const bRank = homeworkCompletionStatus(b) === 'none' ? 0 : 1;
    if (aRank !== bRank) {
      return bRank - aRank;
    }
    return b.updatedAt - a.updatedAt;
  })[0];
}

export function groupHomeworkStatus(
  date: string,
  lessons: Lesson[],
  map: HomeworkMap,
): HomeworkCompletionStatus {
  const statuses = lessons.map((lesson) =>
    homeworkCompletionStatus(map[homeworkKey(date, lesson.id)]),
  );
  if (statuses.some((status) => status === 'todo')) {
    return 'todo';
  }
  if (statuses.some((status) => status === 'done')) {
    return 'done';
  }
  return 'none';
}

export function groupHomeworkTodoCount(
  date: string,
  lessons: Lesson[],
  map: HomeworkMap,
): number {
  return groupLessonsBySubject(lessons).filter(
    (group) => groupHomeworkStatus(date, group.lessons, map) === 'todo',
  ).length;
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export type NextSubjectLesson = {
  iso: string;
  date: Date;
  lesson: Lesson;
};

/** Следующая пара этого предмета — не раньше следующего дня после записи. */
export function findNextSubjectLesson(
  afterIso: string,
  lesson: Pick<Lesson, 'subject' | 'teacher'>,
  allLessons: readonly Lesson[],
  subgroup: SubgroupPreference,
  maxDays = 56,
): NextSubjectLesson | undefined {
  const key = lessonSubjectKey(lesson);
  const afterDate = parseIsoDate(afterIso);
  for (let offset = 1; offset <= maxDays; offset++) {
    const date = addDays(afterDate, offset);
    const match = getLessonsForDate(date, allLessons, subgroup).find(
      (item) => lessonSubjectKey(item) === key,
    );
    if (match) {
      return { iso: toIsoDate(date), date, lesson: match };
    }
  }
  return undefined;
}

export type HomeworkSubjectDateBucket = {
  date: string;
  rows: {
    key: string;
    lessons: Lesson[];
    entry?: HomeworkEntry;
  }[];
};

export type HomeworkSubjectGroup = {
  key: string;
  subject: string;
  teacher: string;
  todayStart: string | null;
  dateBuckets: HomeworkSubjectDateBucket[];
};

type SubjectAccumulator = {
  key: string;
  subject: string;
  teacher: string;
  todayStart: string | null;
  dates: Map<string, { lessons: Lesson[]; entries: HomeworkEntry[] }>;
};

function ensureSubject(
  acc: Map<string, SubjectAccumulator>,
  lesson: Lesson,
  todayStart: string | null,
): SubjectAccumulator {
  const key = lessonSubjectKey(lesson);
  const existing = acc.get(key);
  if (existing) {
    if (!existing.todayStart && todayStart) {
      existing.todayStart = todayStart;
    }
    return existing;
  }
  const created: SubjectAccumulator = {
    key,
    subject: lesson.subject,
    teacher: lesson.teacher,
    todayStart,
    dates: new Map(),
  };
  acc.set(key, created);
  return created;
}

function ensureDate(
  subject: SubjectAccumulator,
  date: string,
): { lessons: Lesson[]; entries: HomeworkEntry[] } {
  const existing = subject.dates.get(date);
  if (existing) {
    return existing;
  }
  const created = { lessons: [] as Lesson[], entries: [] as HomeworkEntry[] };
  subject.dates.set(date, created);
  return created;
}

function uniqueLessons(lessons: Lesson[]): Lesson[] {
  const seen = new Set<string>();
  const result: Lesson[] = [];
  for (const lesson of lessons) {
    if (seen.has(lesson.id)) {
      continue;
    }
    seen.add(lesson.id);
    result.push(lesson);
  }
  return result.sort((a, b) => a.start.localeCompare(b.start));
}

export function groupHomeworkBySubject(options: {
  todayIso: string;
  todayLessons: Lesson[];
  saved: HomeworkEntry[];
  homeworkMap: HomeworkMap;
  resolveLesson: (lessonId: string) => Lesson | undefined;
  query?: string;
  includeTodaySlots?: boolean;
}): HomeworkSubjectGroup[] {
  const {
    todayIso,
    todayLessons,
    saved,
    homeworkMap,
    resolveLesson,
    query = '',
    includeTodaySlots = true,
  } = options;
  const acc = new Map<string, SubjectAccumulator>();

  if (includeTodaySlots) {
    for (const group of groupLessonsBySubject(todayLessons)) {
      const subject = ensureSubject(acc, group.primaryLesson, group.primaryLesson.start);
      const day = ensureDate(subject, todayIso);
      day.lessons.push(...group.lessons);
      const entry = pickHomeworkEntryForLessons(todayIso, group.lessons, homeworkMap);
      if (entry) {
        day.entries.push(entry);
      }
    }
  }

  for (const item of saved) {
    const lesson = resolveLesson(item.lessonId);
    if (!lesson) {
      continue;
    }
    const subject = ensureSubject(acc, lesson, null);
    const day = ensureDate(subject, item.date);
    day.lessons.push(lesson);
    day.entries.push(item);
  }

  return [...acc.values()]
    .map((subject) => {
      const dateBuckets = [...subject.dates.entries()]
        .map(([date, bucket]) => {
          const lessons = uniqueLessons(bucket.lessons);
          const entry = [...bucket.entries].sort((a, b) => b.updatedAt - a.updatedAt)[0];
          return {
            date,
            rows: [
              {
                key: `${date}:${subject.key}`,
                lessons,
                entry,
              },
            ],
          };
        })
        .filter((bucket) => bucket.rows[0]?.lessons.length)
        .sort((a, b) => {
          if (a.date === todayIso) {
            return -1;
          }
          if (b.date === todayIso) {
            return 1;
          }
          return b.date.localeCompare(a.date);
        });

      return {
        key: subject.key,
        subject: subject.subject,
        teacher: subject.teacher,
        todayStart: subject.todayStart,
        dateBuckets,
      };
    })
    .filter((group) => {
      if (group.dateBuckets.length === 0) {
        return false;
      }
      const sample = group.dateBuckets[0]?.rows[0]?.lessons[0];
      return !sample || subjectMatchesQuery(sample, query);
    })
    .sort((a, b) => {
      if (a.todayStart && b.todayStart) {
        return a.todayStart.localeCompare(b.todayStart);
      }
      if (a.todayStart) {
        return -1;
      }
      if (b.todayStart) {
        return 1;
      }
      return a.subject.localeCompare(b.subject, 'ru');
    });
}
