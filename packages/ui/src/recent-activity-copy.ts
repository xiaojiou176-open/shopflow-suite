import type { ActivityItem } from '@shopflow/runtime';
import {
  formatRecentActivityLabel,
  formatRecentActivitySummary,
  formatRecentActivityTimestamp,
  type UiLocale,
} from '../../core/src/ui-locale';

export function localizeRecentActivities(
  items: ActivityItem[],
  locale: UiLocale = 'en'
) {
  return items.map((item) => {
    return {
      ...item,
      label: formatRecentActivityLabel(item, locale),
      summary: formatRecentActivitySummary(item, locale),
      timestampLabel: formatRecentActivityTimestamp(item, locale) ?? '',
    };
  });
}
