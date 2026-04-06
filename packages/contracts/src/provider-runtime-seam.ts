import { z } from 'zod';

export const externalProviderRuntimeIdValues = ['switchyard'] as const;
export const providerRuntimeAcquisitionModeValues = [
  'managed-browser',
  'existing-chrome-profile',
  'existing-browser-session',
] as const;
export const providerRuntimeProviderIdValues = [
  'chatgpt',
  'gemini',
  'claude',
  'grok',
  'qwen',
] as const;

export type ExternalProviderRuntimeId =
  (typeof externalProviderRuntimeIdValues)[number];
export type ProviderRuntimeAcquisitionMode =
  (typeof providerRuntimeAcquisitionModeValues)[number];
export type ProviderRuntimeProviderId =
  (typeof providerRuntimeProviderIdValues)[number];

export const providerRuntimeSeamSchema = z.object({
  surfaceId: z.literal('provider-runtime-seam'),
  schemaVersion: z.literal('shopflow.provider-runtime-seam.v1'),
  readOnly: z.literal(true),
  runtimeId: z.enum(externalProviderRuntimeIdValues),
  routePrefix: z.literal('/v1/runtime/providers'),
  supportedProviders: z
    .array(z.enum(providerRuntimeProviderIdValues))
    .min(3),
  acquisitionModes: z
    .array(z.enum(providerRuntimeAcquisitionModeValues))
    .min(1),
  shopflowOwns: z.array(z.string().min(1)).min(3),
  runtimeOwns: z.array(z.string().min(1)).min(3),
  noGo: z.array(z.string().min(1)).min(2),
});

export type ProviderRuntimeSeam = z.infer<typeof providerRuntimeSeamSchema>;

export const providerRuntimeSeam = providerRuntimeSeamSchema.parse({
  surfaceId: 'provider-runtime-seam',
  schemaVersion: 'shopflow.provider-runtime-seam.v1',
  readOnly: true,
  runtimeId: 'switchyard',
  routePrefix: '/v1/runtime/providers',
  supportedProviders: ['chatgpt', 'gemini', 'claude', 'grok', 'qwen'],
  acquisitionModes: [
    'managed-browser',
    'existing-chrome-profile',
    'existing-browser-session',
  ],
  shopflowOwns: [
    'storefront truth, verified-scope wording, and claim boundaries',
    'operator workflow, evidence ledger semantics, and reviewed-packet discipline',
    'builder read models, workflow briefs, and release-readiness reporting',
  ],
  runtimeOwns: [
    'BYOK and web-login acquisition',
    'auth/session handling and provider routing',
    'service-first provider runtime substrate',
  ],
  noGo: [
    'Switchyard must not be treated as merchant live-evidence proof.',
    'Shopflow must not regrow a second long-term provider runtime inside its own product surface.',
  ],
});
