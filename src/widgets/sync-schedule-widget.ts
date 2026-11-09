import { Platform } from 'react-native';

import { buildWidgetProps } from '@/features/schedule/lib/schedule';
import ScheduleWidget from '@/widgets/ScheduleWidget';

export function syncScheduleWidget(now = new Date()) {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    ScheduleWidget.updateSnapshot(buildWidgetProps(now));
  } catch {
    // Widget native module is only available in a development/production build.
  }
}
