import type { GroupId } from '@/data/groups';

export const BNTU_MIDO_SCHEDULE_PAGE =
  'https://bntu.by/institutes/mido/pages/raspisanie-zanyatij-i-grafik-obrazovatelnogo-processa';

export type BntuScheduleLink = {
  url: string;
  label: string;
  updatedLabel?: string;
  period?: string;
};

const GROUP_LINK_PATTERNS: Record<GroupId, RegExp[]> = {
  '11701126': [/11701126/, /11701226.*11704126/],
  '11701226': [/11701126.*11701226/, /11701226/],
  '11704126': [/11704126/, /11701126.*11704126/],
};

function decodeHtml(text: string): string {
  return text
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPeriod(label: string): string | undefined {
  const match = label.match(/(\d{2}\.\d{2}\.\d{4}\s*—\s*\d{2}\.\d{2}\.\d{4}|\d{2}\.\d{2}\.\d{4}\s*по\s*\d{2}\.\d{2}\.\d{4})/i);
  return match?.[1]?.replace(/\s*по\s*/i, ' — ');
}

export function parseScheduleLinksFromHtml(html: string): BntuScheduleLink[] {
  const links: BntuScheduleLink[] = [];
  const anchorRe =
    /<a[^>]+href="(https:\/\/static\.bntu\.by[^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>\s*(?:<span[^>]*>\s*Обновлено\s*([\d.]+)\s*<\/span>)?/gi;

  let match: RegExpExecArray | null;
  while ((match = anchorRe.exec(html)) !== null) {
    const label = decodeHtml(match[2].replace(/<[^>]+>/g, ' '));
    if (!/расписание/i.test(label)) {
      continue;
    }
    links.push({
      url: match[1],
      label,
      updatedLabel: match[3]?.trim(),
      period: extractPeriod(label),
    });
  }

  return links;
}

export function findScheduleLinkForGroup(html: string, groupId: GroupId): BntuScheduleLink | null {
  const patterns = GROUP_LINK_PATTERNS[groupId];
  const links = parseScheduleLinksFromHtml(html);
  return (
    links.find((link) => patterns.some((pattern) => pattern.test(link.label))) ??
    links.find((link) => link.label.includes(groupId)) ??
    null
  );
}

export async function fetchBntuScheduleLink(groupId: GroupId): Promise<BntuScheduleLink | null> {
  const response = await fetch(BNTU_MIDO_SCHEDULE_PAGE, {
    headers: { Accept: 'text/html' },
  });
  if (!response.ok) {
    throw new Error(`Страница БНТУ недоступна (${response.status})`);
  }
  const html = await response.text();
  return findScheduleLinkForGroup(html, groupId);
}
