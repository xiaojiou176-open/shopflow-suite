import { describe, expect, it } from 'vitest';
import {
  buildUiSurfaceCapturePlan,
  parseUiSurfaceCaptureArgs,
  renderUiSurfaceCaptureHelp,
} from '../../tooling/verification/capture-ui-surfaces';

describe('ui surface capture tooling', () => {
  it('defaults to the Albertsons popup, sidepanel, and Suite capture set', () => {
    const parsed = parseUiSurfaceCaptureArgs([]);

    if ('help' in parsed) {
      throw new Error('Expected capture options, received help output.');
    }

    expect(parsed.appId).toBe('ext-albertsons');
    expect(parsed.locale).toBe('en');

    const plan = buildUiSurfaceCapturePlan(parsed);
    expect(plan.map((entry) => entry.surface)).toEqual([
      'popup',
      'sidepanel',
      'suite',
    ]);
    expect(plan[0]?.fileName).toBe('ext-albertsons.popup.en.png');
    expect(plan[1]?.fileName).toBe('ext-albertsons.sidepanel.en.png');
    expect(plan[2]?.fileName).toBe('ext-shopping-suite.sidepanel.en.png');
  });

  it('renders help text with the command boundary and output contract', () => {
    const help = renderUiSurfaceCaptureHelp();

    expect(help).toContain('Shopflow UI surface capture');
    expect(help).toContain('pnpm capture:ui-surfaces');
    expect(help).toContain('headless Playwright only');
    expect(help).toContain('ui-surface-capture-manifest-latest.json');
  });

  it('accepts app, locale, and output overrides', () => {
    const parsed = parseUiSurfaceCaptureArgs([
      '--app',
      'ext-kroger',
      '--locale',
      'zh-CN',
      '--output',
      '.runtime-cache/custom-ui-captures',
    ]);

    if ('help' in parsed) {
      throw new Error('Expected capture options, received help output.');
    }

    expect(parsed.appId).toBe('ext-kroger');
    expect(parsed.locale).toBe('zh-CN');
    expect(parsed.outputRoot).toContain('.runtime-cache/custom-ui-captures');

    const plan = buildUiSurfaceCapturePlan(parsed);
    expect(plan[0]?.fileName).toBe('ext-kroger.popup.zh-CN.png');
    expect(plan[1]?.fileName).toBe('ext-kroger.sidepanel.zh-CN.png');
    expect(plan[2]?.latestAliasPath).toContain(
      'ext-shopping-suite.sidepanel.latest.png'
    );
  });
});
