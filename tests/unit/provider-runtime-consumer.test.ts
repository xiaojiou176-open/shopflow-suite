import { describe, expect, it } from 'vitest';
import { createProviderRuntimeConsumerSnapshot } from '../../packages/core/src/provider-runtime-consumer';

describe('provider runtime consumer snapshot', () => {
  it('stays disabled until a Switchyard base URL is provided', () => {
    const snapshot = createProviderRuntimeConsumerSnapshot({});

    expect(snapshot).toMatchObject({
      surfaceId: 'provider-runtime-consumer',
      schemaVersion: 'shopflow.provider-runtime-consumer.v1',
      readOnly: true,
      runtimeId: 'switchyard',
      enabled: false,
      routes: [],
    });
    expect(snapshot.nextStep).toContain('SHOPFLOW_SWITCHYARD_BASE_URL');
  });

  it('emits thin consumer routes once a base URL is available', () => {
    const snapshot = createProviderRuntimeConsumerSnapshot({
      baseUrl: 'http://127.0.0.1:4317/',
    });

    expect(snapshot.enabled).toBe(true);
    expect(snapshot.baseUrl).toBe('http://127.0.0.1:4317');
    expect(snapshot.routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          providerId: 'chatgpt',
          startAcquisitionUrl:
            'http://127.0.0.1:4317/v1/runtime/providers/chatgpt/acquisition/start',
          captureAcquisitionUrl:
            'http://127.0.0.1:4317/v1/runtime/providers/chatgpt/acquisition/capture',
        }),
        expect.objectContaining({
          providerId: 'gemini',
        }),
      ])
    );
    expect(snapshot.noGo).toContain(
      'Switchyard must not be treated as merchant live-evidence proof.'
    );
  });
});
