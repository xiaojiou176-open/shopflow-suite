import type { LiveReceiptPlanStatus } from '@shopflow/contracts';

export function getEvidenceSectionHref(status: LiveReceiptPlanStatus) {
  switch (status) {
    case 'missing-live-receipt':
    case 'capture-in-progress':
      return '#live-receipt-evidence';
    case 'captured':
    case 'reviewed':
    case 'rejected':
    case 'expired':
      return '#live-receipt-review';
  }
}
