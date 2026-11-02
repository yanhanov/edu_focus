import { useEffect, useRef, type ElementRef } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { STUDY_WEEKDAYS, WEEKDAY_SHORT, type Weekday } from '@/lib/schedule';

type DaySwitcherProps = {
  selected: Exclude<Weekday, 7>;
  today: Weekday;
  onSelect: (day: Exclude<Weekday, 7>) => void;
};

const CHIP_SLOT = 48 + Spacing.three * 2 + Spacing.two;

export function DaySwitcher({ selected, today, onSelect }: DaySwitcherProps) {
  const theme = useTheme();
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null);

  useEffect(() => {
    const index = STUDY_WEEKDAYS.indexOf(selected);
    if (index < 0) {
      return;
    }
    scrollRef.current?.scrollTo({
      x: Math.max(0, index * CHIP_SLOT - Spacing.four * 2),
      animated: true,
    });
  }, [selected]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {STUDY_WEEKDAYS.map((day) => {
        const isSelected = day === selected;
        const isToday = day === today;
        return (
          <Pressable
            key={day}
            onPress={() => onSelect(day)}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView
              type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
              style={[
                styles.chip,
                isSelected && { backgroundColor: theme.accent },
                isToday && !isSelected && { borderColor: theme.accent, borderWidth: 1 },
              ]}>
              <ThemedText
                type="smallBold"
                style={isSelected ? { color: theme.background } : undefined}>
                {WEEKDAY_SHORT[day]}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  chip: {
    minWidth: 48,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
