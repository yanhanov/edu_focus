import AsyncStorage from '@react-native-async-storage/async-storage';

import { BUNDLED_PUBLIC_HOLIDAYS_BY } from '@/features/calendar/data/public-holidays-by';
import type { HolidayRegion } from '@/features/profile/lib/profile';

export type PublicHoliday = {
  date: string;
  localName: string;
};

type StoredPayload = {
  byDate: Record<string, string>;
  updatedAt: string;
};

const STORAGE_KEY = 'edu-focus.public-holidays.v1';
const NAGER_API = 'https://date.nager.at/api/v3/PublicHolidays';

const listeners = new Set<() => void>();
let activeRegion: HolidayRegion = 'BY';
let byDate: Record<string, string> = {};

const REGION_COUNTRY: Record<Exclude<HolidayRegion, 'none'>, string> = {
  BY: 'BY',
};

export function subscribePublicHolidays(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

function mergeBundled(region: HolidayRegion): Record<string, string> {
  if (region === 'none') {
    return {};
  }
  if (region === 'BY') {
    return { ...BUNDLED_PUBLIC_HOLIDAYS_BY };
  }
  return {};
}

async function loadStored(region: HolidayRegion): Promise<Record<string, string>> {
  if (region === 'none') {
    return {};
  }
  const raw = await AsyncStorage.getItem(`${STORAGE_KEY}.${region}`);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as StoredPayload;
    return parsed.byDate ?? {};
  } catch {
    return {};
  }
}

async function saveStored(region: HolidayRegion, next: Record<string, string>) {
  if (region === 'none') {
    return;
  }
  const payload: StoredPayload = { byDate: next, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(`${STORAGE_KEY}.${region}`, JSON.stringify(payload));
}

type NagerHoliday = {
  date: string;
  localName: string;
};

async function fetchYear(countryCode: string, year: number): Promise<Record<string, string>> {
  const response = await fetch(`${NAGER_API}/${year}/${countryCode}`);
  if (!response.ok) {
    return {};
  }
  const items = (await response.json()) as NagerHoliday[];
  const map: Record<string, string> = {};
  for (const item of items) {
    if (typeof item.date === 'string' && typeof item.localName === 'string') {
      map[item.date] = item.localName;
    }
  }
  return map;
}

async function refreshFromNetwork(region: Exclude<HolidayRegion, 'none'>) {
  const countryCode = REGION_COUNTRY[region];
  const year = new Date().getFullYear();
  const years = [year - 1, year, year + 1];
  let fetched: Record<string, string> = {};
  for (const y of years) {
    const chunk = await fetchYear(countryCode, y);
    fetched = { ...fetched, ...chunk };
  }
  if (Object.keys(fetched).length === 0) {
    return;
  }
  byDate = { ...byDate, ...fetched };
  await saveStored(region, byDate);
  notify();
}

export async function syncPublicHolidays(region: HolidayRegion): Promise<void> {
  activeRegion = region;
  if (region === 'none') {
    byDate = {};
    notify();
    return;
  }
  const bundled = mergeBundled(region);
  const stored = await loadStored(region);
  byDate = { ...bundled, ...stored };
  notify();
  void refreshFromNetwork(region).catch(() => undefined);
}

export function getActiveHolidayRegion(): HolidayRegion {
  return activeRegion;
}

export function getPublicHoliday(iso: string): PublicHoliday | undefined {
  if (activeRegion === 'none') {
    return undefined;
  }
  const localName = byDate[iso];
  if (!localName) {
    return undefined;
  }
  return { date: iso, localName };
}

export function isPublicHolidayDate(iso: string): boolean {
  return activeRegion !== 'none' && Boolean(byDate[iso]);
}
