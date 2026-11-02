import {
  GROUP_ID,
  LESSONS,
  WEEK_I_MONDAY,
  type Lesson,
  type WeekParity,
  type Weekday,
} from '@/data/schedule-11701126';

export type { Lesson, WeekParity, Weekday };

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
  7: 'Воскресенье',
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
  7: 'Вс',
};

export const LESSON_TYPE_LABELS: Record<Lesson['type'], string> = {
  lecture: 'Лекция',
  practice: 'Практика',
  lab: 'Лабораторная',
  pe: 'Физкультура',
};

export const STUDY_WEEKDAYS: Exclude<Weekday, 7>[] = [1, 2, 3, 4, 5, 6];

export type NowStatus =
  | { kind: 'now'; lesson: Lesson }
  | { kind: 'break'; next: Lesson }
  | { kind: 'upcoming'; next: Lesson }
  | { kind: 'done' }
  | { kind: 'empty' };

export type WidgetLesson = {
  start: string;
  end: string;
  title: string;
  place: string;
};

export type ScheduleWidgetProps = {
  weekLabel: string;
  todayLabel: string;
  tomorrowLabel: string;
  today: WidgetLesson[];
  tomorrow: WidgetLesson[];
  updatedAt: number;
};

export function getWeekday(date: Date): Weekday {
  const jsDay = date.getDay();
  return (jsDay === 0 ? 7 : jsDay) as Weekday;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

export function getWeekParity(date: Date): WeekParity {
  const [year, month, day] = WEEK_I_MONDAY.split('-').map(Number);
  const anchor = startOfDay(new Date(year, month - 1, day));
  const monday = startOfWeekMonday(date);
  const diffDays = Math.round((monday.getTime() - anchor.getTime()) / 86_400_000);
  const weeks = Math.floor(diffDays / 7);
  return mod(weeks, 2) === 0 ? 1 : 2;
}

export function weekParityLabel(parity: WeekParity): string {
  return parity === 1 ? 'I неделя' : 'II неделя';
}

export function minutesFromMidnight(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function currentMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function isLessonOnDate(lesson: Lesson, date: Date): boolean {
  if (lesson.weekday !== getWeekday(date)) {
    return false;
  }
  if (lesson.dates && !lesson.dates.includes(toIsoDate(date))) {
    return false;
  }
  if (lesson.weeks !== 'always' && lesson.weeks !== getWeekParity(date)) {
    return false;
  }
  return true;
}

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export function dateForWeekday(today: Date, weekday: Exclude<Weekday, 7>): Date {
  const todayWeekday = getWeekday(today);
  if (todayWeekday === 7) {
    return addDays(today, weekday);
  }
  return addDays(today, weekday - todayWeekday);
}

export function describeNowStatus(
  status: NowStatus,
  weekday: Weekday
): { title: string; detail: string } {
  if (status.kind === 'now') {
    return {
      title: 'Сейчас',
      detail: `${status.lesson.start}–${status.lesson.end} · ${status.lesson.subject}`,
    };
  }
  if (status.kind === 'upcoming') {
    return {
      title: 'Скоро',
      detail: `${status.next.start} · ${status.next.subject}`,
    };
  }
  if (status.kind === 'break') {
    return {
      title: 'Перемена',
      detail: `Дальше ${status.next.start} · ${status.next.subject}`,
    };
  }
  if (status.kind === 'done') {
    return {
      title: 'Пары закончились',
      detail: 'Сегодня занятий больше нет',
    };
  }
  return {
    title: 'Сейчас пар нет',
    detail: weekday === 7 ? 'Воскресенье — выходной' : 'Сегодня занятий нет',
  };
}

export function getLessonsForDate(date: Date): Lesson[] {
  return LESSONS.filter((lesson) => isLessonOnDate(lesson, date)).sort((a, b) => {
    const timeDiff = minutesFromMidnight(a.start) - minutesFromMidnight(b.start);
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return (a.subgroup ?? 0) - (b.subgroup ?? 0);
  });
}

export function getNowStatus(lessons: Lesson[], now: Date): NowStatus {
  if (lessons.length === 0) {
    return { kind: 'empty' };
  }

  const nowMinutes = currentMinutes(now);
  const current = lessons.find(
    (lesson) =>
      minutesFromMidnight(lesson.start) <= nowMinutes &&
      nowMinutes < minutesFromMidnight(lesson.end)
  );
  if (current) {
    return { kind: 'now', lesson: current };
  }

  const next = lessons.find((lesson) => minutesFromMidnight(lesson.start) > nowMinutes);
  if (!next) {
    return { kind: 'done' };
  }

  const firstStart = minutesFromMidnight(lessons[0].start);
  if (nowMinutes < firstStart) {
    return { kind: 'upcoming', next };
  }

  return { kind: 'break', next };
}

export function formatPlace(lesson: Pick<Lesson, 'room' | 'building'>): string {
  if (lesson.room) {
    return `ауд. ${lesson.room} к. ${lesson.building}`;
  }
  return `к. ${lesson.building}`;
}

export function formatLessonTitle(lesson: Lesson): string {
  const type = LESSON_TYPE_LABELS[lesson.type];
  if (lesson.type === 'pe') {
    return lesson.subject;
  }
  return `${lesson.subject} · ${type}`;
}

export function toWidgetLesson(lesson: Lesson): WidgetLesson {
  return {
    start: lesson.start,
    end: lesson.end,
    title: formatLessonTitle(lesson),
    place: formatPlace(lesson),
  };
}

export function buildWidgetProps(now = new Date()): ScheduleWidgetProps {
  const tomorrow = addDays(now, 1);
  const todayLessons = getLessonsForDate(now);
  const tomorrowLessons = getLessonsForDate(tomorrow);

  return {
    weekLabel: `${GROUP_ID} · ${weekParityLabel(getWeekParity(now))}`,
    todayLabel: `${WEEKDAY_SHORT[getWeekday(now)]}, ${formatDate(now)}`,
    tomorrowLabel: `Завтра · ${WEEKDAY_SHORT[getWeekday(tomorrow)]}`,
    today: todayLessons.map(toWidgetLesson),
    tomorrow: tomorrowLessons.map(toWidgetLesson),
    updatedAt: now.getTime(),
  };
}

function startOfWeekMonday(date: Date): Date {
  const weekday = getWeekday(date);
  return addDays(date, 1 - weekday);
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
