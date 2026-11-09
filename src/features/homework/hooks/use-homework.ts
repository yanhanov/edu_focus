import { useEffect, useState } from 'react';

import {
  homeworkCompletionStatus,
  loadHomeworkMap,
  subscribeHomework,
  type HomeworkEntry,
  type HomeworkMap,
} from '@/features/homework/lib/homework';

export function useHomeworkMap(): HomeworkMap {
  const [map, setMap] = useState<HomeworkMap>({});

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const next = await loadHomeworkMap();
      if (!cancelled) {
        setMap(next);
      }
    };

    void refresh();
    const unsubscribe = subscribeHomework(() => {
      void refresh();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return map;
}

export function homeworkSummary(entry: HomeworkEntry | undefined) {
  if (!entry) {
    return {
      text: '',
      photoCount: 0,
      linkCount: 0,
      hasContent: false,
      status: 'none' as const,
      done: false,
    };
  }
  const text = entry.text.trim();
  const status = homeworkCompletionStatus(entry);
  return {
    text,
    photoCount: entry.photos.length,
    linkCount: entry.links.length,
    hasContent: status !== 'none',
    status,
    done: status === 'done',
  };
}
