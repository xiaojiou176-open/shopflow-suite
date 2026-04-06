import { z } from 'zod';
import {
  builderRouteOriginValues,
  claimStateValues,
  findStoreCatalogEntryByAppId,
  publicClaimBoundaries,
  storeAppIdValues,
  storeCatalog,
  storeTierValues,
  storeWaveValues,
  type StoreAppId,
} from '@shopflow/contracts';
import {
  activityItemSchema,
  type ActivityItem,
} from './storage/activity-repository';
import {
  detectionRecordSchema,
  type DetectionRecord,
} from './storage/detection-repository';
import {
  evidenceCaptureQueueSummarySchema,
  type EvidenceCaptureQueueSummary,
} from './storage/evidence-capture-repository';
import {
  latestOutputRecordSchema,
  type LatestOutputRecord,
} from './storage/latest-output-repository';

export const builderRouteSchema = z.object({
  origin: z.enum(builderRouteOriginValues),
  label: z.string().min(1),
  href: z.string().url(),
  summary: z.string().min(1),
});

export const builderSurfaceBoundarySchema = z.object({
  today: z.array(z.string().min(1)).min(1),
  later: z.array(z.string().min(1)).min(1),
  noGo: z.array(z.string().min(1)).min(1),
});

export const builderSurfaceBoundary = builderSurfaceBoundarySchema.parse({
  today: [
    'Typed store-adapter contracts and verified-scope metadata',
    'Read-only runtime truth for detection, latest output, recent activity, and evidence queue state',
    'Review-bundle and submission-readiness artifacts produced by repo-owned tooling',
  ],
  later: [
    'Read-only MCP surface backed by the same runtime truth',
    'Read-only public API contract',
    'Generated client or thin SDK built on top of the same read models',
  ],
  noGo: [
    'Write-capable MCP',
    'Hosted SaaS control plane',
    'Generic autonomous workflow execution that outruns reviewed live evidence',
  ],
});

export const builderAppSnapshotSchema = z.object({
  surfaceId: z.literal('builder-app-snapshot'),
  schemaVersion: z.literal('shopflow.builder-app-snapshot.v1'),
  readOnly: z.literal(true),
  appId: z.enum(storeAppIdValues),
  storeId: z.string().min(1),
  publicName: z.string().min(1),
  claimState: z.enum(claimStateValues),
  wave: z.enum(storeWaveValues),
  tier: z.enum(storeTierValues),
  verifiedScopeCopy: z.string().min(1).optional(),
  detection: detectionRecordSchema.optional(),
  latestOutput: latestOutputRecordSchema.optional(),
  recentActivities: z.array(activityItemSchema).max(3),
  evidenceQueue: evidenceCaptureQueueSummarySchema.optional(),
  bestRoute: builderRouteSchema,
  builderSurfaceBoundary: builderSurfaceBoundarySchema,
});

export type BuilderAppSnapshot = z.infer<typeof builderAppSnapshotSchema>;

export function createBuilderAppSnapshot({
  appId,
  detection,
  latestOutput,
  recentActivities = [],
  evidenceQueue,
}: {
  appId: StoreAppId;
  detection?: DetectionRecord;
  latestOutput?: LatestOutputRecord;
  recentActivities?: ActivityItem[];
  evidenceQueue?: EvidenceCaptureQueueSummary;
}): BuilderAppSnapshot {
  const entry = findStoreCatalogEntryByAppId(appId, storeCatalog);

  if (!entry) {
    throw new Error(`Unknown Shopflow app id: ${appId}`);
  }

  const boundary = publicClaimBoundaries[entry.storeId];

  return builderAppSnapshotSchema.parse({
    surfaceId: 'builder-app-snapshot',
    schemaVersion: 'shopflow.builder-app-snapshot.v1',
    readOnly: true,
    appId,
    storeId: entry.storeId,
    publicName: boundary.publicName,
    claimState: boundary.claimState,
    wave: entry.wave,
    tier: entry.tier,
    verifiedScopeCopy: boundary.verifiedScopeCopy,
    detection,
    latestOutput,
    recentActivities: recentActivities.slice(0, 3),
    evidenceQueue,
    bestRoute: deriveBuilderRoute(appId, {
      detection,
      latestOutput,
      recentActivities,
      evidenceQueue,
    }),
    builderSurfaceBoundary,
  });
}

function deriveBuilderRoute(
  appId: StoreAppId,
  source: {
    detection?: DetectionRecord;
    latestOutput?: LatestOutputRecord;
    recentActivities?: ActivityItem[];
    evidenceQueue?: EvidenceCaptureQueueSummary;
  }
) {
  const latestActivity = source.recentActivities?.[0];
  const entry = findStoreCatalogEntryByAppId(appId, storeCatalog);

  if (!entry) {
    throw new Error(`Unknown Shopflow app id: ${appId}`);
  }

  if (source.evidenceQueue?.nextSourcePageUrl) {
    return {
      origin: 'evidence-source',
      label:
        source.evidenceQueue.nextSourceRouteLabel ?? 'Open next evidence route',
      href: source.evidenceQueue.nextSourcePageUrl,
      summary:
        source.evidenceQueue.nextStep ??
        source.evidenceQueue.blockerSummary,
    };
  }

  if (latestActivity?.href) {
    return {
      origin: 'merchant-source',
      label: 'Inspect latest source page',
      href: latestActivity.href,
      summary:
        latestActivity.summary ??
        'Open the freshest source page already recorded in shared runtime state.',
    };
  }

  if (source.latestOutput?.pageUrl) {
    return {
      origin: 'captured-page',
      label: 'Inspect latest captured page',
      href: source.latestOutput.pageUrl,
      summary:
        source.latestOutput.summary ||
        'Open the page behind the freshest captured output for this app.',
    };
  }

  if (source.detection?.url) {
    return {
      origin: 'detected-page',
      label: 'Inspect latest detected page',
      href: source.detection.url,
      summary:
        'Open the most recently detected page when no fresher activity or captured output exists.',
    };
  }

  const defaultHost = entry.defaultHosts[0];

  if (!defaultHost) {
    throw new Error(`Missing default host for ${appId}`);
  }

  return {
    origin: 'default-route',
    label: 'Open catalog default host',
    href: `https://${defaultHost}`,
    summary:
      'Seed runtime truth from the shared store catalog default host when no fresher runtime context exists yet.',
  };
}
