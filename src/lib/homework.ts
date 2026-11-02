import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

export type HomeworkPhoto = {
  id: string;
  uri: string;
};

export type HomeworkLink = {
  id: string;
  url: string;
};

export type HomeworkEntry = {
  lessonId: string;
  date: string;
  text: string;
  photos: HomeworkPhoto[];
  links: HomeworkLink[];
  /** Выполнено — напоминания не планируются */
  done?: boolean;
  updatedAt: number;
};

export type HomeworkCompletionStatus = 'none' | 'todo' | 'done';

export type HomeworkMap = Record<string, HomeworkEntry>;

const STORAGE_KEY = 'edu-focus.homework.v1';

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function homeworkKey(date: string, lessonId: string): string {
  return `${date}:${lessonId}`;
}

export function listHomeworkEntries(map: HomeworkMap): HomeworkEntry[] {
  return Object.values(map).sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.updatedAt - a.updatedAt;
  });
}

export function createItemId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function subscribeHomework(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isHomeworkContentEmpty(entry: HomeworkEntry | undefined): boolean {
  if (!entry) {
    return true;
  }
  return entry.text.trim().length === 0 && entry.photos.length === 0 && entry.links.length === 0;
}

export function normalizeHomeworkEntry(entry: HomeworkEntry): HomeworkEntry {
  return { ...entry, done: entry.done ?? false };
}

export function homeworkCompletionStatus(entry: HomeworkEntry | undefined): HomeworkCompletionStatus {
  if (!entry) {
    return 'none';
  }
  const normalized = normalizeHomeworkEntry(entry);
  if (normalized.done) {
    return 'done';
  }
  if (!isHomeworkContentEmpty(normalized)) {
    return 'todo';
  }
  return 'none';
}

/** Нет записи в хранилище — удалить ключ */
export function isHomeworkEmpty(entry: HomeworkEntry | undefined): boolean {
  return homeworkCompletionStatus(entry) === 'none';
}

export function normalizeHomeworkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function loadHomeworkMap(): Promise<HomeworkMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as HomeworkMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function getHomework(date: string, lessonId: string): Promise<HomeworkEntry> {
  const map = await loadHomeworkMap();
  return (
    normalizeHomeworkEntry(
      map[homeworkKey(date, lessonId)] ?? {
        lessonId,
        date,
        text: '',
        photos: [],
        links: [],
        done: false,
        updatedAt: Date.now(),
      },
    )
  );
}

export async function setHomeworkDone(
  date: string,
  lessonId: string,
  done: boolean,
): Promise<void> {
  const entry = await getHomework(date, lessonId);
  await saveHomework({ ...entry, done });
}

export async function saveHomework(entry: HomeworkEntry): Promise<void> {
  const map = await loadHomeworkMap();
  const key = homeworkKey(entry.date, entry.lessonId);
  const next = normalizeHomeworkEntry({ ...entry, updatedAt: Date.now() });
  if (isHomeworkEmpty(next)) {
    delete map[key];
  } else {
    map[key] = next;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  notify();
}

export async function persistHomeworkPhoto(sourceUri: string): Promise<HomeworkPhoto> {
  const id = createItemId();
  try {
    const dir = new Directory(Paths.document, 'homework');
    if (!dir.exists) {
      dir.create({ idempotent: true, intermediates: true });
    }
    const extension = sourceUri.split('?')[0].split('.').pop() || 'jpg';
    const destination = new File(dir, `${id}.${extension}`);
    await new File(sourceUri).copy(destination);
    return { id, uri: destination.uri };
  } catch {
    return { id, uri: sourceUri };
  }
}

export async function deleteHomeworkPhotoFile(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Ignore missing files or web platform limits.
  }
}
