import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform } from 'react-native';

import { DEFAULT_GROUP_ID, isGroupId, type GroupId } from '@/data/groups';

export type ThemePreference = 'light' | 'dark' | 'system';
export type SubgroupPreference = 1 | 2 | null;

export type Profile = {
  groupId: GroupId;
  subgroup: SubgroupPreference;
  theme: ThemePreference;
};

export const DEFAULT_PROFILE: Profile = {
  groupId: DEFAULT_GROUP_ID,
  subgroup: null,
  theme: 'system',
};

const STORAGE_KEY = 'edu-focus.profile.v1';

let cached: Profile = DEFAULT_PROFILE;

export function getCachedProfile(): Profile {
  return cached;
}

export function resolveColorScheme(
  preference: ThemePreference,
  system: 'light' | 'dark' | null | undefined
): 'light' | 'dark' {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return system === 'dark' ? 'dark' : 'light';
}

export function applyThemePreference(theme: ThemePreference) {
  if (Platform.OS === 'web') {
    return;
  }
  const setScheme = Appearance.setColorScheme;
  if (typeof setScheme === 'function') {
    setScheme(theme === 'system' ? 'auto' : theme);
  }
}

function parseProfile(value: unknown): Profile {
  if (!value || typeof value !== 'object') {
    return DEFAULT_PROFILE;
  }
  const raw = value as Partial<Profile>;
  return {
    groupId: typeof raw.groupId === 'string' && isGroupId(raw.groupId) ? raw.groupId : DEFAULT_PROFILE.groupId,
    subgroup: raw.subgroup === 1 || raw.subgroup === 2 ? raw.subgroup : null,
    theme: raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system' ? raw.theme : 'system',
  };
}

export async function loadProfile(): Promise<Profile> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) {
    cached = DEFAULT_PROFILE;
    applyThemePreference(cached.theme);
    return cached;
  }
  try {
    cached = parseProfile(JSON.parse(stored) as unknown);
  } catch {
    cached = DEFAULT_PROFILE;
  }
  applyThemePreference(cached.theme);
  return cached;
}

export async function saveProfile(next: Profile): Promise<void> {
  cached = next;
  applyThemePreference(next.theme);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
