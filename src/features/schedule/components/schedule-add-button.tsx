import { Pressable, StyleSheet } from 'react-native';

import { AppIcon } from '@/shared/ui/app-icon';
import { useTheme } from '@/shared/hooks/use-theme';

type ScheduleAddButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
};

export function ScheduleAddButton({
  onPress,
  accessibilityLabel = 'Добавить событие',
}: ScheduleAddButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [
        styles.root,
        { backgroundColor: theme.accentSoft },
        pressed && styles.pressed,
      ]}>
      <AppIcon ios="plus" android="add" color={theme.accent} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
