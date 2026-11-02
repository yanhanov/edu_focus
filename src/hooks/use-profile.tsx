import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AccentPaletteId } from '@/constants/accent-palettes';
import { getGroup, type Group, type GroupId } from '@/data/groups';
import { syncHomeworkRemindersRuntime } from '@/lib/notifications-runtime';
import {
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
  type NotificationSettings,
  type Profile,
  type SubgroupPreference,
  type ThemePreference,
} from '@/lib/profile';
import { loadAllScheduleOverrides, subscribeSchedule } from '@/lib/schedule-overrides';
import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

type ProfileContextValue = {
  profile: Profile;
  group: Group;
  ready: boolean;
  setGroupId: (groupId: GroupId) => void;
  setSubgroup: (subgroup: SubgroupPreference) => void;
  setTheme: (theme: ThemePreference) => void;
  setAccentPalette: (accentPalette: AccentPaletteId) => void;
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

  useEffect(() => subscribeSchedule(() => setScheduleTick((value) => value + 1)), []);

  useEffect(() => {
    let cancelled = false;
    void loadAllScheduleOverrides().then(() =>
      loadProfile().then((next) => {
        if (!cancelled) {
          setProfile(next);
          setReady(true);
          syncScheduleWidget();
          void syncHomeworkRemindersRuntime(next);
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
  };

  const update = (partial: Partial<Profile>) => {
    persist({ ...profile, ...partial });
  };

  const group = useMemo(() => {
    void scheduleTick;
    return getGroup(profile.groupId);
  }, [profile.groupId, scheduleTick]);

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
