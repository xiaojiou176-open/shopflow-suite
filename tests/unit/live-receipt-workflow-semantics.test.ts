import { describe, expect, it } from 'vitest';
import {
  assertValidLiveReceiptTransition,
  getLiveReceiptAppRequirements,
  getLiveReceiptNextStep,
  getLiveReceiptOperatorPath,
  getLiveReceiptOperatorStage,
  getLiveReceiptOperatorHint,
  getLiveReceiptPacketSummary,
} from '@shopflow/contracts';

describe('live receipt workflow semantics', () => {
  it('describes operator packets and next steps without collapsing captured into reviewed', () => {
    const requirement = getLiveReceiptAppRequirements('ext-albertsons')[0]!;

    expect(getLiveReceiptPacketSummary(requirement)).toBe(
      '6 required artifacts · 4 operator steps'
    );
    expect(
      getLiveReceiptNextStep('missing-live-receipt', requirement)
    ).toContain('Reconfirm repo verification is green');
    expect(
      getLiveReceiptNextStep('capture-in-progress', requirement)
    ).toContain('Capture the screenshot');
    expect(getLiveReceiptNextStep('captured', requirement)).toContain(
      'explicit review pass'
    );
    expect(getLiveReceiptNextStep('reviewed', requirement)).toContain(
      'release decisioning'
    );
  });

  it('keeps reviewed packets quiet but keeps rejected packets actionable', () => {
    const requirement = getLiveReceiptAppRequirements('ext-temu')[0]!;

    expect(getLiveReceiptOperatorHint(requirement)).toContain(
      'Reconfirm repo verification is green'
    );
    expect(
      getLiveReceiptOperatorHint(requirement, { status: 'reviewed' })
    ).toBeUndefined();
    expect(
      getLiveReceiptOperatorHint(requirement, {
        status: 'rejected',
        reviewNotes: 'Screenshot was stale. Re-capture on a fresh search page.',
      })
    ).toContain('Screenshot was stale');
  });

  it('maps review states into operator stages without collapsing the queue', () => {
    expect(getLiveReceiptOperatorStage('missing-live-receipt')).toBe(
      'needs-capture'
    );
    expect(getLiveReceiptOperatorStage('capture-in-progress')).toBe(
      'capture-in-progress'
    );
    expect(getLiveReceiptOperatorStage('captured')).toBe('waiting-review');
    expect(getLiveReceiptOperatorStage('reviewed')).toBe('reviewed');
    expect(getLiveReceiptOperatorStage('rejected')).toBe('needs-capture');
    expect(getLiveReceiptOperatorStage('expired')).toBe('needs-capture');
  });

  it('maps raw statuses into operator paths that are better suited for triage', () => {
    expect(getLiveReceiptOperatorPath('missing-live-receipt')).toBe('capture');
    expect(getLiveReceiptOperatorPath('capture-in-progress')).toBe(
      'finish-capture'
    );
    expect(getLiveReceiptOperatorPath('captured')).toBe('review');
    expect(getLiveReceiptOperatorPath('rejected')).toBe('recapture');
    expect(getLiveReceiptOperatorPath('expired')).toBe('recapture');
    expect(getLiveReceiptOperatorPath('reviewed')).toBe('complete');
  });

  it('rejects transitions that skip the captured review queue', () => {
    expect(() =>
      assertValidLiveReceiptTransition('capture-in-progress', 'reviewed')
    ).toThrow(/Captured evidence must still pass explicit review/i);

    expect(() =>
      assertValidLiveReceiptTransition('captured', 'reviewed')
    ).not.toThrow();
  });
});
