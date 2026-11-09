import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GroupId } from '@/features/schedule/data/groups';
import type { Lesson, LessonType } from '@/features/schedule/data/schedule-11701126';

const STORAGE_KEY = 'edu-focus.extra-activities.v1';

type Store = Partial<Record<GroupId, Lesson[]>>;

const cache: Store = {};
const listeners = new Set<() => void>();

export const EXTRA_ACTIVITY_TYPES = ['meeting', 'event', 'exam', 'credit'] as const;

export type ExtraActivityType = (typeof EXTRA_ACTIVITY_TYPES)[number];

export function isExtraActivityType(type: LessonType): type is ExtraActivityType {
  return EXTRA_ACTIVITY_TYPES.includes(type as ExtraActivityType);
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeExtraActivities(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCachedExtraActivities(groupId: GroupId): Lesson[] {
  return cache[groupId] ? [...cache[groupId]!] : [];
}

export async function loadExtraActivities(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw) as Store;
    for (const key of Object.keys(parsed) as GroupId[]) {
      const list = parsed[key];
      if (Array.isArray(list)) {
        cache[key] = list.filter(isValidExtraLesson);
      }
    }
  } catch {
    // ignore corrupt storage
  }
}

function isValidExtraLesson(item: unknown): item is Lesson {
  if (!item || typeof item !== 'object') {
    return false;
  }
  const lesson = item as Partial<Lesson>;
  return (
    typeof lesson.id === 'string' &&
    typeof lesson.weekday === 'number' &&
    typeof lesson.start === 'string' &&
    typeof lesson.end === 'string' &&
    typeof lesson.subject === 'string' &&
    isExtraActivityType(lesson.type as LessonType) &&
    typeof lesson.teacher === 'string' &&
    typeof lesson.room === 'string' &&
    typeof lesson.building === 'string' &&
    (lesson.weeks === 'always' || lesson.weeks === 1 || lesson.weeks === 2)
  );
}

async function persistStore(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  notify();
}

export async function addExtraActivity(groupId: GroupId, lesson: Lesson): Promise<void> {
  if (!isExtraActivityType(lesson.type)) {
    return;
  }
  const current = getCachedExtraActivities(groupId);
  cache[groupId] = [...current, lesson];
  await persistStore();
}

export async function removeExtraActivity(groupId: GroupId, lessonId: string): Promise<void> {
  const current = getCachedExtraActivities(groupId);
  cache[groupId] = current.filter((lesson) => lesson.id !== lessonId);
  await persistStore();
}
