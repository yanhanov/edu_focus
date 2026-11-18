import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { refreshLessonLiveNotificationRuntime } from '@/features/notifications/lib/notifications-runtime';
import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

function refreshNow() {
  const next = new Date();
  syncScheduleWidget(next);
  void refreshLessonLiveNotificationRuntime(undefined, next);
  return next;
}

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(refreshNow());
    const interval = setInterval(tick, intervalMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        tick();
      }
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [intervalMs]);

  return now;
}
