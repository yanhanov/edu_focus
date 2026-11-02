import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, intervalMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        tick();
        syncScheduleWidget();
      }
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [intervalMs]);

  return now;
}
