import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { SplashColors } from '@/shared/theme/splash';
import { useColorScheme } from '@/shared/hooks/use-color-scheme';
import { useProfileOptional } from '@/features/profile/hooks/use-profile';

const ICON_SIZE = 88;

export function AnimatedSplashOverlay() {
  const scheme = useColorScheme();
  const colors = SplashColors[scheme];
  const profile = useProfileOptional();
  const [visible, setVisible] = useState(true);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!profile?.ready) {
      return;
    }
    void SplashScreen.hideAsync();
    opacity.value = withTiming(0, { duration: 180, easing: Easing.linear });
    const timeout = setTimeout(() => setVisible(false), 180);
    return () => clearTimeout(timeout);
  }, [profile?.ready, opacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { backgroundColor: colors.background }, overlayStyle]}>
      <View style={styles.center}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.icon}
          contentFit="contain"
        />
      </View>
    </Animated.View>
  );
}

export function AnimatedIcon() {
  return null;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
