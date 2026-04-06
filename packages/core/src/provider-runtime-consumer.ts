import {
  providerRuntimeSeam,
  type ProviderRuntimeAcquisitionMode,
  type ProviderRuntimeProviderId,
} from '@shopflow/contracts';
import {
  createSwitchyardBridge,
  isSwitchyardBridgeEnabled,
} from './provider-runtime-bridge';

export type ProviderRuntimeConsumerRoute = {
  providerId: ProviderRuntimeProviderId;
  startAcquisitionUrl: string;
  captureAcquisitionUrl: string;
};

export type ProviderRuntimeConsumerSnapshot = {
  surfaceId: 'provider-runtime-consumer';
  schemaVersion: 'shopflow.provider-runtime-consumer.v1';
  readOnly: true;
  runtimeId: 'switchyard';
  enabled: boolean;
  baseUrl?: string;
  acquisitionModes: readonly ProviderRuntimeAcquisitionMode[];
  routes: ProviderRuntimeConsumerRoute[];
  shopflowOwns: readonly string[];
  runtimeOwns: readonly string[];
  noGo: readonly string[];
  nextStep: string;
};

export function createProviderRuntimeConsumerSnapshot(input: {
  baseUrl?: string | null;
}): ProviderRuntimeConsumerSnapshot {
  if (!isSwitchyardBridgeEnabled(input.baseUrl)) {
    return {
      surfaceId: 'provider-runtime-consumer',
      schemaVersion: 'shopflow.provider-runtime-consumer.v1',
      readOnly: true,
      runtimeId: 'switchyard',
      enabled: false,
      acquisitionModes: providerRuntimeSeam.acquisitionModes,
      routes: [],
      shopflowOwns: providerRuntimeSeam.shopflowOwns,
      runtimeOwns: providerRuntimeSeam.runtimeOwns,
      noGo: providerRuntimeSeam.noGo,
      nextStep:
        'Set SHOPFLOW_SWITCHYARD_BASE_URL or pass --base-url before consuming Switchyard acquisition routes through Shopflow.',
    };
  }

  const bridge = createSwitchyardBridge({
    baseUrl: input.baseUrl!,
  });

  return {
    surfaceId: 'provider-runtime-consumer',
    schemaVersion: 'shopflow.provider-runtime-consumer.v1',
    readOnly: true,
    runtimeId: bridge.runtimeId,
    enabled: true,
    baseUrl: bridge.baseUrl,
    acquisitionModes: bridge.acquisitionModes,
    routes: bridge.supportedProviders.map((providerId) => ({
      providerId,
      startAcquisitionUrl: bridge.routes.startAcquisition(providerId),
      captureAcquisitionUrl: bridge.routes.captureAcquisition(providerId),
    })),
    shopflowOwns: providerRuntimeSeam.shopflowOwns,
    runtimeOwns: providerRuntimeSeam.runtimeOwns,
    noGo: providerRuntimeSeam.noGo,
    nextStep:
      'Treat these URLs as a thin read-only consumer of the Switchyard seam, not as merchant live proof or a public runtime product.',
  };
}
