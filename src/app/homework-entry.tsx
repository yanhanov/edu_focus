import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeworkStatusChip } from '@/components/homework/homework-status-chip';
import { AppIcon } from '@/components/app-icon';
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
} from '@/lib/schedule';

function parseDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function HomeworkEntryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lessonId?: string; date?: string }>();
  const lessonId = typeof params.lessonId === 'string' ? params.lessonId : '';
  const date = typeof params.date === 'string' ? params.date : '';
  const lesson = getLessonById(lessonId);

  const [entry, setEntry] = useState<HomeworkEntry>({
    lessonId,
    date,
    text: '',
    photos: [],
    links: [],
    done: false,
    updatedAt: 0,
  });
  const [linkDraft, setLinkDraft] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveLabel, setSaveLabel] = useState('Черновик');
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
        setSaveLabel('Сохранено');
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
      void saveHomework(entry).then(() => setSaveLabel('Сохранено'));
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
    setSaveLabel('Сохранено');
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
    setLinkOpen(false);
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

  const closeLinkComposer = useCallback(() => {
    setLinkOpen(false);
    setLinkDraft('');
    Keyboard.dismiss();
  }, []);

  if (!lesson || !date) {
    return (
      <ThemedView style={[styles.screen, { paddingTop: insets.top + Spacing.three }]}>
        <ThemedText style={styles.padded}>Пара не найдена</ThemedText>
      </ThemedView>
    );
  }

  const lessonDate = parseDate(date);
  const typeLabel = lesson.type === 'pe' ? 'Физкультура' : LESSON_TYPE_LABELS[lesson.type];

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
          <ThemedView style={styles.topCenter}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {lesson.subject}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {formatDate(lessonDate)} · {lesson.start}–{lesson.end} · {typeLabel}
            </ThemedText>
          </ThemedView>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Готово
            </ThemedText>
          </Pressable>
        </ThemedView>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.five },
          ]}>
          <ThemedView style={styles.statusRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Статус
            </ThemedText>
            <HomeworkStatusChip
              status={entry.done ? 'done' : 'todo'}
              onToggle={() => {
                setSaveLabel('Сохранение…');
                setEntry({ ...entry, done: !entry.done });
              }}
            />
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.composer}>
            <TextInput
              value={entry.text}
              editable={loaded}
              multiline
              textAlignVertical="top"
              placeholder="Что задали: номера, страницы, дедлайн…"
              placeholderTextColor={theme.textSecondary}
              onChangeText={(text) => {
                setSaveLabel('Сохранение…');
                setEntry({ ...entry, text });
              }}
              onBlur={() => {
                void persist(entry);
              }}
              style={[styles.input, { color: theme.text }]}
            />

            {entry.photos.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoRow}>
                {entry.photos.map((photo) => (
                  <ThemedView key={photo.id} style={styles.photoWrap}>
                    <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
                    <Pressable
                      onPress={() => {
                        void removePhoto(photo.id);
                      }}
                      style={[styles.photoRemove, { backgroundColor: theme.background }]}>
                      <AppIcon ios="xmark" android="close" color={theme.text} size={12} />
                    </Pressable>
                  </ThemedView>
                ))}
              </ScrollView>
            ) : null}

            {entry.links.map((link) => (
              <ThemedView key={link.id} type="backgroundSelected" style={styles.linkRow}>
                <Pressable
                  onPress={() => void openLink(link.url)}
                  style={({ pressed }) => [styles.linkBody, pressed && styles.pressed]}>
                  <AppIcon ios="link" android="link" color={theme.accent} size={16} />
                  <ThemedView style={styles.linkCopy}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {linkHost(link.url)}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {link.url}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void removeLink(link.id);
                  }}
                  hitSlop={8}>
                  <AppIcon ios="xmark" android="close" color={theme.textSecondary} size={14} />
                </Pressable>
              </ThemedView>
            ))}
          </ThemedView>

          <ThemedText type="small" themeColor="textSecondary" style={styles.saveHint}>
            {saveLabel}
          </ThemedText>
        </ScrollView>

        <ThemedView
          style={[
            styles.toolbar,
            {
              paddingBottom: insets.bottom + Spacing.two,
              borderTopColor: theme.backgroundElement,
            },
          ]}>
          {linkOpen ? (
            <ThemedView style={styles.linkComposer}>
              <TextInput
                value={linkDraft}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="Вставьте ссылку"
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
              <Pressable
                onPress={() => void addLink()}
                style={({ pressed }) => [
                  styles.linkAdd,
                  { backgroundColor: theme.accent },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: theme.background }}>
                  Ок
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={closeLinkComposer}
                hitSlop={8}
                style={({ pressed }) => [styles.linkCancel, pressed && styles.pressed]}>
                <AppIcon ios="xmark" android="close" color={theme.textSecondary} size={20} />
              </Pressable>
            </ThemedView>
          ) : (
            <ThemedView style={styles.tools}>
              <ToolButton
                ios="camera.fill"
                android="photo_camera"
                label="Камера"
                onPress={() => void takePhoto()}
              />
              <ToolButton
                ios="photo.on.rectangle"
                android="photo_library"
                label="Фото"
                onPress={() => void pickFromLibrary()}
              />
              <ToolButton
                ios="link"
                android="link"
                label="Ссылка"
                onPress={() => setLinkOpen(true)}
              />
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function ToolButton({
  ios,
  android,
  label,
  onPress,
}: {
  ios: string;
  android: string;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tool, pressed && styles.pressed]}>
      <ThemedView style={[styles.toolIcon, { backgroundColor: theme.accentSoft }]}>
        <AppIcon ios={ios} android={android} color={theme.accent} size={20} />
      </ThemedView>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
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
  padded: {
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  doneButton: {
    paddingHorizontal: Spacing.two,
    height: 44,
    justifyContent: 'center',
  },
  content: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  composer: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  input: {
    minHeight: 180,
    fontSize: 17,
    lineHeight: 24,
    padding: 0,
  },
  photoRow: {
    gap: Spacing.two,
  },
  photoWrap: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: Spacing.two,
  },
  photoRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.two,
  },
  linkBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  linkCopy: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  saveHint: {
    paddingHorizontal: Spacing.one,
  },
  toolbar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  tools: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
  },
  tool: {
    alignItems: 'center',
    gap: Spacing.one,
    minWidth: 88,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  linkCancel: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkInput: {
    flex: 1,
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  linkAdd: {
    height: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
