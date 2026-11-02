import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { homeworkSummary, useHomeworkMap } from '@/hooks/use-homework';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { listHomeworkEntries } from '@/lib/homework';
import {
  formatDate,
  getLessonById,
  getLessonsForDate,
  toIsoDate,
} from '@/lib/schedule';

function parseDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function HomeworkListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const homeworkMap = useHomeworkMap();
  const items = listHomeworkEntries(homeworkMap);
  const todayIso = toIsoDate(now);
  const todayLessons = getLessonsForDate(now);
  const lessonsWithoutHomework = todayLessons.filter(
    (lesson) => !homeworkSummary(homeworkMap[`${todayIso}:${lesson.id}`]).hasContent
  );

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
            Записи к парам
          </ThemedText>
          <ThemedText type="subtitle">Домашние задания</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Текст, фото и ссылки хранятся на этом телефоне
          </ThemedText>
        </ThemedView>

        {lessonsWithoutHomework.length > 0 ? (
          <ThemedView style={styles.block}>
            <ThemedText type="smallBold">Добавить к сегодняшней паре</ThemedText>
            {lessonsWithoutHomework.map((lesson) => (
              <Pressable
                key={lesson.id}
                onPress={() =>
                  router.push({
                    pathname: '/homework-entry',
                    params: { lessonId: lesson.id, date: todayIso },
                  })
                }>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="smallBold">
                    {lesson.start} · {lesson.subject}
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    Записать ДЗ
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>
        ) : null}

        <ThemedView style={styles.block}>
          <ThemedText type="smallBold">Сохранённые</ThemedText>
          {items.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">Пока пусто</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Откройте пару в расписании или выберите занятие выше
              </ThemedText>
            </ThemedView>
          ) : (
            items.map((item) => {
              const lesson = getLessonById(item.lessonId);
              const summary = homeworkSummary(item);
              const details = [
                summary.text || null,
                summary.photoCount ? `фото: ${summary.photoCount}` : null,
                summary.linkCount ? `ссылки: ${summary.linkCount}` : null,
              ].filter(Boolean);

              return (
                <Pressable
                  key={`${item.date}:${item.lessonId}`}
                  onPress={() =>
                    router.push({
                      pathname: '/homework-entry',
                      params: { lessonId: item.lessonId, date: item.date },
                    })
                  }>
                  <ThemedView type="backgroundElement" style={styles.card}>
                    <ThemedText type="smallBold">{lesson?.subject ?? 'Занятие'}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatDate(parseDate(item.date))}
                      {lesson ? ` · ${lesson.start}` : ''}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                      {details.join(' · ')}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              );
            })
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
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
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
});
