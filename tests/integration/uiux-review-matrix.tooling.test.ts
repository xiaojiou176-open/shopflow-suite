import { describe, expect, it } from 'vitest';
import { buildUiuxReviewMatrix } from '../../tooling/verification/write-uiux-review-matrix';

describe('uiux review matrix tooling', () => {
  it('includes every 8+1 extension review surface plus public/external review lanes', () => {
    const matrix = buildUiuxReviewMatrix('/tmp/shopflow-uiux-review-matrix.json');

    expect(matrix.summary.extensionUiEntries).toBe(19);
    expect(matrix.summary.publicSurfaceEntries).toBe(5);
    expect(matrix.summary.externalReviewEntries).toBe(4);
    expect(matrix.entries.some((entry) => entry.id === 'ext-albertsons-popup-en')).toBe(true);
    expect(matrix.entries.some((entry) => entry.id === 'ext-shopping-suite-sidepanel-zh-CN')).toBe(true);
    expect(matrix.entries.some((entry) => entry.id === 'public-pages-lobby')).toBe(true);
    expect(matrix.entries.some((entry) => entry.id === 'external-gemini-pass')).toBe(true);
    expect(matrix.entries.some((entry) => entry.id === 'external-stitch-pass')).toBe(true);
  });
});
