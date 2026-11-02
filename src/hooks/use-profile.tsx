import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getGroup, type Group, type GroupId } from '@/data/groups';
import {
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
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
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (partial: Partial<Profile>) => {
    const next = { ...profile, ...partial };
    setProfile(next);
    void saveProfile(next);
    syncScheduleWidget();
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
