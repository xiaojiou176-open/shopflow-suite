import { describe, expect, it } from 'vitest';
import { providerRuntimeSeam, providerRuntimeSeamSchema } from '../../packages/contracts/src/provider-runtime-seam';
import {
  createSwitchyardBridge,
  isSwitchyardBridgeEnabled,
} from '../../packages/core/src/provider-runtime-bridge';
import {
  createProviderRuntimeConsumer,
  createProviderRuntimeConsumerSnapshot,
} from '../../packages/core/src';

describe('provider runtime bridge', () => {
  it('keeps the Switchyard seam contract read-only and explicit', () => {
    const seam = providerRuntimeSeamSchema.parse(providerRuntimeSeam);

    expect(seam.readOnly).toBe(true);
    expect(seam.runtimeId).toBe('switchyard');
    expect(seam.shopflowOwns).toContain(
      'storefront truth, verified-scope wording, and claim boundaries'
    );
    expect(seam.noGo).toContain(
      'Switchyard must not be treated as merchant live-evidence proof.'
    );
  });

  it('builds acquisition routes without inventing a provider runtime inside Shopflow', () => {
    const bridge = createSwitchyardBridge({
      baseUrl: 'http://127.0.0.1:4317/',
    });

    expect(bridge.baseUrl).toBe('http://127.0.0.1:4317');
    expect(bridge.routes.startAcquisition('chatgpt')).toBe(
      'http://127.0.0.1:4317/v1/runtime/providers/chatgpt/acquisition/start'
    );
    expect(bridge.routes.captureAcquisition('gemini')).toBe(
      'http://127.0.0.1:4317/v1/runtime/providers/gemini/acquisition/capture'
    );
  });

  it('treats an empty base URL as disabled', () => {
    expect(isSwitchyardBridgeEnabled(undefined)).toBe(false);
    expect(isSwitchyardBridgeEnabled('')).toBe(false);
    expect(isSwitchyardBridgeEnabled('http://127.0.0.1:4317')).toBe(true);
  });

  it('builds a thin runtime consumer snapshot without overclaiming runtime ownership', () => {
    const snapshot = createProviderRuntimeConsumer({
      baseUrl: 'http://127.0.0.1:4317/',
    });

    expect(snapshot.enabled).toBe(true);
    expect(snapshot.baseUrl).toBe('http://127.0.0.1:4317');
    expect(snapshot.routes.find((route) => route.providerId === 'chatgpt'))
      .toMatchObject({
        startAcquisitionUrl:
          'http://127.0.0.1:4317/v1/runtime/providers/chatgpt/acquisition/start',
      });
    expect(snapshot.noGo).toContain(
      'Switchyard must not be treated as merchant live-evidence proof.'
    );
  });

  it('keeps the thin runtime consumer disabled until a base URL exists', () => {
    const snapshot = createProviderRuntimeConsumerSnapshot({
      baseUrl: '',
    });

    expect(snapshot.enabled).toBe(false);
    expect(snapshot.routes).toEqual([]);
    expect(snapshot.nextStep).toContain('SHOPFLOW_SWITCHYARD_BASE_URL');
  });
});
