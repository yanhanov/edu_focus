import { useCallback, useEffect, useState } from 'react';

import type { GroupId } from '@/data/groups';
import {
  getEffectiveSchedule,
  loadScheduleOverride,
  subscribeSchedule,
  type ScheduleOverride,
} from '@/lib/schedule-overrides';

export function useScheduleSource(groupId: GroupId) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    void loadScheduleOverride(groupId);
    return subscribeSchedule(() => setRevision((value) => value + 1));
  }, [groupId]);

  const getEffective = useCallback((): ScheduleOverride => {
    void revision;
    return getEffectiveSchedule(groupId);
  }, [groupId, revision]);

  return {
    schedule: getEffective(),
    reload: () => setRevision((value) => value + 1),
  };
}
