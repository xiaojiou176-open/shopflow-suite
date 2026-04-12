import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createBuilderAppSnapshot,
  type BuilderAppSnapshot,
} from '@shopflow/runtime';
import {
  createHomeViewModel,
  createOperatorDecisionBrief,
  type SidePanelHomeViewModel,
} from '@shopflow/core';
import {
  findStoreCatalogEntryByAppId,
  getLiveReceiptAppRequirements,
  publicClaimBoundaries,
  type CapabilityState,
  type DetectionResult,
  type OperatorDecisionBrief,
  type WorkflowCopilotBrief,
} from '@shopflow/contracts';
import { writeFileAtomically } from '../shared/write-file-atomically';

const repoRoot = resolve(import.meta.dirname, '../..');
const generatedBuilderDirectory = resolve(repoRoot, '.runtime-cache/builder');
const artifactManifestPath = resolve(
  repoRoot,
  '.runtime-cache/release-artifacts/manifest.json'
);
const submissionReadinessPath = resolve(
  repoRoot,
  '.runtime-cache/release-artifacts/submission-readiness.json'
);
const reviewedRecordsLatestPath = resolve(
  repoRoot,
  '.runtime-cache/live-browser/reviewed-records-latest.json'
);

type ReleaseArtifactManifestEntry = {
  appId: string;
  releaseChannel: string;
  buildDirectory: string;
  zipArtifacts: string[];
};

type SubmissionReadinessEntry = {
  appId: string;
  reviewBundleReady: boolean;
  readinessSummary: string;
  repoOwnedStatus: string;
  claimState?: string;
  manualReviewStartUrl?: string;
  verifiedScopeCopy?: string;
  requiredEvidenceCaptureIds?: string[];
  repoOwnedNextMove?: string;
};

type ReviewedRecordsPacket = {
  reviewedRecords: Array<{
    captureId: string;
  }>;
  rejectedRecords: Array<{
    captureId: string;
  }>;
};

type LiveEvidenceResolution = {
  reviewedCaptureIds: string[];
  unresolvedCaptureIds: string[];
  rejectedCaptureIds: string[];
};

type CanonicalRuntimePayloadAppId = (typeof canonicalRuntimePayloadAppIds)[number];

type BuilderRuntimeScenario = {
  appId: Exclude<CanonicalRuntimePayloadAppId, 'ext-albertsons'>;
  pageKind: DetectionResult['pageKind'];
  pageUrl: string;
  capturedAt: string;
  readySummary: string;
  latestOutput: {
    kind: 'product' | 'search' | 'deal';
    headline: string;
    summary: string;
    previewLines: string[];
  };
  capabilityStates: CapabilityState[];
};

const multiAppRuntimeScenarios: Record<
  Exclude<CanonicalRuntimePayloadAppId, 'ext-albertsons'>,
  BuilderRuntimeScenario
> = {
  'ext-amazon': {
    appId: 'ext-amazon',
    pageKind: 'search',
    pageUrl: 'https://www.amazon.com/s?k=coffee+storage',
    capturedAt: '2026-04-02T09:10:00.000Z',
    readySummary: 'Extract Amazon search results is runnable right now.',
    latestOutput: {
      kind: 'search',
      headline: 'Amazon JSON-LD Storage Crate',
      summary:
        'Captured Amazon search results from a page-owned JSON-LD item list.',
      previewLines: [
        'Top result: Amazon JSON-LD Storage Crate',
        'Results captured: 2',
      ],
    },
    capabilityStates: [
      {
        capability: 'extract_search',
        status: 'ready',
      },
      {
        capability: 'run_action',
        status: 'unsupported_page',
      },
      {
        capability: 'export_data',
        status: 'ready',
      },
    ],
  },
  'ext-kroger': {
    appId: 'ext-kroger',
    pageKind: 'deal',
    pageUrl: 'https://www.fredmeyer.com/savings/coupons',
    capturedAt: '2026-04-02T09:20:00.000Z',
    readySummary: 'Extract family deal cards is runnable right now.',
    latestOutput: {
      kind: 'deal',
      headline: 'Fred Meyer Blueberries',
      summary:
        'Captured Kroger family deal details from the current family coupon surface.',
      previewLines: ['Price: $3.99', 'Label: Digital coupon'],
    },
    capabilityStates: [
      {
        capability: 'extract_deals',
        status: 'ready',
      },
      {
        capability: 'run_action',
        status: 'unsupported_page',
      },
      {
        capability: 'export_data',
        status: 'ready',
      },
    ],
  },
  'ext-temu': {
    appId: 'ext-temu',
    pageKind: 'search',
    pageUrl: 'https://www.temu.com/search_result.html?search_key=warehouse',
    capturedAt: '2026-04-02T09:30:00.000Z',
    readySummary:
      'Temu search extraction and the warehouse filter workflow are runnable right now.',
    latestOutput: {
      kind: 'search',
      headline: 'Temu Lamp',
      summary:
        'Captured Temu search results on the differentiated warehouse filter workflow.',
      previewLines: ['Top result: Temu Lamp', 'Filter workflow: ready'],
    },
    capabilityStates: [
      {
        capability: 'extract_search',
        status: 'ready',
      },
      {
        capability: 'run_action',
        status: 'ready',
      },
      {
        capability: 'export_data',
        status: 'ready',
      },
    ],
  },
};

export const canonicalRuntimePayloadAppIds = [
  'ext-albertsons',
  'ext-amazon',
  'ext-kroger',
  'ext-temu',
] as const;

export type BuilderRuntimePayloadSet = {
  appId: string;
  builderAppSnapshot: BuilderAppSnapshot;
  operatorDecisionBrief: OperatorDecisionBrief;
  workflowCopilotBrief: WorkflowCopilotBrief;
};

export type BuilderRuntimePayloadWriteResult = {
  appId: string;
  outputDirectory: string;
  paths: {
    builderAppSnapshot: string;
    operatorDecisionBrief: string;
    workflowCopilotBrief: string;
  };
};

export function supportsCanonicalRuntimePayloads(appId: string) {
  return canonicalRuntimePayloadAppIds.includes(
    appId as CanonicalRuntimePayloadAppId
  );
}

export function createCanonicalBuilderRuntimePayloads(
  appId: string
): BuilderRuntimePayloadSet {
  const artifactState = readReleaseArtifactState();
  const readinessEntry = artifactState.readiness.entries.find(
    (entry) => entry.appId === appId
  );
  const reviewedRecordsPacket = readLatestReviewedRecordsPacket();

  if (appId === 'ext-albertsons') {
    const detection = createAlbertsonsDetection();
    const snapshotRecentActivities = createAlbertsonsSnapshotRecentActivities();
    const modelRecentActivities = createAlbertsonsModelRecentActivities();
    const liveEvidence = resolveLiveEvidenceResolution(
      readinessEntry?.requiredEvidenceCaptureIds ??
        getLiveReceiptAppRequirements(appId).map(
          (requirement) => requirement.captureId
        ),
      reviewedRecordsPacket
    );
    const evidenceStatus = createAlbertsonsEvidenceStatus(
      readinessEntry,
      liveEvidence
    );
    const latestOutput = createAlbertsonsLatestOutput();

    const builderAppSnapshot = createBuilderAppSnapshot({
      appId: 'ext-albertsons',
      detection: {
        appId: 'ext-albertsons',
        url: 'https://www.safeway.com/shop/cart',
        updatedAt: '2026-04-01T08:00:00.000Z',
        detection,
      },
      latestOutput: {
        appId: 'ext-albertsons',
        storeId: 'albertsons',
        kind: 'product',
        pageUrl: latestOutput.pageUrl,
        capturedAt: latestOutput.capturedAt,
        headline: latestOutput.headline,
        summary: latestOutput.summary,
        previewLines: latestOutput.previewLines,
      },
      recentActivities: snapshotRecentActivities,
      evidenceQueue: createAlbertsonsEvidenceQueue(readinessEntry, liveEvidence),
    });

    const model = createHomeViewModel(
      'Shopflow for Albertsons Family',
      'Albertsons Family',
      detection,
      modelRecentActivities,
      evidenceStatus,
      {
        verifiedScopeCopy: 'Currently verified on Safeway.',
        latestOutput,
      }
    );

    return {
      appId,
      builderAppSnapshot,
      operatorDecisionBrief: createOperatorDecisionBrief(model),
      workflowCopilotBrief: model.workflowBrief,
    };
  }

  const scenario = multiAppRuntimeScenarios[appId];

  if (!scenario) {
    throw new Error(
      `No canonical runtime payload generator exists yet for ${appId}.`
    );
  }

  const manifestEntry = artifactState.manifest.entries.find(
    (entry) => entry.appId === appId
  );
  const payloads = createScenarioPayloads(scenario, manifestEntry, readinessEntry);

  return {
    appId,
    builderAppSnapshot: payloads.builderAppSnapshot,
    operatorDecisionBrief: payloads.operatorDecisionBrief,
    workflowCopilotBrief: payloads.workflowCopilotBrief,
  };
}

export function writeCanonicalBuilderRuntimePayloads(
  appId: string,
  outputDirectory = generatedBuilderDirectory
): BuilderRuntimePayloadWriteResult {
  const payloads = createCanonicalBuilderRuntimePayloads(appId);
  mkdirSync(outputDirectory, { recursive: true });

  const paths = {
    builderAppSnapshot: resolve(outputDirectory, `builder-app-snapshot.${appId}.json`),
    operatorDecisionBrief: resolve(
      outputDirectory,
      `operator-decision-brief.${appId}.json`
    ),
    workflowCopilotBrief: resolve(
      outputDirectory,
      `workflow-copilot-brief.${appId}.json`
    ),
  };

  writeFileAtomically(
    paths.builderAppSnapshot,
    `${JSON.stringify(payloads.builderAppSnapshot, null, 2)}\n`
  );
  writeFileAtomically(
    paths.operatorDecisionBrief,
    `${JSON.stringify(payloads.operatorDecisionBrief, null, 2)}\n`
  );
  writeFileAtomically(
    paths.workflowCopilotBrief,
    `${JSON.stringify(payloads.workflowCopilotBrief, null, 2)}\n`
  );

  return {
    appId,
    outputDirectory,
    paths,
  };
}

function readReleaseArtifactState() {
  const manifest = readOptionalJson<{
    entries: ReleaseArtifactManifestEntry[];
  }>(artifactManifestPath);
  const readiness = readOptionalJson<{
    entries: SubmissionReadinessEntry[];
  }>(submissionReadinessPath);

  return {
    manifest: manifest ?? { entries: [] },
    readiness: readiness ?? { entries: [] },
  };
}

function readOptionalJson<T>(path: string): T | undefined {
  if (!existsSync(path)) {
    return undefined;
  }

  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function readLatestReviewedRecordsPacket() {
  return readOptionalJson<ReviewedRecordsPacket>(reviewedRecordsLatestPath);
}

function resolveLiveEvidenceResolution(
  requiredEvidenceCaptureIds: readonly string[],
  reviewedRecordsPacket?: ReviewedRecordsPacket
): LiveEvidenceResolution {
  const reviewedCaptureIdsSet = new Set(
    reviewedRecordsPacket?.reviewedRecords.map((record) => record.captureId) ?? []
  );
  const rejectedCaptureIdsSet = new Set(
    reviewedRecordsPacket?.rejectedRecords.map((record) => record.captureId) ?? []
  );

  return {
    reviewedCaptureIds: requiredEvidenceCaptureIds.filter((captureId) =>
      reviewedCaptureIdsSet.has(captureId)
    ),
    rejectedCaptureIds: requiredEvidenceCaptureIds.filter((captureId) =>
      rejectedCaptureIdsSet.has(captureId)
    ),
    unresolvedCaptureIds: requiredEvidenceCaptureIds.filter(
      (captureId) =>
        !reviewedCaptureIdsSet.has(captureId) &&
        !rejectedCaptureIdsSet.has(captureId)
    ),
  };
}

function createScenarioPayloads(
  scenario: BuilderRuntimeScenario,
  manifestEntry?: ReleaseArtifactManifestEntry,
  readinessEntry?: SubmissionReadinessEntry
) {
  const catalogEntry = findStoreCatalogEntryByAppId(scenario.appId);

  if (!catalogEntry) {
    throw new Error(`Unknown Shopflow app id: ${scenario.appId}`);
  }

  const boundary = publicClaimBoundaries[catalogEntry.storeId];
  const url = new URL(scenario.pageUrl);
  const evidenceCaptureIds =
    readinessEntry?.requiredEvidenceCaptureIds ??
    getLiveReceiptAppRequirements(scenario.appId).map(
      (requirement) => requirement.captureId
    );
  const artifactSummary = manifestEntry
    ? `${scenario.appId} is packaged as ${manifestEntry.releaseChannel}.`
    : 'Review bundle metadata will appear once repo-owned release artifacts exist.';
  const reviewGateSummary =
    evidenceCaptureIds.length > 0
      ? `${evidenceCaptureIds.length} live evidence packet${evidenceCaptureIds.length === 1 ? '' : 's'} still gate public wording.`
      : 'Keep public wording inside the current repo-verified scope.';
  const evidenceQueue =
    evidenceCaptureIds.length > 0
      ? {
          appId: scenario.appId,
          totalCount: evidenceCaptureIds.length,
          needsCaptureCount: evidenceCaptureIds.length,
          captureCount: 0,
          recaptureCount: 0,
          missingCount: evidenceCaptureIds.length,
          captureInProgressCount: 0,
          reviewPendingCount: 0,
          reviewedCount: 0,
          rejectedCount: 0,
          expiredCount: 0,
          blockerSummary:
            readinessEntry?.readinessSummary ??
            'Reviewed live evidence is still required before public wording can move forward.',
          nextCaptureId: evidenceCaptureIds[0],
          nextStatus: 'missing-live-receipt' as const,
          nextOperatorPath: 'capture' as const,
          nextRequirementTitle: humanizeCaptureId(evidenceCaptureIds[0]),
          nextStep:
            readinessEntry?.repoOwnedNextMove ??
            'Keep public wording claim-gated until reviewed live evidence exists.',
          nextSourcePageUrl: scenario.pageUrl,
          nextSourcePageLabel: 'Open current evidence route',
          nextSourceRouteLabel: 'Open current evidence route',
        }
      : undefined;
  const builderAppSnapshot = createBuilderAppSnapshot({
    appId: scenario.appId,
    detection: {
      appId: scenario.appId,
      url: scenario.pageUrl,
      updatedAt: scenario.capturedAt,
      detection: {
        storeId: catalogEntry.storeId,
        verifiedScopes: catalogEntry.verifiedScopes,
        matchedHost: url.host,
        pageKind: scenario.pageKind,
        confidence: 0.92,
        capabilityStates: scenario.capabilityStates,
      },
    },
    latestOutput: {
      appId: scenario.appId,
      storeId: catalogEntry.storeId,
      kind: scenario.latestOutput.kind,
      pageUrl: scenario.pageUrl,
      capturedAt: scenario.capturedAt,
      headline: scenario.latestOutput.headline,
      summary: scenario.latestOutput.summary,
      previewLines: scenario.latestOutput.previewLines,
    },
    recentActivities: [
      {
        id: `${scenario.appId}:${scenario.pageUrl}`,
        appId: scenario.appId,
        label: `${url.host} · ${scenario.pageKind}`,
        summary: `${scenario.readySummary} ${artifactSummary}`,
        timestampLabel: formatRuntimeTimestampLabel(scenario.capturedAt),
        href: scenario.pageUrl,
      },
    ],
    evidenceQueue,
  });

  const stage = deriveDecisionStage(
    scenario.capabilityStates,
    readinessEntry,
    evidenceCaptureIds.length
  );
  const claimBoundary =
    readinessEntry?.verifiedScopeCopy ??
    boundary?.verifiedScopeCopy ??
    (readinessEntry?.claimState === 'repo-verified'
      ? 'Keep public wording inside the current repo-verified scope.'
      : undefined);
  const operatorDecisionBrief: OperatorDecisionBrief = {
    surfaceId: 'operator-decision-brief',
    schemaVersion: 'shopflow.operator-decision-brief.v1',
    readOnly: true,
    appTitle: catalogEntry.publicName,
    stage,
    summary:
      readinessEntry?.readinessSummary ??
      'Review bundle is ready for repo-local inspection.',
    whyNow: [`${url.host} · ${scenario.pageKind}`, scenario.readySummary, reviewGateSummary],
    nextStep:
      readinessEntry?.repoOwnedNextMove ??
      'Inspect the current review route before changing any public wording.',
    primaryRouteLabel:
      evidenceCaptureIds.length > 0
        ? 'Open current evidence route'
        : 'Open current review start page',
    primaryRouteHref: scenario.pageUrl,
    primaryRouteOrigin:
      evidenceCaptureIds.length > 0 ? 'evidence-source' : 'merchant-source',
    claimBoundary,
  };
  const workflowCopilotBrief: WorkflowCopilotBrief = {
    tone: stage === 'ready-now' ? 'ready-now' : 'claim-gated',
    title: 'Workflow copilot',
    summary:
      readinessEntry?.readinessSummary ??
      'Repo-local review bundle is ready for inspection.',
    bullets: [
      {
        label: 'Current surface',
        value: `${url.host} · ${scenario.pageKind}`,
      },
      {
        label: 'Runnable now',
        value: scenario.readySummary,
      },
      {
        label: 'Claim gate',
        value: reviewGateSummary,
      },
    ],
    nextAction: {
      label:
        evidenceCaptureIds.length > 0
          ? 'Open current evidence route'
          : 'Open current review start page',
      reason:
        readinessEntry?.repoOwnedNextMove ??
        'Inspect the current review route before expanding public wording.',
    },
  };

  return {
    builderAppSnapshot,
    operatorDecisionBrief,
    workflowCopilotBrief,
  };
}

function deriveDecisionStage(
  capabilityStates: CapabilityState[],
  readinessEntry?: SubmissionReadinessEntry,
  evidenceCaptureCount = readinessEntry?.requiredEvidenceCaptureIds?.length ?? 0
): OperatorDecisionBrief['stage'] {
  if (capabilityStates.some((state) => state.status === 'ready')) {
    return evidenceCaptureCount > 0 ? 'claim-gated' : 'ready-now';
  }

  if (!readinessEntry) {
    return 'needs-attention';
  }

  if (readinessEntry.repoOwnedStatus.includes('claim-gated')) {
    return 'claim-gated';
  }

  if (readinessEntry.reviewBundleReady) {
    return 'ready-now';
  }

  return 'needs-attention';
}

function humanizeCaptureId(captureId?: string) {
  if (!captureId) {
    return undefined;
  }

  const words = captureId
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatRuntimeTimestampLabel(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Los_Angeles',
  });
}

function createAlbertsonsDetection(): DetectionResult {
  return {
    storeId: 'albertsons',
    verifiedScopes: ['safeway'],
    matchedHost: 'www.safeway.com',
    pageKind: 'cart',
    confidence: 0.95,
    capabilityStates: [
      {
        capability: 'run_action',
        status: 'ready',
      },
    ],
  };
}

function createAlbertsonsSnapshotRecentActivities() {
  return [
    {
      id: 'ext-albertsons:https://www.safeway.com/shop/cart',
      appId: 'ext-albertsons',
      label: 'www.safeway.com · cart',
      summary: '1 ready capability on the latest detected page.',
      timestampLabel: '8:00 AM',
      href: 'https://www.safeway.com/shop/cart',
    },
  ];
}

function createAlbertsonsModelRecentActivities(): SidePanelHomeViewModel['recentActivities'] {
  return [
    {
      id: 'ext-albertsons:https://www.safeway.com/shop/cart',
      label: 'www.safeway.com · cart',
      summary: '1 ready capability on the latest detected page.',
      timestampLabel: '8:00 AM',
      href: 'https://www.safeway.com/shop/cart',
    },
  ];
}

function createAlbertsonsEvidenceStatus(
  readinessEntry?: SubmissionReadinessEntry,
  liveEvidence: LiveEvidenceResolution = resolveLiveEvidenceResolution(
    getLiveReceiptAppRequirements('ext-albertsons').map(
      (requirement) => requirement.captureId
    )
  )
): NonNullable<
  SidePanelHomeViewModel['evidenceStatus']
> {
  const subscribeUnresolved =
    liveEvidence.unresolvedCaptureIds.includes('safeway-subscribe-live-receipt');
  const cancelRejected =
    liveEvidence.rejectedCaptureIds.includes('safeway-cancel-live-receipt');

  return {
    headline: 'Live receipt readiness',
    blockerSummary: {
      label: 'Claim-gated until new Safeway proof exists',
      summary:
        readinessEntry?.readinessSummary ??
        'Review bundle is complete, but reviewed live evidence includes rejected captures, so release wording is still blocked on repo-side evidence triage.',
      nextStep: readinessEntry?.repoOwnedNextMove,
      sourceHref: 'https://www.safeway.com/shop/cart',
      sourceLabel: 'Open current evidence route',
    },
    items: [
      {
        captureId: 'safeway-subscribe-live-receipt',
        title: 'Safeway subscribe live receipt',
        verifiedScope: 'safeway',
        status: subscribeUnresolved ? 'missing-live-receipt' : 'reviewed',
        sectionHref: '#live-receipt-evidence',
        summary:
          'Safeway subscribe live receipt still requires a fresh, reviewable live capture from a logged-in Safeway session.',
        nextStep: readinessEntry?.repoOwnedNextMove,
        sourceHref: 'https://www.safeway.com/shop/cart',
        sourceLabel: 'Open current evidence route',
      },
      {
        captureId: 'safeway-cancel-live-receipt',
        title: 'Safeway cancel live receipt',
        verifiedScope: 'safeway',
        status: cancelRejected ? 'rejected' : 'missing-live-receipt',
        sectionHref: '#live-receipt-review',
        summary: cancelRejected
          ? 'Safeway cancel live receipt is currently rejected because the account state did not expose a cancelable Schedule & Save subscription.'
          : 'Safeway cancel live receipt still requires a reviewable live bundle from a Safeway account with a cancelable subscription.',
        reviewSummary: cancelRejected
          ? 'Current account state has no active Schedule & Save subscription item to cancel.'
          : undefined,
        reviewLabel: cancelRejected ? 'Rejected in review' : undefined,
        sourceHref: 'https://www.safeway.com/schedule-and-save/manage',
        sourceLabel: 'Open current evidence route',
      },
    ],
  };
}

function createAlbertsonsEvidenceQueue(
  readinessEntry?: SubmissionReadinessEntry,
  liveEvidence: LiveEvidenceResolution = resolveLiveEvidenceResolution(
    getLiveReceiptAppRequirements('ext-albertsons').map(
      (requirement) => requirement.captureId
    )
  )
) {
  const requiredEvidenceCaptureIds =
    readinessEntry?.requiredEvidenceCaptureIds ??
    getLiveReceiptAppRequirements('ext-albertsons').map(
      (requirement) => requirement.captureId
    );
  const unresolvedCount = liveEvidence.unresolvedCaptureIds.length;
  const reviewedCount = liveEvidence.reviewedCaptureIds.length;
  const rejectedCount = liveEvidence.rejectedCaptureIds.length;
  const nextCaptureId =
    liveEvidence.unresolvedCaptureIds[0] ?? requiredEvidenceCaptureIds[0];

  return {
    appId: 'ext-albertsons',
    totalCount: requiredEvidenceCaptureIds.length,
    needsCaptureCount: unresolvedCount,
    captureCount: 0,
    recaptureCount: rejectedCount,
    missingCount: unresolvedCount,
    captureInProgressCount: 0,
    reviewPendingCount: 0,
    reviewedCount,
    rejectedCount,
    expiredCount: 0,
    blockerSummary:
      readinessEntry?.readinessSummary ??
      'Review bundle is complete, but reviewed live evidence includes rejected captures, so release wording is still blocked on repo-side evidence triage.',
    nextCaptureId,
    nextStatus: 'missing-live-receipt' as const,
    nextOperatorPath: 'capture' as const,
    nextRequirementTitle: humanizeCaptureId(nextCaptureId),
    nextStep:
      readinessEntry?.repoOwnedNextMove ??
      'Keep wording claim-gated. Reviewed live evidence already includes rejected captures for safeway-cancel-live-receipt, so repo-side recapture or evidence triage is still required before submission decisioning can move.',
    nextSourcePageUrl: 'https://www.safeway.com/shop/cart',
    nextSourcePageLabel: 'Open current evidence route',
    nextSourceRouteLabel: 'Open current evidence route',
  };
}

function createAlbertsonsLatestOutput() {
  return {
    kind: 'product' as const,
    headline: 'Safeway Green Grapes',
    summary: 'Captured product details with price $4.99.',
    previewLines: ['Price: $4.99'],
    capturedAt: '2026-04-01T07:58:00.000Z',
    pageUrl: 'https://www.safeway.com/shop/product-details/grapes',
  };
}
