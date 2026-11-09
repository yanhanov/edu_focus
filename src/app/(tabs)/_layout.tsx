import { Redirect } from "expo-router";

import AppTabs from "@/shared/ui/app-tabs";
import { useProfile } from "@/features/profile/hooks/use-profile";

export default function TabsLayout() {
  const { profile, ready } = useProfile();

  if (ready && !profile.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <AppTabs />;
}
