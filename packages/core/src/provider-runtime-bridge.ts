import {
  providerRuntimeSeam,
  type ProviderRuntimeAcquisitionMode,
  type ProviderRuntimeProviderId,
} from '@shopflow/contracts';

export type SwitchyardBridgeConfig = {
  baseUrl: string;
};

export type SwitchyardBridge = {
  runtimeId: 'switchyard';
  baseUrl: string;
  supportedProviders: readonly ProviderRuntimeProviderId[];
  acquisitionModes: readonly ProviderRuntimeAcquisitionMode[];
  routes: {
    startAcquisition(providerId: ProviderRuntimeProviderId): string;
    captureAcquisition(providerId: ProviderRuntimeProviderId): string;
  };
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

export function createSwitchyardBridge(
  config: SwitchyardBridgeConfig
): SwitchyardBridge {
  const baseUrl = normalizeBaseUrl(config.baseUrl);

  return {
    runtimeId: 'switchyard',
    baseUrl,
    supportedProviders: providerRuntimeSeam.supportedProviders,
    acquisitionModes: providerRuntimeSeam.acquisitionModes,
    routes: {
      startAcquisition(providerId) {
        return `${baseUrl}${providerRuntimeSeam.routePrefix}/${providerId}/acquisition/start`;
      },
      captureAcquisition(providerId) {
        return `${baseUrl}${providerRuntimeSeam.routePrefix}/${providerId}/acquisition/capture`;
      },
    },
  };
}

export function isSwitchyardBridgeEnabled(baseUrl?: string | null) {
  return Boolean(baseUrl && normalizeBaseUrl(baseUrl).length > 0);
}
