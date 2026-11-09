import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AccentPaletteId } from '@/shared/theme/accent-palettes';
import { getGroup, type Group, type GroupId } from '@/features/schedule/data/groups';
import { syncHomeworkRemindersRuntime } from '@/features/notifications/lib/notifications-runtime';
import { syncPublicHolidays, subscribePublicHolidays } from '@/features/calendar/lib/public-holidays';
import {
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
  type HolidayRegion,
  type NotificationSettings,
  type Profile,
  type SubgroupPreference,
  type ThemePreference,
} from '@/features/profile/lib/profile';
import { loadExtraActivities, subscribeExtraActivities } from '@/features/schedule/lib/extra-activities';
import { loadAllScheduleOverrides, subscribeSchedule } from '@/features/schedule/lib/schedule-overrides';
import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

type ProfileContextValue = {
  profile: Profile;
  group: Group;
  ready: boolean;
  setGroupId: (groupId: GroupId) => void;
  setSubgroup: (subgroup: SubgroupPreference) => void;
  setTheme: (theme: ThemePreference) => void;
  setAccentPalette: (accentPalette: AccentPaletteId) => void;
  setHolidayRegion: (holidayRegion: HolidayRegion) => void;
  setNotifications: (notifications: NotificationSettings) => void;
  completeOnboarding: (next: Profile) => Promise<void>;
};

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfileOptional(): ProfileContextValue | null {
  return useContext(ProfileContext);
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [ready, setReady] = useState(false);
  const [scheduleTick, setScheduleTick] = useState(0);
  const [extraTick, setExtraTick] = useState(0);
  const [holidayTick, setHolidayTick] = useState(0);

  useEffect(() => subscribeSchedule(() => setScheduleTick((value) => value + 1)), []);
  useEffect(() => subscribeExtraActivities(() => setExtraTick((value) => value + 1)), []);
  useEffect(() => subscribePublicHolidays(() => setHolidayTick((value) => value + 1)), []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadAllScheduleOverrides(), loadExtraActivities()]).then(() =>
      loadProfile().then((next) => {
        if (!cancelled) {
          void syncPublicHolidays(next.holidayRegion).then(() => {
            if (!cancelled) {
              setProfile(next);
              setReady(true);
              syncScheduleWidget();
              void syncHomeworkRemindersRuntime(next);
            }
          });
        }
      })
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = (next: Profile) => {
    setProfile(next);
    void saveProfile(next).then(() => {
      syncScheduleWidget();
      void syncHomeworkRemindersRuntime(next);
    });
    void syncPublicHolidays(next.holidayRegion);
  };

  const update = (partial: Partial<Profile>) => {
    persist({ ...profile, ...partial });
  };

  const group = useMemo(() => {
    void scheduleTick;
    void extraTick;
    void holidayTick;
    return getGroup(profile.groupId);
  }, [profile.groupId, scheduleTick, extraTick, holidayTick]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        group,
        ready,
        setGroupId: (groupId) => update({ groupId }),
        setSubgroup: (subgroup) => update({ subgroup }),
        setTheme: (theme) => update({ theme }),
        setAccentPalette: (accentPalette) => update({ accentPalette }),
        setHolidayRegion: (holidayRegion) => update({ holidayRegion }),
        setNotifications: (notifications) => update({ notifications }),
        completeOnboarding: async (next) => {
          const completed = { ...next, onboardingComplete: true };
          persist(completed);
        },
      }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const value = useContext(ProfileContext);
  if (!value) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return value;
}
