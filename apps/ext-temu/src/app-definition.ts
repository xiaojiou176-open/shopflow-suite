import { temuHostPatterns } from '@shopflow/store-temu';
import {
  createLiveReceiptAppRequirement,
  getLiveReceiptCapturePlans,
} from '@shopflow/contracts';

export const liveReceiptPlans = getLiveReceiptCapturePlans('ext-temu');

export const appDefinition = {
  appId: 'ext-temu',
  storeId: 'temu',
  siteName: 'Temu',
  title: 'Shopflow for Temu',
  summary:
    'Wave 2 differentiated shell for product, search, and fixture-backed warehouse filtering that still needs live receipt evidence.',
  hostMatches: temuHostPatterns,
  requiredEvidence: liveReceiptPlans.map(createLiveReceiptAppRequirement),
} as const;
