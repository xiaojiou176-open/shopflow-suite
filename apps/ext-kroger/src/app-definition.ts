import {
  KROGER_VERIFIED_SCOPE_COPY,
  krogerHostPatterns,
} from '@shopflow/store-kroger';
import {
  createLiveReceiptAppRequirement,
  getLiveReceiptCapturePlans,
} from '@shopflow/contracts';

export const liveReceiptPlans = getLiveReceiptCapturePlans('ext-kroger');

export const appDefinition = {
  appId: 'ext-kroger',
  storeId: 'kroger',
  siteName: 'Fred Meyer + QFC',
  title: 'Shopflow for Kroger Family',
  summary:
    'Currently verified on Fred Meyer + QFC. Family wording stays evidence-bound until both named scopes have reviewed live receipts.',
  hostMatches: [...krogerHostPatterns],
  verifiedScopeCopy: KROGER_VERIFIED_SCOPE_COPY,
  requiredEvidence: liveReceiptPlans.map(createLiveReceiptAppRequirement),
} as const;
