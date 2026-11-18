import type { Profile } from '@/features/profile/lib/profile';

export {
  REMINDER_TIME_PRESETS,
  formatReminderTime,
  reminderTimeOptions,
} from '@/features/notifications/lib/notifications-config';

export function configureNotifications() {}

export async function ensureNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function syncHomeworkReminders(_profile?: Profile) {}

export async function syncLessonLiveNotifications(_profile?: Profile) {}

export async function refreshLessonLiveNotification(_profile?: Profile, _now?: Date) {}

export async function syncNotifications(_profile?: Profile) {}
