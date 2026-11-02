import {
  Card,
  Column,
  HorizontalDivider,
  IconButton,
  Row,
  Spacer,
  Text,
} from '@expo/ui/jetpack-compose';
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

const ACCENT = '#1B6B4A';
const ACCENT_SOFT = '#D8EFE4';
const TEXT = '#1B1B1F';
const TEXT_SECONDARY = '#60646C';
const SURFACE = '#FFFFFF';
const DIVIDER = '#E0E1E6';

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
      place: current.place,
      highlight: true,
    };
  }
  if (next) {
    const beforeFirst = today.length > 0 && nowMinutes < toMinutes(today[0].start);
    return {
      badge: beforeFirst ? 'Скоро' : 'Перемена',
      title: next.title,
      meta: `Дальше ${next.start}`,
      place: next.place,
      highlight: false,
    };
  }
  return {
    badge: today.length === 0 ? 'Сегодня' : 'Свободно',
    title: today.length === 0 ? 'Пар нет' : 'Пары закончились',
    meta: today.length === 0 ? 'Выходной или без занятий' : 'На сегодня всё',
    place: '',
    highlight: false,
  };
}

function TomorrowRow({ lesson }: { lesson: WidgetLesson }) {
  return (
    <Row modifiers={[fillMaxWidth(), padding(0, 4, 0, 4)]}>
      <Column modifiers={[padding(0, 0, 10, 0)]}>
        <Text color={TEXT} style={{ fontSize: 13, fontWeight: '700' }}>
          {lesson.start}
        </Text>
        <Text color={TEXT_SECONDARY} style={{ fontSize: 11 }}>
          {lesson.end}
        </Text>
      </Column>
      <Column modifiers={[fillMaxWidth()]}>
        <Text color={TEXT} maxLines={2} style={{ fontSize: 13, fontWeight: '600', lineHeight: 18 }}>
          {lesson.title}
        </Text>
      </Column>
    </Row>
  );
}

const ScheduleWidget = (props: ScheduleWidgetProps) => {
  'widget';
  const nowState = resolveNowState(props.today);
  const tomorrow = props.tomorrow.slice(0, 3);

  return (
    <Column
      modifiers={[
        fillMaxSize(),
        background(SURFACE),
        paddingAll(14),
        cornerRadius(24),
      ]}>
      <Row modifiers={[fillMaxWidth(), padding(0, 0, 0, 8)]}>
        <Column modifiers={[fillMaxWidth()]}>
          <Text color={ACCENT} style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.3 }}>
            Edu Focus
          </Text>
          <Text color={TEXT} style={{ fontSize: 14, fontWeight: '600' }}>
            {props.todayLabel}
          </Text>
          <Text color={TEXT_SECONDARY} style={{ fontSize: 11 }}>
            {props.weekLabel}
          </Text>
        </Column>
        <IconButton
          onClick={() => ({ ...props, updatedAt: Date.now() })}
          colors={{ contentColor: ACCENT }}>
          <Text color={ACCENT} style={{ fontSize: 18, fontWeight: '700' }}>
            ↻
          </Text>
        </IconButton>
      </Row>

      <Card
        colors={{ containerColor: nowState.highlight ? ACCENT_SOFT : SURFACE }}
        border={nowState.highlight ? undefined : { width: 1, color: DIVIDER }}
        modifiers={[fillMaxWidth(), padding(0, 0, 10, 0), cornerRadius(16)]}>
        <Column modifiers={[paddingAll(12)]}>
          <Text
            color={ACCENT}
            style={{
              fontSize: 11,
              fontWeight: '700',
              background: nowState.highlight ? SURFACE : ACCENT_SOFT,
            }}>
            {`  ${nowState.badge}  `}
          </Text>
          <Text color={TEXT} maxLines={2} style={{ fontSize: 15, fontWeight: '700', lineHeight: 20 }}>
            {nowState.title}
          </Text>
          <Text color={TEXT_SECONDARY} style={{ fontSize: 12 }}>
            {nowState.meta}
          </Text>
          {nowState.place ? (
            <Text color={TEXT_SECONDARY} maxLines={1} style={{ fontSize: 11 }}>
              {nowState.place}
            </Text>
          ) : null}
        </Column>
      </Card>

      <HorizontalDivider thickness={1} color={DIVIDER} modifiers={[padding(0, 0, 8, 0)]} />

      <Text color={TEXT} style={{ fontSize: 13, fontWeight: '700' }}>
        {props.tomorrowLabel}
      </Text>

      {tomorrow.length === 0 ? (
        <Text color={TEXT_SECONDARY} style={{ fontSize: 12 }}>
          Завтра пар нет
        </Text>
      ) : (
        tomorrow.map((lesson) => (
          <TomorrowRow key={`${lesson.start}-${lesson.title}`} lesson={lesson} />
        ))
      )}

      <Spacer />
    </Column>
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
