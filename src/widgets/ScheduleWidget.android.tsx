import { Button, Column, Row, Spacer, Text, getMaterialColors } from '@expo/ui/jetpack-compose';
import {
  background,
  cornerRadius,
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll,
} from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';

import type { ScheduleWidgetProps, WidgetLesson } from '@/lib/schedule';

const ScheduleWidget = (props: ScheduleWidgetProps) => {
  'widget';
  const colors = getMaterialColors();
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
    nowTitle = nowMinutes < toMinutes(props.today[0].start) ? 'Скоро' : 'Перемена';
    nowDetail = `${next.start}  ${next.title}`;
  }

  const tomorrow = props.tomorrow.slice(0, 4);

  return (
    <Column
      modifiers={[
        fillMaxSize(),
        background(colors.surface),
        paddingAll(12),
        cornerRadius(20),
      ]}>
      <Text color={colors.onSurfaceVariant}>{props.weekLabel}</Text>
      <Text color={colors.onSurface}>{nowTitle}</Text>
      <Text color={colors.onSurfaceVariant}>{nowDetail}</Text>
      {current ? <Text color={colors.onSurfaceVariant}>{current.place}</Text> : null}

      <Spacer />

      <Text color={colors.onSurface}>{props.tomorrowLabel}</Text>
      {tomorrow.length === 0 ? (
        <Text color={colors.onSurfaceVariant}>Завтра пар нет</Text>
      ) : (
        tomorrow.map((lesson: WidgetLesson) => (
          <Row key={`${lesson.start}-${lesson.title}`} modifiers={[fillMaxWidth(), padding(0, 2, 0, 0)]}>
            <Text color={colors.onSurfaceVariant}>{`${lesson.start}  ${lesson.title}`}</Text>
          </Row>
        ))
      )}

      <Spacer />

      <Button
        onClick={() => ({ ...props, updatedAt: Date.now() })}
        colors={{ containerColor: colors.primary, contentColor: colors.onPrimary }}
        contentPadding={{ start: 12, end: 12, top: 8, bottom: 8 }}
        modifiers={[cornerRadius(16)]}>
        <Text>Обновить</Text>
      </Button>
    </Column>
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
