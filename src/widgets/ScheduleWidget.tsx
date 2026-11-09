import { Text, VStack } from '@expo/ui/swift-ui';
import { background, cornerRadius, font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

import type { ScheduleWidgetProps, WidgetLesson } from '@/features/schedule/lib/schedule';

const ACCENT = '#1B6B4A';
const ACCENT_SOFT = '#D8EFE4';
const TEXT = '#1B1B1F';
const TEXT_SECONDARY = '#60646C';

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function resolveNowState(today: WidgetLesson[]) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const current = today.find(
    (lesson) => toMinutes(lesson.start) <= nowMinutes && nowMinutes < toMinutes(lesson.end)
  );
  const next = today.find((lesson) => toMinutes(lesson.start) > nowMinutes);

  if (current) {
    return {
      badge: 'Сейчас',
      title: current.title,
      meta: `${current.start}–${current.end}`,
    };
  }
  if (next) {
    return {
      badge: 'Дальше',
      title: next.title,
      meta: next.start,
    };
  }
  return {
    badge: 'Сегодня',
    title: today.length === 0 ? 'Пар нет' : 'Свободно',
    meta: today.length === 0 ? '—' : 'Пары закончились',
  };
}

const ScheduleWidget = (props: ScheduleWidgetProps) => {
  'widget';
  const nowState = resolveNowState(props.today);
  const tomorrow = props.tomorrow.slice(0, 3);

  return (
    <VStack alignment="leading" spacing={8} modifiers={[padding({ all: 14 })]}>
      <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(ACCENT)]}>Edu Focus</Text>
      <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundStyle(TEXT)]}>
        {props.todayLabel}
      </Text>
      <Text modifiers={[font({ size: 11 }), foregroundStyle(TEXT_SECONDARY)]}>{props.weekLabel}</Text>

      <VStack
        alignment="leading"
        spacing={4}
        modifiers={[padding({ all: 10 }), background(ACCENT_SOFT), cornerRadius(14)]}>
        <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle(ACCENT)]}>
          {nowState.badge}
        </Text>
        <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(TEXT)]}>{nowState.title}</Text>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(TEXT_SECONDARY)]}>{nowState.meta}</Text>
      </VStack>

      <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(TEXT)]}>
        {props.tomorrowLabel}
      </Text>
      {tomorrow.length === 0 ? (
        <Text modifiers={[font({ size: 12 }), foregroundStyle(TEXT_SECONDARY)]}>Завтра пар нет</Text>
      ) : (
        tomorrow.map((lesson) => (
          <Text
            key={`${lesson.start}-${lesson.title}`}
            modifiers={[font({ size: 12 }), foregroundStyle(TEXT_SECONDARY)]}>
            {`${lesson.start}  ${lesson.title}`}
          </Text>
        ))
      )}
    </VStack>
  );
};

export default createWidget<ScheduleWidgetProps>('ScheduleWidget', ScheduleWidget, {
  weekLabel: '11701126 · I неделя',
  todayLabel: 'Пн, 1 ноября',
  tomorrowLabel: 'Завтра · Вт',
  today: [],
  tomorrow: [],
  updatedAt: 0,
});
