import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import type { GroupId } from '@/data/groups';
import { fetchBntuScheduleLink, type BntuScheduleLink } from '@/lib/bntu-html';
import { extractPdfText, isLikelyScannedPdfText } from '@/lib/bntu-pdf-extract';
import { buildOverrideFromJsonText, buildOverrideFromPdfText } from '@/lib/bntu-pdf-parse';
import {
  clearScheduleOverride,
  saveScheduleOverride,
  type ScheduleOverride,
} from '@/lib/schedule-overrides';
import { syncScheduleWidget } from '@/widgets/sync-schedule-widget';

async function readPickerFile(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
}

async function readPickerBytes(uri: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function fetchPdfBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Не удалось скачать PDF (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function importScheduleFromJsonFile(groupId: GroupId): Promise<ScheduleOverride> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', 'text/plain'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) {
    throw new Error('Файл не выбран');
  }
  const asset = result.assets[0];
  const jsonText = await readPickerFile(asset.uri);
  const override = buildOverrideFromJsonText(jsonText, groupId, {
    sourceLabel: asset.name,
  });
  await saveScheduleOverride(override);
  syncScheduleWidget();
  return override;
}

export async function importScheduleFromPdfFile(groupId: GroupId): Promise<ScheduleOverride> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) {
    throw new Error('Файл не выбран');
  }
  const asset = result.assets[0];
  const bytes = await readPickerBytes(asset.uri);
  const text = await extractPdfText(bytes);
  if (isLikelyScannedPdfText(text)) {
    throw new Error(
      'PDF без текстового слоя (скан). Сохраните JSON через scripts/parse_bntu_schedule.py или попросите обновление в репозитории.'
    );
  }
  const override = buildOverrideFromPdfText(text, groupId, {
    sourceLabel: asset.name,
  });
  await saveScheduleOverride(override);
  syncScheduleWidget();
  return override;
}

export async function importScheduleFromBntuSite(groupId: GroupId): Promise<{
  override?: ScheduleOverride;
  link: BntuScheduleLink;
  scannedPdf: boolean;
}> {
  const link = await fetchBntuScheduleLink(groupId);
  if (!link) {
    throw new Error('На странице МИДО не найдена ссылка на PDF для вашей группы');
  }

  const bytes = await fetchPdfBytes(link.url);
  const text = await extractPdfText(bytes);
  if (isLikelyScannedPdfText(text)) {
    return { link, scannedPdf: true };
  }

  const override = buildOverrideFromPdfText(text, groupId, {
    period: link.period ?? '',
    sourceUrl: link.url,
    sourceLabel: link.label,
  });
  await saveScheduleOverride(override);
  syncScheduleWidget();
  return { override, link, scannedPdf: false };
}

export async function importScheduleFromPdfUrl(groupId: GroupId, url: string): Promise<ScheduleOverride> {
  const bytes = await fetchPdfBytes(url);
  const text = await extractPdfText(bytes);
  if (isLikelyScannedPdfText(text)) {
    throw new Error('PDF по ссылке без текстового слоя (скан). Нужен JSON-импорт.');
  }
  const override = buildOverrideFromPdfText(text, groupId, {
    sourceUrl: url,
  });
  await saveScheduleOverride(override);
  syncScheduleWidget();
  return override;
}

export async function resetScheduleToBundled(groupId: GroupId): Promise<void> {
  await clearScheduleOverride(groupId);
  syncScheduleWidget();
}
