import { Redirect } from "expo-router";

import AppTabs from "@/components/app-tabs";
import { useProfile } from "@/hooks/use-profile";

export default function TabsLayout() {
  const { profile, ready } = useProfile();

  if (ready && !profile.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <AppTabs />;
}
