/** Metro picks `.native.ts` / `.web.ts`; this file is for TypeScript and web-safe fallback. */
export {
  REMINDER_TIME_PRESETS,
  configureNotifications,
  ensureNotificationPermissions,
  formatReminderTime,
  reminderTimeOptions,
  syncHomeworkReminders,
} from '@/lib/notifications.web';
