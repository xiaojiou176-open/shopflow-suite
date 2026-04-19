import { describe, expect, it } from 'vitest';
import {
  parseNativeReviewArgs,
  renderNativeReviewHelp,
} from '../../tooling/verification/open-native-extension-review';

describe('native extension review tooling', () => {
  it('defaults to Albertsons, english, and the canonical debug port', () => {
    const parsed = parseNativeReviewArgs([]);

    if ('help' in parsed) {
      throw new Error('Expected review options, received help output.');
    }

    expect(parsed.appId).toBe('ext-albertsons');
    expect(parsed.locale).toBe('en');
    expect(parsed.port).toBe(9336);
    expect(parsed.userDataDirRoot).toContain('.runtime-cache/native-extension-review');
  });

  it('accepts app, locale, and port overrides', () => {
    const parsed = parseNativeReviewArgs([
      '--app',
      'ext-shopping-suite',
      '--locale',
      'zh-CN',
      '--port',
      '9444',
    ]);

    if ('help' in parsed) {
      throw new Error('Expected review options, received help output.');
    }

    expect(parsed.appId).toBe('ext-shopping-suite');
    expect(parsed.locale).toBe('zh-CN');
    expect(parsed.port).toBe(9444);
  });

  it('renders help text with native Chrome and isolation guarantees', () => {
    const help = renderNativeReviewHelp();

    expect(help).toContain('Shopflow native Chrome extension review');
    expect(help).toContain('pnpm review:native-ui');
    expect(help).toContain('temporary native Google Chrome profile');
    expect(help).toContain('no writes to your default Chrome root');
  });
});
