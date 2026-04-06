import { describe, expect, it } from 'vitest';
import { getEvidenceSectionHref } from '../../packages/ui/src/evidence-section-routing';

describe('runtime evidence section routing', () => {
  it('routes capture work into the evidence overview section', () => {
    expect(getEvidenceSectionHref('missing-live-receipt')).toBe(
      '#live-receipt-evidence'
    );
    expect(getEvidenceSectionHref('capture-in-progress')).toBe(
      '#live-receipt-evidence'
    );
  });

  it('routes review and review-outcome states into the review lane', () => {
    expect(getEvidenceSectionHref('captured')).toBe('#live-receipt-review');
    expect(getEvidenceSectionHref('reviewed')).toBe('#live-receipt-review');
    expect(getEvidenceSectionHref('rejected')).toBe('#live-receipt-review');
    expect(getEvidenceSectionHref('expired')).toBe('#live-receipt-review');
  });
});
