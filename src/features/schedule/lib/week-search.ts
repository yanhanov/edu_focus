import { subjectMatchesQuery } from '@/features/homework/lib/homework-subject';
import type { Lesson } from '@/features/schedule/data/schedule-11701126';
import type { SubgroupPreference } from '@/features/profile/lib/profile';
import {
  dateForWeekday,
  getLessonsForDate,
  STUDY_WEEKDAYS,
  toIsoDate,
  type Weekday,
} from '@/features/schedule/lib/schedule';

export type WeekDayLessons = {
  day: Exclude<Weekday, 7>;
  date: Date;
  dateIso: string;
  lessons: Lesson[];
};

export function getStudyWeekIsoDates(anchor: Date): string[] {
  return STUDY_WEEKDAYS.map((day) => toIsoDate(dateForWeekday(anchor, day)));
}

export function isIsoInStudyWeek(iso: string, anchor: Date): boolean {
  return getStudyWeekIsoDates(anchor).includes(iso);
}

export function getMatchingLessonsForWeek(
  anchor: Date,
  allLessons: readonly Lesson[],
  subgroup: SubgroupPreference,
  query: string,
): WeekDayLessons[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const hits: WeekDayLessons[] = [];
  for (const day of STUDY_WEEKDAYS) {
    const date = dateForWeekday(anchor, day);
    const lessons = getLessonsForDate(date, allLessons, subgroup).filter((lesson) =>
      subjectMatchesQuery(lesson, trimmed),
    );
    if (lessons.length > 0) {
      hits.push({ day, date, dateIso: toIsoDate(date), lessons });
    }
  }
  return hits;
}
