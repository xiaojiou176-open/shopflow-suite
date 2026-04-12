import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildCanonicalMerchantTargets,
  resolveShopflowLiveSessionConfig,
  type ShopflowLiveTraceBundle,
  type ShopflowLiveTraceScreenshotEntry,
  type ShopflowLiveDiagnoseReport,
  type ShopflowLiveTargetId,
  writeLiveJsonArtifact,
} from './shared';

type CapturePacketCandidateStatus = 'capture-ready' | 'blocked';

type CapturePacketCandidate = {
  captureId: string;
  appId: string;
  targetId: ShopflowLiveTargetId;
  status: CapturePacketCandidateStatus;
  classification: string;
  finalUrl?: string;
  title?: string;
  screenshotLabel?: string;
  screenshotPath?: string;
  blockerReason?: string;
};

type OperatorCapturePacket = {
  mode: 'shopflow_live_operator_capture_packet';
  checkedAt: string;
  sourceArtifacts: {
    diagnoseLatestPath: string;
    traceBundleDirectory?: string;
    traceSummaryPath?: string;
    screenshotManifestPath?: string;
    screenshotsDirectory?: string;
  };
  safeway: {
    sessionHealth?: string;
    captureTargetState?: string;
    deepLinkState?: string;
  };
  captureCandidates: CapturePacketCandidate[];
};

type ShopflowLiveDiagnoseArtifact = ShopflowLiveDiagnoseReport & {
  traceBundle?: ShopflowLiveTraceBundle;
};

function readJsonFile<T>(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function normalizeUrl(url: string | undefined) {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

function findLatestTraceBundle(artifactDirectory: string) {
  const bundlesDirectory = resolve(artifactDirectory, 'bundles');
  if (!existsSync(bundlesDirectory)) {
    return undefined;
  }

  const bundleNames = readdirSync(bundlesDirectory)
    .filter((entry) => entry.startsWith('trace-'))
    .sort();
  const latestBundleName = bundleNames.at(-1);

  if (!latestBundleName) {
    return undefined;
  }

  const bundleDirectory = resolve(bundlesDirectory, latestBundleName);
  return {
    bundleDirectory,
    summaryPath: resolve(bundleDirectory, 'summary.json'),
    screenshotManifestPath: resolve(bundleDirectory, 'screenshots.json'),
    screenshotsDirectory: resolve(bundleDirectory, 'screenshots'),
  };
}

function detectBlockerReason(classification: string) {
  switch (classification) {
    case 'deep_link_unstable':
      return 'deep_link_unstable';
    case 'login_required':
      return 'login_required';
    case 'public_or_unknown':
      return 'public_or_unknown';
    case 'not_open':
      return 'not_open';
    default:
      return undefined;
  }
}

function resolveCaptureLaneBlockerReason(args: {
  appId: string;
  targetId: ShopflowLiveTargetId;
  classification: string;
  safewayCaptureTargetState?: string;
}) {
  const {
    appId,
    targetId,
    classification,
    safewayCaptureTargetState,
  } = args;

  if (
    appId === 'ext-albertsons' &&
    targetId === 'safeway-cart' &&
    (safewayCaptureTargetState === 'login_required' ||
      safewayCaptureTargetState === 'deep_link_unstable')
  ) {
    return safewayCaptureTargetState;
  }

  return detectBlockerReason(classification);
}

export function createOperatorCapturePacket(args: {
  diagnoseReport: ShopflowLiveDiagnoseArtifact;
  screenshotsDirectory?: string;
  screenshotEntries?: ShopflowLiveTraceScreenshotEntry[];
}) {
  const {
    diagnoseReport,
    screenshotsDirectory,
    screenshotEntries = [],
  } = args;
  const targets = buildCanonicalMerchantTargets();
  const observedTabs = diagnoseReport.probe.observedTabs;

  const screenshotPathByUrl = new Map<string, string>();
  const screenshotPathByTitle = new Map<string, string>();
  if (screenshotEntries.length > 0) {
    screenshotEntries.forEach((entry) => {
      if (entry.pageUrl && entry.screenshotPath) {
        screenshotPathByUrl.set(entry.pageUrl, entry.screenshotPath);
        const normalizedPageUrl = normalizeUrl(entry.pageUrl);
        if (normalizedPageUrl) {
          screenshotPathByUrl.set(normalizedPageUrl, entry.screenshotPath);
        }
      }
      if (entry.title && entry.screenshotPath) {
        screenshotPathByTitle.set(entry.title, entry.screenshotPath);
      }
    });
  } else if (screenshotsDirectory) {
    observedTabs.forEach((tab, index) => {
      const screenshotPath = resolve(screenshotsDirectory, `page-${index + 1}.png`);
      screenshotPathByUrl.set(tab.url, screenshotPath);
      const normalizedTabUrl = normalizeUrl(tab.url);
      if (normalizedTabUrl) {
        screenshotPathByUrl.set(normalizedTabUrl, screenshotPath);
      }
      screenshotPathByTitle.set(tab.title, screenshotPath);
    });
  }

  const captureCandidates: CapturePacketCandidate[] = [];

  for (const observation of diagnoseReport.probe.targets) {
    const target = targets.find((candidate) => candidate.id === observation.id);
    if (!target || target.captureIds.length === 0) {
      continue;
    }

    const screenshotPath =
      (observation.finalUrl && screenshotPathByUrl.get(observation.finalUrl)) ||
      (observation.finalUrl &&
        screenshotPathByUrl.get(normalizeUrl(observation.finalUrl) ?? '')) ||
      (observation.title && screenshotPathByTitle.get(observation.title));
    const screenshotLabel = screenshotPath?.split('/').pop();
    const status: CapturePacketCandidateStatus =
      observation.classification === 'session_visible' ? 'capture-ready' : 'blocked';
    const blockerReason = resolveCaptureLaneBlockerReason({
      appId: target.appId,
      targetId: target.id,
      classification: observation.classification,
      safewayCaptureTargetState:
        diagnoseReport.probe.captureTargetState?.safeway,
    });

    for (const captureId of target.captureIds) {
      captureCandidates.push({
        captureId,
        appId: target.appId,
        targetId: target.id,
        status,
        classification: observation.classification,
        finalUrl: observation.finalUrl,
        title: observation.title,
        screenshotLabel,
        screenshotPath,
        blockerReason,
      });
    }
  }

  return {
    mode: 'shopflow_live_operator_capture_packet',
    checkedAt: new Date().toISOString(),
    sourceArtifacts: {
      diagnoseLatestPath: '',
      traceBundleDirectory: diagnoseReport.traceBundle?.bundleDirectory,
      traceSummaryPath: diagnoseReport.traceBundle?.summaryPath,
      screenshotManifestPath: diagnoseReport.traceBundle?.screenshotManifestPath,
      screenshotsDirectory,
    },
    safeway: {
      sessionHealth: diagnoseReport.probe.sessionHealth.safeway,
      captureTargetState: diagnoseReport.probe.captureTargetState.safeway,
      deepLinkState: diagnoseReport.probe.deepLinkState.safeway,
    },
    captureCandidates,
  } satisfies OperatorCapturePacket;
}

async function main() {
  const config = resolveShopflowLiveSessionConfig(process.env);
  const diagnoseLatestPath = resolve(
    config.artifactDirectory,
    'diagnose-latest.json'
  );

  if (!existsSync(diagnoseLatestPath)) {
    throw new Error(
      `Missing diagnose artifact at ${diagnoseLatestPath}. Run \`pnpm diagnose:live\` first.`
    );
  }

  const diagnoseReport = readJsonFile<ShopflowLiveDiagnoseArtifact>(
    diagnoseLatestPath
  );
  const latestTraceBundle =
    diagnoseReport.traceBundle ?? findLatestTraceBundle(config.artifactDirectory);
  const screenshotEntries =
    latestTraceBundle?.screenshotManifestPath &&
    existsSync(latestTraceBundle.screenshotManifestPath)
      ? readJsonFile<ShopflowLiveTraceScreenshotEntry[]>(
          latestTraceBundle.screenshotManifestPath
        )
      : [];
  const packet = createOperatorCapturePacket({
    diagnoseReport,
    screenshotsDirectory: latestTraceBundle?.screenshotsDirectory,
    screenshotEntries,
  });
  packet.sourceArtifacts.diagnoseLatestPath = diagnoseLatestPath;
  packet.sourceArtifacts.traceBundleDirectory = latestTraceBundle?.bundleDirectory;
  packet.sourceArtifacts.traceSummaryPath = latestTraceBundle?.summaryPath;
  packet.sourceArtifacts.screenshotManifestPath =
    latestTraceBundle?.screenshotManifestPath;
  packet.sourceArtifacts.screenshotsDirectory =
    latestTraceBundle?.screenshotsDirectory;

  const artifacts = writeLiveJsonArtifact(config, 'operator-capture-packet', packet);

  process.stdout.write(
    `${JSON.stringify(
      {
        ...packet,
        artifacts,
      },
      null,
      2
    )}\n`
  );
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  await main();
}
