import type { NotificationSettings } from '@/lib/profile';

export const REMINDER_TIME_PRESETS = [
  { label: '19:00', hour: 19, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 },
  { label: '21:00', hour: 21, minute: 0 },
  { label: '22:00', hour: 22, minute: 0 },
] as const;

export function formatReminderTime(settings: Pick<NotificationSettings, 'hour' | 'minute'>): string {
  const hour = String(settings.hour).padStart(2, '0');
  const minute = String(settings.minute).padStart(2, '0');
  return `${hour}:${minute}`;
}

function matchesPreset(
  settings: Pick<NotificationSettings, 'hour' | 'minute'>,
  preset: (typeof REMINDER_TIME_PRESETS)[number]
) {
  return settings.hour === preset.hour && settings.minute === preset.minute;
}

export function reminderTimeOptions(settings: Pick<NotificationSettings, 'hour' | 'minute'>) {
  const hasPreset = REMINDER_TIME_PRESETS.some((preset) => matchesPreset(settings, preset));
  if (hasPreset) {
    return REMINDER_TIME_PRESETS;
  }
  const custom = {
    label: formatReminderTime(settings),
    hour: settings.hour,
    minute: settings.minute,
  };
  return [...REMINDER_TIME_PRESETS, custom];
}
