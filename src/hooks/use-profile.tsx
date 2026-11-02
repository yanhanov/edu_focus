import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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
import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

type ProfileContextValue = {
  profile: Profile;
  group: Group;
  ready: boolean;
  setGroupId: (groupId: GroupId) => void;
  setSubgroup: (subgroup: SubgroupPreference) => void;
  setTheme: (theme: ThemePreference) => void;
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

  useEffect(() => {
    let cancelled = false;
    void loadProfile().then((next) => {
      if (!cancelled) {
        setProfile(next);
        setReady(true);
        syncScheduleWidget();
        void syncHomeworkRemindersRuntime(next);
      }
    });
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

  return (
    <ProfileContext.Provider
      value={{
        profile,
        group: getGroup(profile.groupId),
        ready,
        setGroupId: (groupId) => update({ groupId }),
        setSubgroup: (subgroup) => update({ subgroup }),
        setTheme: (theme) => update({ theme }),
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
