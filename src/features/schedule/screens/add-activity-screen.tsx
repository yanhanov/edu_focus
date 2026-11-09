import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityTypeSelect } from '@/features/schedule/components/activity-type-select';
import { AppIcon } from '@/shared/ui/app-icon';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { MaxContentWidth, Spacing } from '@/shared/theme/theme';
import type { Lesson } from '@/features/schedule/data/schedule-11701126';
import { useColorScheme } from '@/shared/hooks/use-color-scheme';
import { useNow } from '@/shared/hooks/use-now';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/shared/hooks/use-theme';
import { addExtraActivity, type ExtraActivityType } from '@/features/schedule/lib/extra-activities';
import {
  addDays,
  formatDate,
  getWeekday,
  startOfDay,
  toIsoDate,
  WEEKDAY_LABELS,
  WEEKDAY_SHORT,
  LESSON_TYPE_LABELS,
} from '@/features/schedule/lib/schedule';
import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

type PickerKind = 'date' | 'start' | 'end';

const TITLE_PLACEHOLDERS: Record<ExtraActivityType, string> = {
  meeting: 'Собрание группы',
  event: 'День карьеры',
  exam: 'Экзамен по физике',
  credit: 'Зачёт по программированию',
};

function parseDateParam(value: string | undefined, fallback: Date): Date {
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return fallback;
  }
  return new Date(year, month - 1, day);
}

function toStudyDay(date: Date): Date {
  const next = startOfDay(date);
  if (getWeekday(next) === 7) {
    return addDays(next, 1);
  }
  return next;
}

function parseTime(value: string): string {
  const trimmed = value.trim().replace('.', ':');
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return '';
  }
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function timeToDate(time: string, day: Date): Date {
  const parsed = parseTime(time) || '12:00';
  const [hour, minute] = parsed.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
}

function dateToTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function AddActivityScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const { profile } = useProfile();
  const params = useLocalSearchParams<{ date?: string }>();
  const [eventDate, setEventDate] = useState(() =>
    toStudyDay(parseDateParam(typeof params.date === 'string' ? params.date : undefined, now)),
  );
  const [activityType, setActivityType] = useState<ExtraActivityType>('meeting');
  const [subject, setSubject] = useState('');
  const [start, setStart] = useState('12:00');
  const [end, setEnd] = useState('13:00');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [saving, setSaving] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [picker, setPicker] = useState<PickerKind | null>(null);

  const weekday = getWeekday(eventDate);
  const dateIso = toIsoDate(eventDate);
  const isToday = startOfDay(eventDate).getTime() === startOfDay(now).getTime();
  const pickerTheme = scheme === 'dark' ? 'dark' : 'light';

  const save = async () => {
    const title = subject.trim();
    const startTime = parseTime(start);
    const endTime = parseTime(end);
    if (!title) {
      Alert.alert('Название', `Например: ${TITLE_PLACEHOLDERS[activityType]}`);
      return;
    }
    if (!startTime || !endTime) {
      Alert.alert('Время', 'Укажите начало и конец');
      return;
    }
    if (startTime >= endTime) {
      Alert.alert('Время', 'Конец должен быть позже начала');
      return;
    }
    if (weekday === 7) {
      Alert.alert('День', 'Выберите будний день (пн–сб)');
      return;
    }

    setSaving(true);
    try {
      await addExtraActivity(profile.groupId, {
        id: `extra-${Date.now()}`,
        weekday: weekday as Lesson['weekday'],
        start: startTime,
        end: endTime,
        subject: title,
        type: activityType,
        teacher: organizer.trim(),
        room: room.trim(),
        building: building.trim(),
        weeks: 'always',
        dates: [dateIso],
      });
      syncScheduleWidget();
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const onPickerChange = (kind: PickerKind, event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setPicker(null);
    }
    if (event.type === 'dismissed' || !date) {
      return;
    }
    if (kind === 'date') {
      setEventDate(toStudyDay(date));
      return;
    }
    const next = dateToTime(date);
    if (kind === 'start') {
      setStart(next);
      if (next >= end) {
        const bumped = new Date(date.getTime() + 60 * 60 * 1000);
        setEnd(dateToTime(bumped));
      }
      return;
    }
    setEnd(next);
  };

  const openPicker = (kind: PickerKind) => {
    if (Platform.OS === 'web') {
      return;
    }
    setPicker(kind);
  };

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.background },
  ];

  const showNativePicker = Platform.OS !== 'web' && picker !== null;
  const iosInline = Platform.OS === 'ios';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            Новое событие
          </ThemedText>
          <View style={styles.topButton} />
        </ThemedView>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.six, maxWidth: MaxContentWidth },
          ]}>
          <ThemedText type="small" themeColor="textSecondary">
            Появится в расписании {WEEKDAY_SHORT[weekday]}, {formatDate(eventDate)}
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <FormRow
              label="Тип"
              value={LESSON_TYPE_LABELS[activityType]}
              onPress={() => setTypeOpen(true)}
            />
            <Divider />
            <FormRow
              label="Дата"
              value={`${formatDate(eventDate)}, ${WEEKDAY_LABELS[weekday]}`}
              onPress={iosInline ? undefined : () => openPicker('date')}
              hideValue={iosInline}
              trailing={
                <>
                  {iosInline ? (
                    <DateTimePicker
                      value={eventDate}
                      mode="date"
                      display="compact"
                      onChange={(event, date) => onPickerChange('date', event, date)}
                      themeVariant={pickerTheme}
                      locale="ru-RU"
                    />
                  ) : null}
                  {!isToday ? (
                    <Pressable
                      onPress={() => setEventDate(toStudyDay(now))}
                      hitSlop={8}
                      style={({ pressed }) => pressed && styles.pressed}>
                      <ThemedText type="smallBold" style={{ color: theme.accent }}>
                        Сегодня
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </>
              }
            />
            <Divider />
            <FormRow
              label="Начало"
              value={start}
              onPress={iosInline || Platform.OS === 'web' ? undefined : () => openPicker('start')}
              hideValue={iosInline || Platform.OS === 'web'}
              trailing={
                iosInline ? (
                  <DateTimePicker
                    value={timeToDate(start, eventDate)}
                    mode="time"
                    display="compact"
                    onChange={(event, date) => onPickerChange('start', event, date)}
                    themeVariant={pickerTheme}
                    locale="ru-RU"
                  />
                ) : Platform.OS === 'web' ? (
                  <TextInput
                    value={start}
                    onChangeText={setStart}
                    placeholder="12:00"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.timeInput, { color: theme.text }]}
                  />
                ) : undefined
              }
            />
            <Divider />
            <FormRow
              label="Конец"
              value={end}
              onPress={iosInline || Platform.OS === 'web' ? undefined : () => openPicker('end')}
              hideValue={iosInline || Platform.OS === 'web'}
              trailing={
                iosInline ? (
                  <DateTimePicker
                    value={timeToDate(end, eventDate)}
                    mode="time"
                    display="compact"
                    onChange={(event, date) => onPickerChange('end', event, date)}
                    themeVariant={pickerTheme}
                    locale="ru-RU"
                  />
                ) : Platform.OS === 'web' ? (
                  <TextInput
                    value={end}
                    onChangeText={setEnd}
                    placeholder="13:00"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.timeInput, { color: theme.text }]}
                  />
                ) : undefined
              }
            />
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              Название
            </ThemedText>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder={TITLE_PLACEHOLDERS[activityType]}
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
            />
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="small" themeColor="textSecondary">
              Место — необязательно
            </ThemedText>
            <ThemedView style={styles.placeRow}>
              <TextInput
                value={building}
                onChangeText={setBuilding}
                placeholder="Корпус"
                placeholderTextColor={theme.textSecondary}
                style={[inputStyle, styles.placeField]}
              />
              <TextInput
                value={room}
                onChangeText={setRoom}
                placeholder="Аудитория"
                placeholderTextColor={theme.textSecondary}
                style={[inputStyle, styles.placeField]}
              />
            </ThemedView>
            <TextInput
              value={organizer}
              onChangeText={setOrganizer}
              placeholder="Кто проводит"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
            />
          </ThemedView>
        </ScrollView>

        <ThemedView
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + Spacing.three,
              borderTopColor: theme.backgroundElement,
            },
          ]}>
          <Pressable
            disabled={saving}
            onPress={() => void save()}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: theme.accent, opacity: saving ? 0.55 : 1 },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              {saving ? 'Добавляем…' : 'Добавить в расписание'}
            </ThemedText>
          </Pressable>
        </ThemedView>

        <ActivityTypeSelect
          value={activityType}
          onChange={setActivityType}
          open={typeOpen}
          onOpenChange={setTypeOpen}
        />

        {showNativePicker && !iosInline ? (
          <DateTimePicker
            value={
              picker === 'date'
                ? eventDate
                : timeToDate(picker === 'start' ? start : end, eventDate)
            }
            mode={picker === 'date' ? 'date' : 'time'}
            display="default"
            is24Hour
            onChange={(event, date) => {
              if (picker) {
                onPickerChange(picker, event, date);
              }
            }}
            themeVariant={pickerTheme}
            locale="ru-RU"
          />
        ) : null}
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function FormRow({
  label,
  value,
  onPress,
  hideValue = false,
  trailing,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  hideValue?: boolean;
  trailing?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : undefined]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.rowLabel}>
        {label}
      </ThemedText>
      <ThemedView style={styles.rowValue}>
        {hideValue ? null : (
          <ThemedText type="smallBold" numberOfLines={1} style={styles.rowValueText}>
            {value}
          </ThemedText>
        )}
        {trailing}
        {hideValue ? null : (
          <AppIcon ios="chevron.right" android="chevron_right" color={theme.textSecondary} size={16} />
        )}
      </ThemedView>
    </Pressable>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topButton: {
    width: 44,
    height: 44,
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
    gap: Spacing.three,
  },
  card: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowLabel: {
    width: 72,
  },
  rowValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  rowValueText: {
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    fontWeight: '500',
  },
  placeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  placeField: {
    flex: 1,
  },
  timeInput: {
    minWidth: 64,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '700',
    padding: 0,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    minHeight: 48,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
