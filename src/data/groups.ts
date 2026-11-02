import { LESSONS, SCHEDULE_PERIOD, SCHEDULE_TITLE, type Lesson } from '@/data/schedule-11701126';

export type GroupId = '11701126' | '11701226' | '11704126';

export type Group = {
  id: GroupId;
  title: string;
  specialty: string;
  lessons: readonly Lesson[];
};

export const DEFAULT_GROUP_ID: GroupId = '11701126';

export const GROUPS: readonly Group[] = [
  {
    id: '11701126',
    title: '11701126',
    specialty: SCHEDULE_TITLE,
    lessons: LESSONS,
  },
  {
    id: '11701226',
    title: '11701226',
    specialty: SCHEDULE_TITLE,
    lessons: [],
  },
  {
    id: '11704126',
    title: '11704126',
    specialty: 'Экономика и управление',
    lessons: [],
  },
];

export { SCHEDULE_PERIOD };

export function isGroupId(value: string): value is GroupId {
  return GROUPS.some((group) => group.id === value);
}

export function getGroup(id: string): Group {
  return GROUPS.find((group) => group.id === id) ?? GROUPS[0];
}
