import { albertsonsHostPatterns } from '@shopflow/store-albertsons';
import {
  createLiveReceiptAppRequirement,
  getLiveReceiptCapturePlans,
} from '@shopflow/contracts';

export const liveReceiptPlans = getLiveReceiptCapturePlans('ext-albertsons');

export const appDefinition = {
  appId: 'ext-albertsons',
  storeId: 'albertsons',
  siteName: 'Albertsons Family',
  title: 'Shopflow for Albertsons Family',
  summary:
    'Currently verified on Safeway. Actions stay gated until live receipts exist.',
  hostMatches: albertsonsHostPatterns,
  verifiedScopeCopy: 'Currently verified on Safeway.',
  requiredEvidence: liveReceiptPlans.map(createLiveReceiptAppRequirement),
} as const;
