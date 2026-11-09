import { useEffect, useRef, useState, type ElementRef } from 'react';
import { Pressable, StyleSheet, TextInput, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon } from '@/shared/ui/app-icon';
import { ThemedView } from '@/shared/ui/themed-view';
import { Spacing } from '@/shared/theme/theme';
import { useTheme } from '@/shared/hooks/use-theme';

type SubjectSearchToggleProps = {
  active?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function SubjectSearchToggle({
  active = false,
  onPress,
  accessibilityLabel = 'Поиск по предмету',
}: SubjectSearchToggleProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [
        styles.toggle,
        {
          backgroundColor: active ? theme.accentSoft : theme.backgroundElement,
        },
        pressed && styles.pressed,
      ]}>
      <AppIcon
        ios="magnifyingglass"
        android="search"
        color={active ? theme.accent : theme.textSecondary}
        size={20}
      />
    </Pressable>
  );
}

type SubjectSearchBarProps = {
  query: string;
  onChangeQuery: (value: string) => void;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SubjectSearchBar({ query, onChangeQuery, onClose, style }: SubjectSearchBarProps) {
  const theme = useTheme();
  const inputRef = useRef<ElementRef<typeof TextInput>>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemedView type="backgroundElement" style={[styles.bar, style]}>
      <AppIcon ios="magnifyingglass" android="search" color={theme.textSecondary} size={18} />
      <TextInput
        ref={inputRef}
        value={query}
        onChangeText={onChangeQuery}
        placeholder="Предмет или преподаватель"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text }]}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <Pressable
        onPress={onClose}
        accessibilityLabel="Закрыть поиск"
        hitSlop={8}
        style={({ pressed }) => pressed && styles.pressed}>
        <AppIcon ios="xmark" android="close" color={theme.textSecondary} size={18} />
      </Pressable>
    </ThemedView>
  );
}

type UseSubjectSearchState = {
  query: string;
  setQuery: (value: string) => void;
  open: boolean;
  active: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

export function useSubjectSearch(): UseSubjectSearchState {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const closeSearch = () => {
    setOpen(false);
    setQuery('');
  };

  return {
    query,
    setQuery,
    open,
    active: open || query.length > 0,
    openSearch: () => setOpen(true),
    closeSearch,
  };
}

const styles = StyleSheet.create({
  toggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
