import { useColorScheme as useRNColorScheme } from 'react-native';

import { useProfileOptional } from '@/features/profile/hooks/use-profile';
import { getCachedProfile, resolveColorScheme } from '@/features/profile/lib/profile';

export function useColorScheme(): 'light' | 'dark' {
  const system = useRNColorScheme();
  const profile = useProfileOptional();
  const preference = profile?.profile.theme ?? getCachedProfile().theme;
  return resolveColorScheme(preference, system);
}
