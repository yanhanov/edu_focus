import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ProfileProvider } from '@/hooks/use-profile';
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
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="homework-entry" />
      </Stack>
    </ThemeProvider>
  );
}
