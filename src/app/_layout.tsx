import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from '@/shared/hooks/use-color-scheme';

import { AnimatedSplashOverlay } from '@/shared/ui/animated-icon';
import { useHomeworkReminders } from '@/features/homework/hooks/use-homework-reminders';
import { ProfileProvider } from '@/features/profile/hooks/use-profile';
import '@/widgets/ScheduleWidget';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ProfileProvider>
      <ThemedRoot />
    </ProfileProvider>
  );
}

function ThemedRoot() {
  const colorScheme = useColorScheme();
  useHomeworkReminders();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(schedule)/lesson" />
        <Stack.Screen name="(schedule)/add-activity" />
        <Stack.Screen name="(homework)/homework-entry" />
      </Stack>
    </ThemeProvider>
  );
}
