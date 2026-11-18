import { Platform } from 'react-native';
import {
  AndroidImportance,
  AndroidNotificationVisibility,
} from 'expo-notifications/build/NotificationChannelManager.types';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { dismissNotificationAsync } from 'expo-notifications/build/dismissNotificationAsync';
import { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
import { getPresentedNotificationsAsync } from 'expo-notifications/build/getPresentedNotificationsAsync';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';

import { getGroup } from '@/features/schedule/data/groups';
import {
  findNextSubjectLesson,
  lessonSubjectKey,
} from '@/features/homework/lib/homework-subject';
import {
  homeworkCompletionStatus,
  isHomeworkContentEmpty,
  loadHomeworkMap,
} from '@/features/homework/lib/homework';
import {
  formatReminderTime,
  REMINDER_TIME_PRESETS,
  reminderTimeOptions,
} from '@/features/notifications/lib/notifications-config';
import { getCachedProfile, type NotificationSettings, type Profile } from '@/features/profile/lib/profile';
import {
  addDays,
  formatPlace,
  getLessonById,
  getLessonsForDate,
  getNowStatus,
  startOfDay,
  toIsoDate,
  type Lesson,
  type NowStatus,
} from '@/features/schedule/lib/schedule';

export { REMINDER_TIME_PRESETS, formatReminderTime, reminderTimeOptions };

const HOMEWORK_REMINDER_PREFIX = 'homework-reminder:';
const LESSON_LIVE_PREFIX = 'lesson-live:';
const LESSON_LIVE_ACTIVE_ID = 'lesson-live:active';
const ANDROID_HOMEWORK_CHANNEL = 'homework';
const ANDROID_LESSON_CHANNEL = 'lessons';
const ACCENT = '#1B6B4A';

type NotificationData = {
  kind?: string;
  silent?: string;
};

export function configureNotifications() {
  setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as NotificationData | undefined;
      const silent = data?.silent === '1';
      return {
        shouldPlaySound: !silent,
        shouldSetBadge: false,
        shouldShowBanner: !silent,
        shouldShowList: true,
      };
    },
  });
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const current = await getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const requested = await requestPermissionsAsync();
  return requested.granted ?? false;
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function reminderDateForLesson(lessonDateIso: string, settings: NotificationSettings): Date {
  const reminder = startOfDay(addDays(parseIsoDate(lessonDateIso), -1));
  reminder.setHours(settings.hour, settings.minute, 0, 0);
  return reminder;
}

function homeworkPreview(entry: { text: string; photos: unknown[]; links: unknown[] }): string {
  const text = entry.text.trim();
  if (text) {
    return text.length > 80 ? `${text.slice(0, 77)}…` : text;
  }
  if (entry.photos.length > 0) {
    return `фото: ${entry.photos.length}`;
  }
  if (entry.links.length > 0) {
    return `ссылки: ${entry.links.length}`;
  }
  return '';
}

async function cancelByPrefix(prefix: string) {
  const scheduled = await getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith(prefix))
      .map((item) => cancelScheduledNotificationAsync(item.identifier)),
  );
}

async function dismissByPrefix(prefix: string) {
  const presented = await getPresentedNotificationsAsync();
  await Promise.all(
    presented
      .filter((item) => item.request.identifier.startsWith(prefix))
      .map((item) => dismissNotificationAsync(item.request.identifier)),
  );
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') {
    return;
  }
  await setNotificationChannelAsync(ANDROID_HOMEWORK_CHANNEL, {
    name: 'Домашние задания',
    importance: AndroidImportance.DEFAULT,
  });
  await setNotificationChannelAsync(ANDROID_LESSON_CHANNEL, {
    name: 'Пары',
    importance: AndroidImportance.HIGH,
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
  });
}

function androidChannel(channelId: string) {
  return Platform.OS === 'android' ? { channelId } : {};
}

export async function syncHomeworkReminders(profile: Profile = getCachedProfile()) {
  try {
    await cancelByPrefix(HOMEWORK_REMINDER_PREFIX);

    if (!profile.onboardingComplete || !profile.notifications.enabled) {
      return;
    }

    const permission = await getPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    await ensureAndroidChannels();

    const homeworkMap = await loadHomeworkMap();
    const lessons = getGroup(profile.groupId).lessons;
    const now = new Date();
    const todayIso = toIsoDate(now);
    const buckets = new Map<
      string,
      { targetIso: string; lesson: Lesson; previews: string[]; count: number }
    >();

    for (const entry of Object.values(homeworkMap)) {
      if (homeworkCompletionStatus(entry) !== 'todo') {
        continue;
      }
      if (isHomeworkContentEmpty(entry)) {
        continue;
      }
      const lesson = getLessonById(entry.lessonId, lessons);
      if (!lesson) {
        continue;
      }

      const target =
        entry.date > todayIso
          ? { iso: entry.date, lesson }
          : findNextSubjectLesson(entry.date, lesson, lessons, profile.subgroup);

      if (!target) {
        continue;
      }

      const triggerDate = reminderDateForLesson(target.iso, profile.notifications);
      if (triggerDate.getTime() <= now.getTime()) {
        continue;
      }

      const key = `${lessonSubjectKey(lesson)}:${target.iso}`;
      const bucket = buckets.get(key) ?? {
        targetIso: target.iso,
        lesson: target.lesson,
        previews: [],
        count: 0,
      };
      const preview = homeworkPreview(entry);
      if (preview) {
        bucket.previews.push(preview);
      }
      bucket.count += 1;
      buckets.set(key, bucket);
    }

    for (const [key, bucket] of buckets) {
      const triggerDate = reminderDateForLesson(bucket.targetIso, profile.notifications);
      const preview = bucket.previews[0] ?? '';
      const body =
        bucket.count > 1
          ? `Завтра ${bucket.lesson.start} · ${bucket.lesson.subject}: ${homeworkCountLabel(bucket.count)}`
          : preview
            ? `Завтра ${bucket.lesson.start} · ${bucket.lesson.subject}: ${preview}`
            : `Завтра ${bucket.lesson.start} · ${bucket.lesson.subject}`;

      await scheduleNotificationAsync({
        identifier: `${HOMEWORK_REMINDER_PREFIX}${key}`,
        content: {
          title: 'Напоминание о ДЗ',
          body,
          data: { kind: 'homework' },
          ...androidChannel(ANDROID_HOMEWORK_CHANNEL),
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          ...androidChannel(ANDROID_HOMEWORK_CHANNEL),
        },
      });
    }
  } catch (error) {
    console.warn('[notifications] syncHomeworkReminders skipped:', error);
  }
}

function homeworkCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} задание`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} задания`;
  }
  return `${count} заданий`;
}

function liveCopy(status: NowStatus): { title: string; subtitle: string; body: string } | null {
  if (status.kind === 'now') {
    const place = formatPlace(status.lesson);
    return {
      title: status.lesson.subject,
      subtitle: 'Сейчас',
      body: place
        ? `${status.lesson.start}–${status.lesson.end} · ${place}`
        : `${status.lesson.start}–${status.lesson.end}`,
    };
  }
  if (status.kind === 'upcoming' || status.kind === 'break') {
    const place = formatPlace(status.next);
    return {
      title: status.next.subject,
      subtitle: status.kind === 'break' ? 'Перемена' : 'Скоро',
      body: place ? `${status.next.start} · ${place}` : status.next.start,
    };
  }
  return null;
}

let lastLiveKey = '';

async function presentActiveLesson(copy: { title: string; subtitle: string; body: string } | null) {
  const key = copy ? `${copy.subtitle}:${copy.title}:${copy.body}` : 'none';
  if (key === lastLiveKey) {
    return;
  }
  lastLiveKey = key;

  if (!copy) {
    await dismissNotificationAsync(LESSON_LIVE_ACTIVE_ID).catch(() => undefined);
    return;
  }

  await scheduleNotificationAsync({
    identifier: LESSON_LIVE_ACTIVE_ID,
    content: {
      title: copy.title,
      subtitle: copy.subtitle,
      body: copy.body,
      sound: false,
      sticky: true,
      autoDismiss: false,
      color: ACCENT,
      data: { kind: 'lesson-live', silent: '1' },
      ...androidChannel(ANDROID_LESSON_CHANNEL),
    },
    trigger: Platform.OS === 'android' ? { channelId: ANDROID_LESSON_CHANNEL } : null,
  });
}

export async function syncLessonLiveNotifications(profile: Profile = getCachedProfile()) {
  try {
    await cancelByPrefix(LESSON_LIVE_PREFIX);

    if (!profile.onboardingComplete || !profile.notifications.enabled) {
      lastLiveKey = '';
      await dismissByPrefix(LESSON_LIVE_PREFIX);
      return;
    }

    const permission = await getPermissionsAsync();
    if (!permission.granted) {
      lastLiveKey = '';
      await dismissByPrefix(LESSON_LIVE_PREFIX);
      return;
    }

    await ensureAndroidChannels();

    const now = new Date();
    await dismissByPrefix(LESSON_LIVE_PREFIX);
    lastLiveKey = '';
    await refreshLessonLiveNotification(profile, now);
  } catch (error) {
    console.warn('[notifications] syncLessonLiveNotifications skipped:', error);
  }
}

export async function refreshLessonLiveNotification(
  profile: Profile = getCachedProfile(),
  now = new Date(),
) {
  if (!profile.onboardingComplete || !profile.notifications.enabled) {
    return;
  }
  const permission = await getPermissionsAsync();
  if (!permission.granted) {
    return;
  }
  const todayLessons = getLessonsForDate(
    now,
    getGroup(profile.groupId).lessons,
    profile.subgroup,
  );
  await presentActiveLesson(liveCopy(getNowStatus(todayLessons, now)));
}

export async function syncNotifications(profile: Profile = getCachedProfile()) {
  await syncHomeworkReminders(profile);
  await syncLessonLiveNotifications(profile);
}
