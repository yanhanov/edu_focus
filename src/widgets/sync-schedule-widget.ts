import { Platform } from 'react-native';

import { buildWidgetProps } from '@/features/schedule/lib/schedule';

type WidgetUpdater = {
  updateSnapshot: (props: ReturnType<typeof buildWidgetProps>) => void;
};

let widgetUpdater: Promise<WidgetUpdater | null> | undefined;

async function loadWidgetUpdater(): Promise<WidgetUpdater | null> {
  try {
    const { default: ScheduleWidget } = await import('@/widgets/ScheduleWidget');
    return ScheduleWidget;
  } catch {
    return null;
  }
}

function getWidgetUpdater(): Promise<WidgetUpdater | null> {
  if (!widgetUpdater) {
    widgetUpdater = loadWidgetUpdater();
  }
  return widgetUpdater;
}

export function syncScheduleWidget(now = new Date()) {
  if (Platform.OS === 'web') {
    return;
  }

  void getWidgetUpdater().then((updater) => {
    if (!updater) {
      return;
    }
    try {
      updater.updateSnapshot(buildWidgetProps(now));
    } catch {
      // Native widget module missing or snapshot rejected.
    }
  });
}