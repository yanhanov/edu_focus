import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GroupId } from '@/features/schedule/data/groups';
import {
  LESSONS as BUNDLED_LESSONS,
  SCHEDULE_PERIOD as BUNDLED_PERIOD,
  SCHEDULE_TITLE as BUNDLED_TITLE,
  WEEK_I_MONDAY as BUNDLED_WEEK_I_MONDAY,
  type Lesson,
} from '@/features/schedule/data/schedule-11701126';

export type ScheduleSourceKind = 'bundled' | 'import';

export type ScheduleOverride = {
  groupId: GroupId;
  lessons: Lesson[];
  period: string;
  title: string;
  weekIMonday: string;
  sourceKind: ScheduleSourceKind;
  sourceUrl?: string;
  sourceLabel?: string;
  importedAt: string;
};

type Listener = () => void;

const STORAGE_PREFIX = 'edu-focus.schedule.v1.';
const GROUP_IDS: GroupId[] = ['11701126', '11701226', '11704126'];
const listeners = new Set<Listener>();
const cache = new Map<GroupId, ScheduleOverride | null>();

export function subscribeSchedule(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

function storageKey(groupId: GroupId) {
  return `${STORAGE_PREFIX}${groupId}`;
}

function isGroupId(value: string): value is GroupId {
  return GROUP_IDS.includes(value as GroupId);
}

function parseLesson(raw: unknown): Lesson | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const item = raw as Partial<Lesson>;
  if (
    typeof item.id !== 'string' ||
    typeof item.weekday !== 'number' ||
    typeof item.start !== 'string' ||
    typeof item.end !== 'string' ||
    typeof item.subject !== 'string' ||
    typeof item.type !== 'string' ||
    typeof item.teacher !== 'string' ||
    typeof item.room !== 'string' ||
    typeof item.building !== 'string'
  ) {
    return null;
  }
  const weeks = item.weeks;
  if (weeks !== 'always' && weeks !== 1 && weeks !== 2) {
    return null;
  }
  return {
    id: item.id,
    weekday: item.weekday as Lesson['weekday'],
    start: item.start,
    end: item.end,
    subject: item.subject,
    type: item.type as Lesson['type'],
    teacher: item.teacher,
    room: item.room,
    building: item.building,
    weeks,
    dates: Array.isArray(item.dates) ? item.dates.filter((d): d is string => typeof d === 'string') : undefined,
    subgroup: item.subgroup === 1 || item.subgroup === 2 ? item.subgroup : undefined,
  };
}

export function parseScheduleBundle(raw: unknown): ScheduleOverride | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const data = raw as Partial<ScheduleOverride & { lessons: unknown[] }>;
  if (typeof data.groupId !== 'string' || !isGroupId(data.groupId) || !Array.isArray(data.lessons)) {
    return null;
  }
  const lessons = data.lessons.map(parseLesson).filter((lesson): lesson is Lesson => lesson !== null);
  if (lessons.length === 0) {
    return null;
  }
  return {
    groupId: data.groupId,
    lessons,
    period: typeof data.period === 'string' ? data.period : BUNDLED_PERIOD,
    title: typeof data.title === 'string' ? data.title : BUNDLED_TITLE,
    weekIMonday: typeof data.weekIMonday === 'string' ? data.weekIMonday : BUNDLED_WEEK_I_MONDAY,
    sourceKind: data.sourceKind === 'import' ? 'import' : 'import',
    sourceUrl: typeof data.sourceUrl === 'string' ? data.sourceUrl : undefined,
    sourceLabel: typeof data.sourceLabel === 'string' ? data.sourceLabel : undefined,
    importedAt: typeof data.importedAt === 'string' ? data.importedAt : new Date().toISOString(),
  };
}

export function getBundledOverride(groupId: GroupId): ScheduleOverride | null {
  if (groupId !== '11701126') {
    return null;
  }
  return {
    groupId,
    lessons: [...BUNDLED_LESSONS],
    period: BUNDLED_PERIOD,
    title: BUNDLED_TITLE,
    weekIMonday: BUNDLED_WEEK_I_MONDAY,
    sourceKind: 'bundled',
    importedAt: '',
  };
}

export function getCachedScheduleOverride(groupId: GroupId): ScheduleOverride | null {
  if (!cache.has(groupId)) {
    return null;
  }
  return cache.get(groupId) ?? null;
}

export async function loadScheduleOverride(groupId: GroupId): Promise<ScheduleOverride | null> {
  const stored = await AsyncStorage.getItem(storageKey(groupId));
  if (!stored) {
    cache.set(groupId, null);
    return null;
  }
  try {
    const parsed = parseScheduleBundle(JSON.parse(stored) as unknown);
    cache.set(groupId, parsed);
    return parsed;
  } catch {
    cache.set(groupId, null);
    return null;
  }
}

export async function saveScheduleOverride(override: ScheduleOverride): Promise<void> {
  cache.set(override.groupId, override);
  await AsyncStorage.setItem(storageKey(override.groupId), JSON.stringify(override));
  notify();
}

export async function clearScheduleOverride(groupId: GroupId): Promise<void> {
  cache.set(groupId, null);
  await AsyncStorage.removeItem(storageKey(groupId));
  notify();
}

export async function loadAllScheduleOverrides(): Promise<void> {
  await Promise.all(GROUP_IDS.map((groupId) => loadScheduleOverride(groupId)));
}

export function getEffectiveSchedule(groupId: GroupId): ScheduleOverride {
  const override = getCachedScheduleOverride(groupId);
  if (override) {
    return override;
  }
  const bundled = getBundledOverride(groupId);
  if (bundled) {
    return bundled;
  }
  return {
    groupId,
    lessons: [],
    period: '',
    title: '',
    weekIMonday: BUNDLED_WEEK_I_MONDAY,
    sourceKind: 'bundled',
    importedAt: '',
  };
}

export function buildScheduleExport(groupId: GroupId): ScheduleOverride {
  const effective = getEffectiveSchedule(groupId);
  return {
    ...effective,
    importedAt: effective.importedAt || new Date().toISOString(),
  };
}
