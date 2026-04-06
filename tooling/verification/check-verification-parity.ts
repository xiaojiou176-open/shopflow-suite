import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  allVerificationCatalogEntries,
  getStoreReviewStartHost,
  publicClaimBoundaries,
  storeCatalog,
  storeHostPatternCoversPattern,
  storeHostPatternMatchesHost,
  storeVerificationCatalog,
  suiteVerificationCatalogEntry,
} from '@shopflow/contracts';
import { appDefinition as albertsonsApp } from '../../apps/ext-albertsons/src/app-definition';
import { appDefinition as amazonApp } from '../../apps/ext-amazon/src/app-definition';
import { appDefinition as costcoApp } from '../../apps/ext-costco/src/app-definition';
import { appDefinition as krogerApp } from '../../apps/ext-kroger/src/app-definition';
import { appDefinition as suiteApp } from '../../apps/ext-shopping-suite/src/app-definition';
import { appDefinition as targetApp } from '../../apps/ext-target/src/app-definition';
import { appDefinition as temuApp } from '../../apps/ext-temu/src/app-definition';
import { appDefinition as walmartApp } from '../../apps/ext-walmart/src/app-definition';
import { appDefinition as weeeApp } from '../../apps/ext-weee/src/app-definition';

const repoRoot = resolve(import.meta.dirname, '../..');

const appDefinitions: Record<string, VerificationParityAppDefinition> = {
  'ext-albertsons': albertsonsApp,
  'ext-amazon': amazonApp,
  'ext-costco': costcoApp,
  'ext-kroger': krogerApp,
  'ext-temu': temuApp,
  'ext-target': targetApp,
  'ext-walmart': walmartApp,
  'ext-weee': weeeApp,
};

const publicReadyOverclaimPattern =
  /public[- ]claim[- ]ready|public[- ]ready|store[- ]ready signed/i;

export type VerificationParityIssueCategory =
  | 'path'
  | 'fixture'
  | 'app-definition'
  | 'claim-boundary'
  | 'review-start-path'
  | 'evidence'
  | 'packaging'
  | 'suite';

export type VerificationParityIssue = {
  category: VerificationParityIssueCategory;
  message: string;
  appId?: string;
};

export type VerificationParityAppDefinition = {
  appId: string;
  storeId: string;
  title: string;
  summary: string;
  hostMatches: readonly string[];
  verifiedScopeCopy?: string;
  requiredEvidence?: readonly {
    captureId: string;
  }[];
};

type VerificationParitySuiteDefinition = {
  appId: string;
  mode: string;
  guardrails: readonly string[];
};

type VerificationParityPackageJson = {
  name?: string;
  scripts?: Record<string, string>;
};

type VerificationParityOptions = {
  verificationEntries?: readonly (typeof allVerificationCatalogEntries)[number][];
  storeEntries?: readonly (typeof storeVerificationCatalog)[number][];
  storeCatalogMap?: typeof storeCatalog;
  publicClaimBoundaryMap?: typeof publicClaimBoundaries;
  appDefinitionsById?: Partial<
    Record<
      keyof typeof appDefinitions,
      VerificationParityAppDefinition
    >
  >;
  suiteDefinition?: VerificationParitySuiteDefinition;
  pathExists?: (relativePath: string) => boolean;
  fixtureDirectoryHasHtml?: (relativePath: string) => boolean;
  readPackageJson?: (
    relativePath: string
  ) => VerificationParityPackageJson | undefined;
};

function pathExists(relativePath: string) {
  return existsSync(resolve(repoRoot, relativePath));
}

function formatVerificationParityIssue({
  category,
  message,
}: VerificationParityIssue) {
  return `[${category}] ${message}`;
}

function createIssueCollector(issues: VerificationParityIssue[]) {
  return (
    category: VerificationParityIssueCategory,
    message: string,
    appId?: string
  ) => {
    issues.push({ category, message, appId });
  };
}

function fixtureDirectoryHasHtml(relativePath: string) {
  const absolutePath = resolve(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    return false;
  }

  return readdirSync(absolutePath).some((entry) => entry.endsWith('.html'));
}

function readPackageJson(relativePath: string) {
  const absolutePath = resolve(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    return undefined;
  }

  return JSON.parse(readFileSync(absolutePath, 'utf8')) as {
    name?: string;
    scripts?: Record<string, string>;
  };
}

export function collectVerificationParityIssues(
  options: VerificationParityOptions = {}
) {
  return collectStructuredVerificationParityIssues(options).map(
    formatVerificationParityIssue
  );
}

export function collectStructuredVerificationParityIssues(
  options: VerificationParityOptions = {}
) {
  const issues: VerificationParityIssue[] = [];
  const pushIssue = createIssueCollector(issues);
  const verificationEntries =
    options.verificationEntries ?? allVerificationCatalogEntries;
  const storeEntries = options.storeEntries ?? storeVerificationCatalog;
  const storeCatalogMap = options.storeCatalogMap ?? storeCatalog;
  const publicClaimBoundaryMap =
    options.publicClaimBoundaryMap ?? publicClaimBoundaries;
  const appDefinitionsById = options.appDefinitionsById ?? appDefinitions;
  const suiteDefinition = options.suiteDefinition ?? suiteApp;
  const doesPathExist = options.pathExists ?? pathExists;
  const directoryHasHtml =
    options.fixtureDirectoryHasHtml ?? fixtureDirectoryHasHtml;
  const readPackage =
    options.readPackageJson ??
    ((relativePath: string) => readPackageJson(relativePath));

  for (const entry of verificationEntries) {
    if (!doesPathExist(entry.appDir)) {
      pushIssue('path', `Missing app directory: ${entry.appDir}`, entry.appId);
    }

    if (!doesPathExist(entry.contractTestPath)) {
      pushIssue(
        'path',
        `Missing contract test: ${entry.contractTestPath}`,
        entry.appId
      );
    }

    if (!doesPathExist(entry.e2eSmokePath)) {
      pushIssue(
        'path',
        `Missing E2E smoke: ${entry.e2eSmokePath}`,
        entry.appId
      );
    }
  }

  for (const entry of storeEntries) {
    if (!doesPathExist(entry.storePackageDir)) {
      pushIssue(
        'path',
        `Missing store package directory: ${entry.storePackageDir}`,
        entry.appId
      );
    }

    for (const fixtureDirectory of entry.fixtureDirectories) {
      if (!doesPathExist(fixtureDirectory)) {
        pushIssue(
          'fixture',
          `Missing fixture directory: ${fixtureDirectory}`,
          entry.appId
        );
        continue;
      }

      if (!directoryHasHtml(fixtureDirectory)) {
        pushIssue(
          'fixture',
          `Fixture directory has no HTML snapshots: ${fixtureDirectory}`,
          entry.appId
        );
      }
    }

    const boundary = publicClaimBoundaryMap[entry.storeId];
    const appDefinition = appDefinitionsById[entry.appId];
    const catalogEntry = storeCatalogMap[entry.storeId];

    if (!appDefinition) {
      pushIssue(
        'app-definition',
        `Missing app definition export for ${entry.appId}`,
        entry.appId
      );
      continue;
    }

    if (appDefinition.appId !== entry.appId) {
      pushIssue(
        'app-definition',
        `App definition drift for ${entry.appId}: expected appId ${entry.appId} but found ${appDefinition.appId}`,
        entry.appId
      );
    }

    if (appDefinition.storeId !== entry.storeId) {
      pushIssue(
        'app-definition',
        `App definition drift for ${entry.appId}: expected storeId ${entry.storeId} but found ${appDefinition.storeId}`,
        entry.appId
      );
    }

    if (appDefinition.title !== boundary.publicName) {
      pushIssue(
        'app-definition',
        `App definition drift for ${entry.appId}: expected title "${boundary.publicName}" but found "${appDefinition.title}".`,
        entry.appId
      );
    }

    if (!catalogEntry.defaultHosts[0]) {
      pushIssue(
        'review-start-path',
        `Store catalog is missing a default review host for ${entry.appId}.`,
        entry.appId
      );
    }

    const uncoveredHostMatches = appDefinition.hostMatches.filter(
      (pattern) =>
        !catalogEntry.hostPatterns.some((catalogPattern) =>
          storeHostPatternCoversPattern(catalogPattern, pattern)
        )
    );

    if (uncoveredHostMatches.length > 0) {
      pushIssue(
        'claim-boundary',
        `App host match drift for ${entry.appId}: ${uncoveredHostMatches.join(', ')} is not covered by catalog host patterns ${catalogEntry.hostPatterns.join(', ')}.`,
        entry.appId
      );
    }

    const defaultReviewHost = getStoreReviewStartHost(
      entry.storeId,
      storeCatalogMap
    );
    if (
      defaultReviewHost &&
      !catalogEntry.hostPatterns.some((pattern) =>
        storeHostPatternMatchesHost(pattern, defaultReviewHost)
      )
    ) {
      pushIssue(
        'review-start-path',
        `Default review host drift for ${entry.appId}: ${defaultReviewHost} is not covered by store host patterns ${catalogEntry.hostPatterns.join(', ')}.`,
        entry.appId
      );
    }

    if (
      defaultReviewHost &&
      !appDefinition.hostMatches.some((pattern) =>
        storeHostPatternMatchesHost(pattern, defaultReviewHost)
      )
    ) {
      pushIssue(
        'review-start-path',
        `Default review host drift for ${entry.appId}: ${defaultReviewHost} is not covered by app hostMatches ${appDefinition.hostMatches.join(', ') || 'missing'}.`,
        entry.appId
      );
    }

    if (publicReadyOverclaimPattern.test(appDefinition.summary)) {
      pushIssue(
        'claim-boundary',
        `App summary overclaims release maturity for ${entry.appId}: "${appDefinition.summary}".`,
        entry.appId
      );
    }

    if (entry.requiresVerifiedScopeCopy && !boundary.verifiedScopeCopy) {
      pushIssue(
        'claim-boundary',
        `Family claim boundary is missing verified-scope copy: ${entry.appId}`,
        entry.appId
      );
    }

    if (
      entry.requiresVerifiedScopeCopy &&
      appDefinition.verifiedScopeCopy !== boundary.verifiedScopeCopy
    ) {
      pushIssue(
        'claim-boundary',
        `App definition verified-scope copy drift for ${entry.appId}: expected "${boundary.verifiedScopeCopy}" but found "${appDefinition.verifiedScopeCopy ?? 'missing'}".`,
        entry.appId
      );
    }

    if (
      entry.requiresVerifiedScopeCopy &&
      !appDefinition.summary.includes(boundary.verifiedScopeCopy ?? '')
    ) {
      pushIssue(
        'claim-boundary',
        `App summary drift for ${entry.appId}: summary must repeat the verified-scope clause "${boundary.verifiedScopeCopy}".`,
        entry.appId
      );
    }

    if (entry.requiredEvidenceCaptureIds.length > 0) {
      if (!appDefinition?.requiredEvidence?.length) {
        pushIssue(
          'evidence',
          `Live-evidence-required app is missing requiredEvidence wiring: ${entry.appId}`,
          entry.appId
        );
        continue;
      }

      const declaredCaptureIds = appDefinition.requiredEvidence.map(
        ({ captureId }) => captureId
      );

      if (
        declaredCaptureIds.length !== entry.requiredEvidenceCaptureIds.length ||
        declaredCaptureIds.some(
          (captureId) => !entry.requiredEvidenceCaptureIds.includes(captureId)
        )
      ) {
        pushIssue(
          'evidence',
          `requiredEvidence drift for ${entry.appId}: expected ${entry.requiredEvidenceCaptureIds.join(', ')} but found ${declaredCaptureIds.join(', ')}`,
          entry.appId
        );
      }

      if (!/live receipt/i.test(appDefinition.summary)) {
        pushIssue(
          'evidence',
          `Evidence-sensitive app summary must mention live receipt gating: ${entry.appId}`,
          entry.appId
        );
      }
    }

    const appPackageJson = `${entry.appDir}/package.json`;
    const appPackage = readPackage(appPackageJson);

    if (!appPackage) {
      pushIssue('path', `Missing app package.json: ${appPackageJson}`, entry.appId);
      continue;
    }

    const expectedPackageName = `@shopflow/${entry.appId}`;
    if (appPackage.name !== expectedPackageName) {
      pushIssue(
        'packaging',
        `App package name drift for ${entry.appId}: expected "${expectedPackageName}" but found "${appPackage.name ?? 'missing'}".`,
        entry.appId
      );
    }

    if (!appPackage.scripts?.build) {
      pushIssue(
        'packaging',
        `Missing build script in ${appPackageJson}`,
        entry.appId
      );
    }

    if (!appPackage.scripts?.zip) {
      pushIssue(
        'packaging',
        `Missing zip script in ${appPackageJson}`,
        entry.appId
      );
    }

    if (!appPackage.scripts?.test) {
      pushIssue(
        'packaging',
        `Missing test script in ${appPackageJson}`,
        entry.appId
      );
    }
  }

  if (!doesPathExist(suiteVerificationCatalogEntry.appDir)) {
    pushIssue(
      'path',
      `Missing suite app directory: ${suiteVerificationCatalogEntry.appDir}`,
      suiteVerificationCatalogEntry.appId
    );
  }

  if (
    suiteVerificationCatalogEntry.releaseChannel !== 'internal-alpha'
  ) {
    pushIssue(
      'suite',
      'Suite release channel drifted away from internal-alpha.',
      suiteVerificationCatalogEntry.appId
    );
  }

  if (suiteDefinition.appId !== 'ext-shopping-suite') {
    pushIssue(
      'suite',
      `Suite app definition drifted appId: ${suiteDefinition.appId}`,
      suiteVerificationCatalogEntry.appId
    );
  }

  if (suiteDefinition.mode !== 'internal-alpha') {
    pushIssue(
      'suite',
      `Suite app definition must stay internal-alpha, found ${suiteDefinition.mode}.`,
      suiteVerificationCatalogEntry.appId
    );
  }

  if (!suiteDefinition.guardrails.includes('No public claim')) {
    pushIssue(
      'suite',
      'Suite app definition must retain the "No public claim" guardrail.',
      suiteVerificationCatalogEntry.appId
    );
  }

  if (!suiteDefinition.guardrails.includes('No second logic plane')) {
    pushIssue(
      'suite',
      'Suite app definition must retain the "No second logic plane" guardrail.',
      suiteVerificationCatalogEntry.appId
    );
  }

  return issues;
}

function main() {
  const issues = collectStructuredVerificationParityIssues();

  if (issues.length === 0) {
    process.stdout.write(
      `Verification parity OK for ${allVerificationCatalogEntries.length} release catalog entries.\n`
    );
    return;
  }

  for (const issue of issues) {
    console.error(`- ${formatVerificationParityIssue(issue)}`);
  }

  process.exitCode = 1;
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main();
}
