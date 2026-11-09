import { Modal, Pressable, StyleSheet } from 'react-native';

import { AppIcon } from '@/shared/ui/app-icon';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/hooks/use-theme';
import { EXTRA_ACTIVITY_TYPES, type ExtraActivityType } from '@/features/schedule/lib/extra-activities';
import { LESSON_TYPE_LABELS } from '@/features/schedule/lib/schedule';

const TYPE_ICONS: Record<ExtraActivityType, { ios: string; android: string }> = {
  meeting: { ios: 'person.3', android: 'groups' },
  event: { ios: 'star', android: 'star' },
  exam: { ios: 'doc.text', android: 'assignment' },
  credit: { ios: 'checkmark.seal', android: 'verified' },
};

type ActivityTypeSelectProps = {
  value: ExtraActivityType;
  onChange: (type: ExtraActivityType) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ActivityTypeSelect({
  value,
  onChange,
  open,
  onOpenChange,
}: ActivityTypeSelectProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}>
      <Pressable style={styles.backdrop} onPress={() => onOpenChange(false)}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[styles.sheet, { backgroundColor: theme.background }]}>
          <ThemedText type="smallBold" style={styles.sheetTitle}>
            Тип события
          </ThemedText>
          {EXTRA_ACTIVITY_TYPES.map((type) => {
            const selected = type === value;
            const icon = TYPE_ICONS[type];
            return (
              <Pressable
                key={type}
                onPress={() => {
                  onChange(type);
                  onOpenChange(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  selected && { backgroundColor: theme.accentSoft },
                  pressed && styles.pressed,
                ]}>
                <ThemedView
                  style={[
                    styles.optionIcon,
                    { backgroundColor: selected ? theme.accent : theme.backgroundElement },
                  ]}>
                  <AppIcon
                    ios={icon.ios}
                    android={icon.android}
                    color={selected ? theme.background : theme.accent}
                    size={18}
                  />
                </ThemedView>
                <ThemedText type="smallBold" style={styles.optionLabel}>
                  {LESSON_TYPE_LABELS[type]}
                </ThemedText>
                {selected ? (
                  <AppIcon ios="checkmark" android="check" color={theme.accent} size={18} />
                ) : null}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  sheet: {
    borderRadius: Spacing.four,
    padding: Spacing.two,
    gap: 2,
  },
  sheetTitle: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 52,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
