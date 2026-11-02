import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  createItemId,
  deleteHomeworkPhotoFile,
  getHomework,
  normalizeHomeworkUrl,
  persistHomeworkPhoto,
  saveHomework,
  type HomeworkEntry,
} from '@/lib/homework';
import {
  formatDate,
  getLessonById,
  LESSON_TYPE_LABELS,
  WEEKDAY_LABELS,
} from '@/lib/schedule';

function parseDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function HomeworkEntryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lessonId?: string; date?: string }>();
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : '';
  const date = typeof params.date === 'string' ? params.date : '';
  const lesson = useMemo(() => getLessonById(lessonId), [lessonId]);

  const [entry, setEntry] = useState<HomeworkEntry>({
    lessonId,
    date,
    text: '',
    photos: [],
    links: [],
    updatedAt: 0,
  });
  const [linkDraft, setLinkDraft] = useState('');
  const [loaded, setLoaded] = useState(false);
  const entryRef = useRef(entry);

  useEffect(() => {
    entryRef.current = entry;
  }, [entry]);

  useEffect(() => {
    let cancelled = false;
    void getHomework(date, lessonId).then((next) => {
      if (!cancelled) {
        setEntry(next);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [date, lessonId]);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    const handle = setTimeout(() => {
      void saveHomework(entry);
    }, 400);
    return () => clearTimeout(handle);
  }, [entry, loaded]);

  useEffect(() => {
    return () => {
      void saveHomework(entryRef.current);
    };
  }, []);

  const persist = useCallback(async (next: HomeworkEntry) => {
    setEntry(next);
    await saveHomework(next);
  }, []);

  const addPhotos = useCallback(
    async (uris: string[]) => {
      const photos = await Promise.all(uris.map((uri) => persistHomeworkPhoto(uri)));
      await persist({ ...entry, photos: [...entry.photos, ...photos] });
    },
    [entry, persist]
  );

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к фото, чтобы прикрепить снимок задания.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      await addPhotos(result.assets.map((asset) => asset.uri));
    }
  }, [addPhotos]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите камеру, чтобы сфотографировать задание.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled) {
      await addPhotos(result.assets.map((asset) => asset.uri));
    }
  }, [addPhotos]);

  const removePhoto = useCallback(
    async (photoId: string) => {
      const photo = entry.photos.find((item) => item.id === photoId);
      if (photo) {
        await deleteHomeworkPhotoFile(photo.uri);
      }
      await persist({
        ...entry,
        photos: entry.photos.filter((item) => item.id !== photoId),
      });
    },
    [entry, persist]
  );

  const addLink = useCallback(async () => {
    const url = normalizeHomeworkUrl(linkDraft);
    if (!url) {
      Alert.alert('Неверная ссылка', 'Вставьте обычную ссылку, например https://disk.yandex.ru/...');
      return;
    }
    setLinkDraft('');
    await persist({
      ...entry,
      links: [...entry.links, { id: createItemId(), url }],
    });
  }, [entry, linkDraft, persist]);

  const removeLink = useCallback(
    async (linkId: string) => {
      await persist({
        ...entry,
        links: entry.links.filter((item) => item.id !== linkId),
      });
    },
    [entry, persist]
  );

  const openLink = useCallback(async (url: string) => {
    await openBrowserAsync(url, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  }, []);

  if (!lesson || !date) {
    return (
      <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.three }]}>
        <ThemedText style={styles.padded}>Пара не найдена</ThemedText>
      </ThemedView>
    );
  }

  const lessonDate = parseDate(date);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.screen}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + Spacing.three,
              paddingBottom: insets.bottom + Spacing.five,
            },
          ]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => pressed && styles.pressed}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Назад
            </ThemedText>
          </Pressable>

          <ThemedView style={styles.header}>
            <ThemedText type="small" themeColor="textSecondary">
              Домашнее задание
            </ThemedText>
            <ThemedText type="subtitle" style={styles.subject}>
              {lesson.subject}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {WEEKDAY_LABELS[lesson.weekday]}, {formatDate(lessonDate)} · {lesson.start}–{lesson.end}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {lesson.type === 'pe' ? lesson.teacher : `${LESSON_TYPE_LABELS[lesson.type]} · ${lesson.teacher}`}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.block}>
            <ThemedText type="smallBold">Текст</ThemedText>
            <TextInput
              value={entry.text}
              editable={loaded}
              multiline
              textAlignVertical="top"
              placeholder="Что задали: номера задач, страницы, дедлайн..."
              placeholderTextColor={theme.textSecondary}
              onChangeText={(text) => setEntry({ ...entry, text })}
              onBlur={() => {
                void persist(entry);
              }}
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
            />
          </ThemedView>

          <ThemedView style={styles.block}>
            <ThemedText type="smallBold">Фото</ThemedText>
            <ThemedView style={styles.photoRow}>
              {entry.photos.map((photo) => (
                <ThemedView key={photo.id} style={styles.photoWrap}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
                  <Pressable
                    onPress={() => {
                      void removePhoto(photo.id);
                    }}
                    style={[styles.photoRemove, { backgroundColor: theme.background }]}>
                    <ThemedText type="smallBold">×</ThemedText>
                  </Pressable>
                </ThemedView>
              ))}
            </ThemedView>
            <ThemedView style={styles.actions}>
              <ActionButton label="Галерея" onPress={() => void pickFromLibrary()} />
              <ActionButton label="Камера" onPress={() => void takePhoto()} />
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.block}>
            <ThemedText type="smallBold">Ссылки</ThemedText>
            {entry.links.map((link) => (
              <ThemedView key={link.id} type="backgroundElement" style={styles.linkRow}>
                <Pressable
                  onPress={() => void openLink(link.url)}
                  style={({ pressed }) => [styles.linkText, pressed && styles.pressed]}>
                  <ThemedText type="linkPrimary" numberOfLines={2}>
                    {link.url}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void removeLink(link.id);
                  }}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Удалить
                  </ThemedText>
                </Pressable>
              </ThemedView>
            ))}
            <TextInput
              value={linkDraft}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://..."
              placeholderTextColor={theme.textSecondary}
              onChangeText={setLinkDraft}
              onSubmitEditing={() => {
                void addLink();
              }}
              style={[
                styles.linkInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
            />
            <ActionButton label="Добавить ссылку" onPress={() => void addLink()} />
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundSelected" style={[styles.action, { backgroundColor: theme.accentSoft }]}>
        <ThemedText type="smallBold" style={{ color: theme.accent }}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  padded: {
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    gap: Spacing.one,
  },
  subject: {
    fontSize: 28,
    lineHeight: 34,
  },
  block: {
    gap: Spacing.two,
  },
  input: {
    minHeight: 120,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 16,
    lineHeight: 22,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  photoWrap: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  photo: {
    width: 92,
    height: 92,
    borderRadius: Spacing.two,
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  action: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.two,
  },
  linkText: {
    flex: 1,
  },
  linkInput: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
});
