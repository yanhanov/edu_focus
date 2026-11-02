import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { GROUPS } from '@/data/groups';
import { useProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, group, setGroupId, setSubgroup, setTheme } = useProfile();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
          },
        ]}>
        <ThemedView style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            {group.title}
            {profile.subgroup ? ` · подгруппа ${profile.subgroup}` : ''}
          </ThemedText>
          <ThemedText type="subtitle">Профиль</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Группа, подгруппа и оформление
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.block}>
          <ThemedText type="smallBold">Группа</ThemedText>
          {GROUPS.map((item) => {
            const selected = item.id === profile.groupId;
            return (
              <Pressable key={item.id} onPress={() => setGroupId(item.id)}>
                <ThemedView
                  type={selected ? 'backgroundSelected' : 'backgroundElement'}
                  style={[styles.card, selected && { backgroundColor: theme.accentSoft }]}>
                  <ThemedText type="smallBold">{item.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.specialty}
                    {item.lessons.length === 0 ? ' · расписание скоро' : ''}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            );
          })}
        </ThemedView>

        <ThemedView style={styles.block}>
          <ThemedText type="smallBold">Подгруппа</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Лабораторные другой подгруппы скрываются
          </ThemedText>
          <ThemedView style={styles.row}>
            <Chip
              label="Вся группа"
              selected={profile.subgroup === null}
              onPress={() => setSubgroup(null)}
            />
            <Chip label="1" selected={profile.subgroup === 1} onPress={() => setSubgroup(1)} />
            <Chip label="2" selected={profile.subgroup === 2} onPress={() => setSubgroup(2)} />
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.block}>
          <ThemedText type="smallBold">Тема</ThemedText>
          <ThemedView style={styles.row}>
            <Chip
              label="Система"
              selected={profile.theme === 'system'}
              onPress={() => setTheme('system')}
            />
            <Chip
              label="Светлая"
              selected={profile.theme === 'light'}
              onPress={() => setTheme('light')}
            />
            <Chip
              label="Тёмная"
              selected={profile.theme === 'dark'}
              onPress={() => setTheme('dark')}
            />
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={selected ? 'backgroundSelected' : 'backgroundElement'}
        style={[
          styles.chip,
          selected && { backgroundColor: theme.accent },
        ]}>
        <ThemedText type="smallBold" style={selected ? { color: theme.background } : undefined}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
  },
  block: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  chip: {
    minWidth: 72,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
