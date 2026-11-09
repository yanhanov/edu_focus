import { Platform } from 'react-native';

import type { Profile } from '@/features/profile/lib/profile';

async function loadNotificationsModule() {
  if (Platform.OS === 'web') {
    return import('@/features/notifications/lib/notifications.web');
  }
  return import('@/features/notifications/lib/notifications.native');
}

export async function configureNotificationsRuntime() {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    const notifications = await loadNotificationsModule();
    notifications.configureNotifications();
  } catch (error) {
    console.warn('[notifications] configure skipped:', error);
  }
}

export async function ensureNotificationPermissionsRuntime(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  try {
    const notifications = await loadNotificationsModule();
    return notifications.ensureNotificationPermissions();
  } catch (error) {
    console.warn('[notifications] permissions skipped:', error);
    return false;
  }
}

export async function syncHomeworkRemindersRuntime(profile?: Profile) {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    const notifications = await loadNotificationsModule();
    await notifications.syncHomeworkReminders(profile);
  } catch (error) {
    console.warn('[notifications] sync skipped:', error);
  }
}
