import { useEffect } from 'react';

import { useProfileOptional } from '@/hooks/use-profile';
import { subscribeHomework } from '@/lib/homework';
import { syncHomeworkRemindersRuntime } from '@/lib/notifications-runtime';
import { getCachedProfile } from '@/lib/profile';

export function useHomeworkReminders() {
  const profileContext = useProfileOptional();
  const profile = profileContext?.profile;
  const ready = profileContext?.ready ?? false;

  useEffect(() => {
    void configureOnce();
    const unsubscribe = subscribeHomework(() => {
      void syncHomeworkRemindersRuntime(getCachedProfile());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!ready || !profile) {
      return;
    }
    void syncHomeworkRemindersRuntime(profile);
  }, [ready, profile]);
}

let configured = false;
async function configureOnce() {
  if (configured) {
    return;
  }
  configured = true;
  const { configureNotificationsRuntime } = await import('@/lib/notifications-runtime');
  await configureNotificationsRuntime();
}
