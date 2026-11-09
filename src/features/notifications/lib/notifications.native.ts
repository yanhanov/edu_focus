import { Platform } from 'react-native';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';

import { getGroup } from '@/features/schedule/data/groups';
import { homeworkCompletionStatus, isHomeworkContentEmpty, loadHomeworkMap } from '@/features/homework/lib/homework';
import {
  formatReminderTime,
  REMINDER_TIME_PRESETS,
  reminderTimeOptions,
} from '@/features/notifications/lib/notifications-config';
import { getCachedProfile, type NotificationSettings, type Profile } from '@/features/profile/lib/profile';
import { addDays, getLessonById, startOfDay } from '@/features/schedule/lib/schedule';

export { REMINDER_TIME_PRESETS, formatReminderTime, reminderTimeOptions };

const HOMEWORK_REMINDER_PREFIX = 'homework-reminder:';
const ANDROID_CHANNEL_ID = 'homework';

export function configureNotifications() {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
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

async function cancelHomeworkReminders() {
  const scheduled = await getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith(HOMEWORK_REMINDER_PREFIX))
      .map((item) => cancelScheduledNotificationAsync(item.identifier))
  );
}

export async function syncHomeworkReminders(profile: Profile = getCachedProfile()) {
  try {
    await cancelHomeworkReminders();

    if (!profile.onboardingComplete || !profile.notifications.enabled) {
      return;
    }

    const permission = await getPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    if (Platform.OS === 'android') {
      await setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Домашние задания',
        importance: 3,
      });
    }

    const homeworkMap = await loadHomeworkMap();
    const lessons = getGroup(profile.groupId).lessons;
    const now = Date.now();

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

      const triggerDate = reminderDateForLesson(entry.date, profile.notifications);
      if (triggerDate.getTime() <= now) {
        continue;
      }

      const preview = homeworkPreview(entry);
      const body = preview
        ? `Завтра ${lesson.start} · ${lesson.subject}: ${preview}`
        : `Завтра ${lesson.start} · ${lesson.subject}`;

      await scheduleNotificationAsync({
        identifier: `${HOMEWORK_REMINDER_PREFIX}${entry.date}:${entry.lessonId}`,
        content: {
          title: 'Напоминание о ДЗ',
          body,
          ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }
  } catch (error) {
    console.warn('[notifications] syncHomeworkReminders skipped:', error);
  }
}
