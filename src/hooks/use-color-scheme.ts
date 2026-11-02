import { useColorScheme as useRNColorScheme } from 'react-native';

import { useProfileOptional } from '@/hooks/use-profile';
import { getCachedProfile, resolveColorScheme } from '@/lib/profile';

export function useColorScheme(): 'light' | 'dark' {
  const system = useRNColorScheme();
  const profile = useProfileOptional();
  const preference = profile?.profile.theme ?? getCachedProfile().theme;
  return resolveColorScheme(preference, system);
}
