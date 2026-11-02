import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Share, StyleSheet } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ProfileSection } from '@/components/profile/profile-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { GroupId } from '@/data/groups';
import { useScheduleSource } from '@/hooks/use-schedule-source';
import { useTheme } from '@/hooks/use-theme';
import { fetchBntuScheduleLink } from '@/lib/bntu-html';
import {
  importScheduleFromBntuSite,
  importScheduleFromJsonFile,
  importScheduleFromPdfFile,
  resetScheduleToBundled,
} from '@/lib/schedule-import';
import { buildScheduleExport } from '@/lib/schedule-overrides';

type Props = {
  groupId: GroupId;
};

export function ScheduleUpdateSection({ groupId }: Props) {
  const theme = useTheme();
  const { schedule, reload } = useScheduleSource(groupId);
  const [busy, setBusy] = useState<string | null>(null);
  const [remoteHint, setRemoteHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchBntuScheduleLink(groupId)
      .then((link) => {
        if (cancelled || !link) {
          return;
        }
        const sameUrl = schedule.sourceUrl && schedule.sourceUrl === link.url;
        const hint = sameUrl
          ? `На сайте БНТУ та же ссылка${link.updatedLabel ? ` · обновлено ${link.updatedLabel}` : ''}`
          : `На сайте БНТУ${link.updatedLabel ? ` обновлено ${link.updatedLabel}` : ''}: новый PDF`;
        setRemoteHint(hint);
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteHint(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [groupId, schedule.sourceUrl]);

  const run = async (label: string, task: () => Promise<void>) => {
    setBusy(label);
    try {
      await task();
      reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось обновить расписание';
      Alert.alert('Расписание', message);
    } finally {
      setBusy(null);
    }
  };

  const sourceLine =
    schedule.sourceKind === 'import'
      ? `Импорт · ${schedule.lessons.length} пар${schedule.period ? ` · ${schedule.period}` : ''}`
      : `Встроенное · ${schedule.lessons.length} пар${schedule.period ? ` · ${schedule.period}` : ''}`;

  return (
    <ProfileSection
      title="Расписание"
      subtitle="Обновление из PDF, JSON или страницы МИДО БНТУ">
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedView style={[styles.statusRow, { backgroundColor: theme.accentSoft }]}>
          <AppIcon ios="calendar.badge.clock" android="update" color={theme.accent} size={22} />
          <ThemedView style={styles.statusCopy}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              {sourceLine}
            </ThemedText>
            {schedule.sourceLabel ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                {schedule.sourceLabel}
              </ThemedText>
            ) : null}
            {remoteHint ? (
              <ThemedText type="small" themeColor="textSecondary">
                {remoteHint}
              </ThemedText>
            ) : null}
          </ThemedView>
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary">
          Официальный PDF БНТУ часто бывает сканом — тогда надёжнее импорт JSON (скрипт в проекте
          scripts/parse_bntu_schedule.py).
        </ThemedText>

        <ActionRow
          label="Проверить сайт БНТУ"
          icon={{ ios: 'globe', android: 'language' }}
          loading={busy === 'site'}
          onPress={() =>
            void run('site', async () => {
              const result = await importScheduleFromBntuSite(groupId);
              if (result.scannedPdf) {
                Alert.alert(
                  'Новый PDF на сайте',
                  `${result.link.label}\n\nФайл без текстового слоя. Откройте PDF или импортируйте JSON после разбора на компьютере.`,
                  [
                    { text: 'Открыть PDF', onPress: () => void Linking.openURL(result.link.url) },
                    { text: 'OK', style: 'cancel' },
                  ]
                );
                return;
              }
              Alert.alert('Готово', `Импортировано пар: ${result.override?.lessons.length ?? 0}`);
            })
          }
        />

        <ActionRow
          label="Импорт PDF с телефона"
          icon={{ ios: 'doc.fill', android: 'picture_as_pdf' }}
          loading={busy === 'pdf'}
          onPress={() =>
            void run('pdf', async () => {
              const override = await importScheduleFromPdfFile(groupId);
              Alert.alert('Готово', `Импортировано пар: ${override.lessons.length}`);
            })
          }
        />

        <ActionRow
          label="Импорт JSON"
          icon={{ ios: 'curlybraces', android: 'data_object' }}
          loading={busy === 'json'}
          onPress={() =>
            void run('json', async () => {
              const override = await importScheduleFromJsonFile(groupId);
              Alert.alert('Готово', `Импортировано пар: ${override.lessons.length}`);
            })
          }
        />

        <ActionRow
          label="Экспорт JSON"
          icon={{ ios: 'square.and.arrow.up', android: 'ios_share' }}
          loading={busy === 'export'}
          onPress={() =>
            void run('export', async () => {
              const payload = JSON.stringify(buildScheduleExport(groupId), null, 2);
              await Share.share({ message: payload, title: `schedule-${groupId}.json` });
            })
          }
        />

        {schedule.sourceKind === 'import' ? (
          <ActionRow
            label="Вернуть встроенное расписание"
            icon={{ ios: 'arrow.counterclockwise', android: 'history' }}
            loading={busy === 'reset'}
            destructive
            onPress={() =>
              void run('reset', async () => {
                await resetScheduleToBundled(groupId);
                Alert.alert('Готово', 'Снова используется встроенное расписание');
              })
            }
          />
        ) : null}

        {schedule.sourceUrl ? (
          <Pressable
            onPress={() => void Linking.openURL(schedule.sourceUrl ?? '')}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedText type="small" style={{ color: theme.accent }}>
              Открыть PDF на сайте БНТУ
            </ThemedText>
          </Pressable>
        ) : null}
      </ThemedView>
    </ProfileSection>
  );
}

function ActionRow({
  label,
  icon,
  loading,
  destructive,
  onPress,
}: {
  label: string;
  icon: { ios: string; android: string };
  loading?: boolean;
  destructive?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} disabled={loading} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView style={styles.actionRow}>
        <AppIcon
          ios={icon.ios}
          android={icon.android}
          color={destructive ? '#C0392B' : theme.accent}
          size={18}
        />
        <ThemedText type="smallBold" style={destructive ? { color: '#C0392B' } : undefined}>
          {label}
        </ThemedText>
        {loading ? <ActivityIndicator size="small" color={theme.accent} /> : null}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  statusCopy: {
    flex: 1,
    gap: Spacing.one,
    backgroundColor: 'transparent',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.7,
  },
});
