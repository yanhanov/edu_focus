import type { Profile } from '@/lib/profile';

export {
  REMINDER_TIME_PRESETS,
  formatReminderTime,
  reminderTimeOptions,
} from '@/lib/notifications-config';

export function configureNotifications() {}

export async function ensureNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function syncHomeworkReminders(_profile?: Profile) {}
