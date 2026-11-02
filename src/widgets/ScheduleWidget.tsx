import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

import type { ScheduleWidgetProps } from '@/lib/schedule';

const ScheduleWidget = (props: ScheduleWidgetProps) => {
  'widget';
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const current = props.today.find(
    (lesson) => toMinutes(lesson.start) <= nowMinutes && nowMinutes < toMinutes(lesson.end)
  );
  const next = props.today.find((lesson) => toMinutes(lesson.start) > nowMinutes);
  let nowTitle = 'Сейчас пар нет';
  let nowDetail = props.today.length === 0 ? 'Сегодня выходной или пар нет' : 'Пары закончились';
  if (current) {
    nowTitle = 'Сейчас';
    nowDetail = `${current.start}–${current.end}  ${current.title}`;
  } else if (next) {
    nowTitle = 'Дальше';
    nowDetail = `${next.start}  ${next.title}`;
  }

  return (
    <VStack alignment="leading" modifiers={[padding({ all: 12 })]}>
      <Text modifiers={[font({ size: 12 }), foregroundStyle('#6B7280')]}>{props.weekLabel}</Text>
      <Text modifiers={[font({ weight: 'bold', size: 16 })]}>{nowTitle}</Text>
      <Text modifiers={[font({ size: 13 })]}>{nowDetail}</Text>
      <Text modifiers={[font({ weight: 'bold', size: 14 })]}>{props.tomorrowLabel}</Text>
      <Text modifiers={[font({ size: 13 })]}>
        {props.tomorrow.length === 0
          ? 'Завтра пар нет'
          : props.tomorrow
              .slice(0, 3)
              .map((lesson) => `${lesson.start} ${lesson.title}`)
              .join('\n')}
      </Text>
    </VStack>
  );
};

export default createWidget<ScheduleWidgetProps>('ScheduleWidget', ScheduleWidget, {
  weekLabel: '11701126',
  todayLabel: 'Сегодня',
  tomorrowLabel: 'Завтра',
  today: [],
  tomorrow: [],
  updatedAt: 0,
});
