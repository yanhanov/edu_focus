import type { GroupId } from '@/data/groups';
import type { Lesson } from '@/data/schedule-11701126';
import { parseScheduleBundle, type ScheduleOverride } from '@/lib/schedule-overrides';

const TIME_PAIR =
  /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}[.:]\d{2})|(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g;

const TYPE_MAP: Record<string, Lesson['type']> = {
  'лекционное занятие': 'lecture',
  'практическое занятие': 'practice',
  'лабораторное занятие': 'lab',
  'физическая культура': 'pe',
};

function normalizeEndTime(value: string): string {
  return value.replace('.', ':');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function parseLessonBlock(block: string, weekday: Lesson['weekday'], index: number): Lesson | null {
  const compact = block.replace(/\s+/g, ' ').trim();
  if (compact.length < 12) {
    return null;
  }

  let weeks: Lesson['weeks'] = 'always';
  let dates: string[] | undefined;
  let subgroup: 1 | 2 | undefined;

  const weekMatch = compact.match(/^(I|II)\s+нед\.(?:\s+([\d.,\s]+))?\s*/i);
  let rest = compact;
  if (weekMatch) {
    weeks = weekMatch[1].toUpperCase() === 'I' ? 1 : 2;
    if (weekMatch[2]) {
      dates = weekMatch[2]
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
    rest = compact.slice(weekMatch[0].length).trim();
  }

  const subgroupMatch = rest.match(/(?:^|\s)([12])\s*п\/г(?:\.|\s|$)/i);
  if (subgroupMatch) {
    subgroup = subgroupMatch[1] === '1' ? 1 : 2;
    rest = rest.replace(subgroupMatch[0], ' ').trim();
  }

  const typeMatch = rest.match(/\(([^)]+)\)/);
  const typeLabel = typeMatch?.[1]?.toLowerCase() ?? '';
  const type = TYPE_MAP[typeLabel] ?? (typeLabel.includes('лек') ? 'lecture' : typeLabel.includes('лаб') ? 'lab' : 'practice');

  const roomMatch = rest.match(/ауд\.?\s*([\wа-я]+(?:\s*к\.?\s*\d+)?)/i);
  const buildingMatch = rest.match(/к\.?\s*(\d+[а-я]?)/i);
  const teacherMatch = rest.match(
    /\)\s*([А-ЯЁ][а-яё]+(?:\s+[А-Я]\.[А-Я]\.?)?(?:,\s*[А-ЯЁ][а-яё]+(?:\s+[А-Я]\.[А-Я]\.?)?)*)\s*(?:ауд|$)/i
  );

  const subject = rest
    .replace(/\(.*?\)/, '')
    .replace(/ауд\.?.*/i, '')
    .replace(/к\.\s*\d+.*/i, '')
    .replace(teacherMatch?.[0] ?? '', '')
    .trim();

  if (!subject) {
    return null;
  }

  const timeMatch = TIME_PAIR.exec(block);
  TIME_PAIR.lastIndex = 0;
  if (!timeMatch) {
    return null;
  }
  const start = timeMatch[1] ?? timeMatch[3];
  const end = normalizeEndTime(timeMatch[2] ?? timeMatch[4] ?? '');

  return {
    id: `${weekday}-${start}-${slugify(subject)}-${index}`,
    weekday,
    start,
    end,
    subject,
    type: subject.toLowerCase().includes('физическая культура') ? 'pe' : type,
    teacher: teacherMatch?.[1]?.trim() ?? '',
    room: roomMatch?.[1]?.replace(/\s*к\.\s*\d+.*/i, '').trim() ?? '',
    building: buildingMatch?.[1] ?? '',
    weeks,
    dates,
    subgroup,
  };
}

/**
 * Best-effort parser for text-layer PDF exports.
 * Official BNTU scan PDFs usually need JSON from scripts/parse_bntu_schedule.py.
 */
export function parseLessonsFromPdfText(text: string, groupId: GroupId): Lesson[] {
  void groupId;
  const weekdayNames: { label: string; weekday: Lesson['weekday'] }[] = [
    { label: 'Понедельник', weekday: 1 },
    { label: 'Вторник', weekday: 2 },
    { label: 'Среда', weekday: 3 },
    { label: 'Четверг', weekday: 4 },
    { label: 'Пятница', weekday: 5 },
    { label: 'Суббота', weekday: 6 },
  ];

  const lower = text.toLowerCase();
  const sections: { weekday: Lesson['weekday']; body: string }[] = [];
  for (let i = 0; i < weekdayNames.length; i += 1) {
    const current = weekdayNames[i];
    const next = weekdayNames[i + 1];
    const start = lower.indexOf(current.label.toLowerCase());
    if (start < 0) {
      continue;
    }
    const end = next ? lower.indexOf(next.label.toLowerCase(), start + 1) : text.length;
    sections.push({
      weekday: current.weekday,
      body: text.slice(start, end > start ? end : text.length),
    });
  }

  const lessons: Lesson[] = [];
  if (sections.length === 0) {
    return lessons;
  }

  sections.forEach((section) => {
    const parts = section.body.split(TIME_PAIR);
    for (let i = 1; i < parts.length; i += 2) {
      const timeChunk = `${parts[i]}-${parts[i + 1] ?? ''} ${parts[i + 2] ?? ''}`;
      const lesson = parseLessonBlock(timeChunk, section.weekday, lessons.length);
      if (lesson) {
        lessons.push(lesson);
      }
    }
  });

  return lessons;
}

export function buildOverrideFromJsonText(
  jsonText: string,
  groupId: GroupId,
  meta?: Partial<ScheduleOverride>
): ScheduleOverride {
  const raw = JSON.parse(jsonText) as unknown;
  const bundle =
    parseScheduleBundle(raw) ??
    parseScheduleBundle({ ...(raw as object), groupId, lessons: (raw as { lessons?: unknown[] }).lessons });
  if (!bundle) {
    throw new Error('Неверный формат JSON расписания');
  }
  if (bundle.groupId !== groupId) {
    throw new Error(`Файл для группы ${bundle.groupId}, а выбрана ${groupId}`);
  }
  return {
    ...bundle,
    ...meta,
    groupId,
    sourceKind: 'import',
    importedAt: new Date().toISOString(),
  };
}

export function buildOverrideFromPdfText(
  text: string,
  groupId: GroupId,
  meta: Partial<ScheduleOverride>
): ScheduleOverride {
  const lessons = parseLessonsFromPdfText(text, groupId);
  if (lessons.length < 8) {
    throw new Error(
      'Не удалось разобрать PDF автоматически (часто это скан). Импортируйте JSON или используйте scripts/parse_bntu_schedule.py на компьютере.'
    );
  }
  return {
    groupId,
    lessons,
    period: meta.period ?? '',
    title: meta.title ?? '',
    weekIMonday: meta.weekIMonday ?? '2026-10-12',
    sourceKind: 'import',
    sourceUrl: meta.sourceUrl,
    sourceLabel: meta.sourceLabel,
    importedAt: new Date().toISOString(),
  };
}
