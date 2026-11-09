import type { Lesson } from '@/features/schedule/data/schedule-11701126';

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

export function dedupeHomeworkEntriesBySubject(
  items: HomeworkEntry[],
  resolveLesson: (lessonId: string) => Lesson | undefined,
): { lessons: Lesson[]; entry?: HomeworkEntry; date: string; key: string }[] {
  const map = new Map<string, { lessons: Lesson[]; entries: HomeworkEntry[]; date: string }>();

  for (const item of items) {
    const lesson = resolveLesson(item.lessonId);
    if (!lesson) {
      continue;
    }
    const key = `${item.date}:${lessonSubjectKey(lesson)}`;
    const bucket = map.get(key) ?? { lessons: [], entries: [], date: item.date };
    bucket.lessons.push(lesson);
    bucket.entries.push(item);
    map.set(key, bucket);
  }

  return [...map.entries()]
    .map(([key, bucket]) => {
      const lessons = [...bucket.lessons].sort((a, b) => a.start.localeCompare(b.start));
      const entry = [...bucket.entries].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      return { key, lessons, entry, date: bucket.date };
    })
    .sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return a.lessons[0]!.start.localeCompare(b.lessons[0]!.start);
    });
}
