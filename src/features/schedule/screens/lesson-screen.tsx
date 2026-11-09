import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/shared/ui/app-icon';
import { HomeworkStatusChip } from '@/features/homework/components/homework-status-chip';
import { LessonTypeBadge } from '@/features/schedule/components/lesson-type-badge';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { MaxContentWidth, Spacing } from '@/shared/theme/theme';
import { homeworkSummary, useHomeworkMap } from '@/features/homework/hooks/use-homework';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/shared/hooks/use-theme';
import { homeworkCompletionStatus, homeworkKey, setHomeworkDone } from '@/features/homework/lib/homework';
import { removeExtraActivity } from '@/features/schedule/lib/extra-activities';
import {
  formatDate,
  formatPlace,
  getLessonById,
  isActivityLesson,
  LESSON_TYPE_LABELS,
} from '@/features/schedule/lib/schedule';
import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

function parseDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function LessonScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { group, profile } = useProfile();
  const homeworkMap = useHomeworkMap();
  const params = useLocalSearchParams<{ lessonId?: string; date?: string }>();
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : '';
  const date = typeof params.date === 'string' ? params.date : '';
  const lesson = getLessonById(lessonId, group.lessons);
  const entry = homeworkMap[homeworkKey(date, lessonId)];
  const summary = homeworkSummary(entry);
  const status = homeworkCompletionStatus(entry);

  const openHomework = () => {
    router.push({
      pathname: '/homework-entry',
      params: { lessonId, date },
    });
  };

  if (!lesson || !date) {
    return (
      <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.three }]}>
        <ThemedText style={styles.padded}>Пара не найдена</ThemedText>
      </ThemedView>
    );
  }

  const lessonDate = parseDate(date);
  const typeLabel = LESSON_TYPE_LABELS[lesson.type];
  const activity = isActivityLesson(lesson);
  const isCustomExtra = lesson.id.startsWith('extra-');

  const removeFromSchedule = () => {
    Alert.alert('Удалить из расписания?', lesson.subject, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          void removeExtraActivity(profile.groupId, lesson.id).then(() => {
            syncScheduleWidget();
            router.back();
          });
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.screen}>
      <ThemedView
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + Spacing.two,
            borderBottomColor: theme.backgroundElement,
          },
        ]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}>
          <AppIcon ios="chevron.left" android="arrow_back" color={theme.text} size={22} />
        </Pressable>
        <ThemedText type="smallBold" style={styles.topTitle}>
          {activity ? 'Событие' : 'Пара'}
        </ThemedText>
        {isCustomExtra ? (
          <Pressable
            onPress={removeFromSchedule}
            hitSlop={8}
            style={({ pressed }) => [styles.topButton, pressed && styles.pressed]}>
            <AppIcon ios="trash" android="delete" color={theme.textSecondary} size={20} />
          </Pressable>
        ) : (
          <ThemedView style={styles.topButton} />
        )}
      </ThemedView>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.five, maxWidth: MaxContentWidth },
        ]}>
        <ThemedView type="backgroundElement" style={styles.infoCard}>
          <ThemedView style={[styles.titleRow, { backgroundColor: 'transparent' }]}>
            <ThemedText type="subtitle" style={styles.subject}>
              {lesson.subject}
            </ThemedText>
            <LessonTypeBadge type={lesson.type} />
          </ThemedView>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(lessonDate)} · {lesson.start}–{lesson.end}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {typeLabel}
            {lesson.teacher ? ` · ${lesson.teacher}` : ''}
          </ThemedText>
          {formatPlace(lesson) || lesson.subgroup ? (
            <ThemedText type="small" themeColor="textSecondary">
              {formatPlace(lesson)}
              {lesson.subgroup ? ` · подгруппа ${lesson.subgroup}` : ''}
            </ThemedText>
          ) : null}
        </ThemedView>

        <ThemedView style={styles.hwSection}>
          <ThemedText type="smallBold">{activity ? 'Заметки' : 'Домашнее задание'}</ThemedText>
          <ThemedView type="backgroundElement" style={styles.hwCard}>
            {summary.hasContent ? (
              <>
                <ThemedView style={styles.hwStatusRow}>
                  <HomeworkStatusChip
                    status={status === 'done' ? 'done' : 'todo'}
                    onToggle={() => {
                      void setHomeworkDone(date, lessonId, status !== 'done');
                    }}
                  />
                </ThemedView>
                {summary.text ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {summary.text}
                  </ThemedText>
                ) : null}
                {summary.photoCount > 0 || summary.linkCount > 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {[
                      summary.photoCount > 0 ? `фото: ${summary.photoCount}` : null,
                      summary.linkCount > 0 ? `ссылки: ${summary.linkCount}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </ThemedText>
                ) : null}
              </>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                {activity
                  ? 'Запишите, что обсудят, во сколько прийти или ссылку на регистрацию.'
                  : 'Можно записать задание: текст, фото со страницы или ссылки. Напоминание придёт только если ДЗ записано и ещё не отмечено как сделанное.'}
              </ThemedText>
            )}

            <Pressable
              onPress={openHomework}
              style={({ pressed }) => [
                styles.primary,
                { backgroundColor: theme.accent },
                pressed && styles.pressed,
              ]}>
              <AppIcon
                ios="square.and.pencil"
                android="edit_note"
                color={theme.background}
                size={20}
              />
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                {summary.hasContent
                  ? activity
                    ? 'Открыть заметки'
                    : 'Открыть запись ДЗ'
                  : activity
                    ? 'Добавить заметку'
                    : 'Добавить ДЗ'}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  padded: {
    paddingHorizontal: Spacing.four,
  },
  infoCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  subject: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
  },
  hwSection: {
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  hwCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  hwStatusRow: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
  },
  pressed: {
    opacity: 0.75,
  },
});
