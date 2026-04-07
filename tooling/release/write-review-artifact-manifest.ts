import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, normalize, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { allVerificationCatalogEntries } from '@shopflow/contracts';

type ReviewArtifactInput = {
  appId: string;
  packageName: string;
  reviewChannel: string;
  surface: string;
  bundleDir: string;
  githubWorkflow?: string;
  githubRunId?: string;
  sourceSha?: string;
  generatedAt?: string;
};

type ExtensionManifest = {
  name: string;
  version: string;
};

export type ReviewArtifactManifest = {
  appId: string;
  packageName: string;
  releaseChannel: string;
  claimState: string;
  reviewChannel: string;
  surface: string;
  extensionName: string;
  extensionVersion: string;
  generatedAt: string;
  githubWorkflow?: string;
  githubRunId?: string;
  sourceSha?: string;
  zipArtifacts: string[];
  bundleCompleteness: {
    requiredFiles: string[];
    zipArtifacts: string[];
  };
};

function expectedPackageNameForApp(appId: string) {
  return `@shopflow/${appId}`;
}

function expectedBundleSuffixesForEntry(
  entry: (typeof allVerificationCatalogEntries)[number]
) {
  return [
    normalize(join(entry.appDir, '.output', 'chrome-mv3')),
    normalize(
      join('.runtime-cache', 'release-artifacts', 'apps', entry.appId, 'bundle')
    ),
  ];
}

function expectedSurfaceForEntry(entry: (typeof allVerificationCatalogEntries)[number]) {
  if (entry.appId === 'ext-shopping-suite') {
    return 'internal-alpha';
  }

  return entry.tier === 'capability-heavy-product'
    ? 'capability-heavy-product'
    : 'storefront-shell';
}

function expectedReviewChannelForEntry(
  entry: (typeof allVerificationCatalogEntries)[number]
) {
  return entry.releaseChannel === 'internal-alpha'
    ? 'internal-alpha-review'
    : 'store-review';
}

function formatValidationIssues(issues: string[]) {
  return `Review artifact input failed validation:\n${issues
    .map((issue) => `- ${issue}`)
    .join('\n')}`;
}

function requiredBundleFilesForApp(appId: string) {
  const baseFiles = ['manifest.json', 'background.js', 'sidepanel.html'];

  return appId === 'ext-shopping-suite' ? baseFiles : [...baseFiles, 'popup.html'];
}

function collectMissingBundleFiles(bundleDir: string, requiredFiles: string[]) {
  return requiredFiles.filter(
    (fileName) => !existsSync(resolve(bundleDir, fileName))
  );
}

function validateReviewArtifactInput(input: ReviewArtifactInput) {
  const entry = allVerificationCatalogEntries.find(
    (candidate) => candidate.appId === input.appId
  );

  if (!entry) {
    throw new Error(
      formatValidationIssues([
        `Unknown appId "${input.appId}". Expected one of: ${allVerificationCatalogEntries
          .map((candidate) => candidate.appId)
          .join(', ')}`,
      ])
    );
  }

  const issues: string[] = [];
  const expectedPackageName = expectedPackageNameForApp(entry.appId);
  if (input.packageName !== expectedPackageName) {
    issues.push(
      `packageName drift for ${entry.appId}: expected "${expectedPackageName}" but received "${input.packageName}".`
    );
  }

  const expectedReviewChannel = expectedReviewChannelForEntry(entry);
  if (input.reviewChannel !== expectedReviewChannel) {
    issues.push(
      `reviewChannel drift for ${entry.appId}: expected "${expectedReviewChannel}" but received "${input.reviewChannel}".`
    );
  }

  const expectedSurface = expectedSurfaceForEntry(entry);
  if (input.surface !== expectedSurface) {
    issues.push(
      `surface drift for ${entry.appId}: expected "${expectedSurface}" but received "${input.surface}".`
    );
  }

  const normalizedBundleDir = normalize(input.bundleDir);
  const expectedBundleSuffixes = expectedBundleSuffixesForEntry(entry);
  if (
    !expectedBundleSuffixes.some((expectedSuffix) =>
      normalizedBundleDir.endsWith(expectedSuffix)
    )
  ) {
    issues.push(
      `bundleDir drift for ${entry.appId}: expected one of "${expectedBundleSuffixes.join(
        '" or "'
      )}" but received "${normalizedBundleDir}".`
    );
  }

  const outputRoot = resolve(input.bundleDir, '..');
  const requiredFiles = requiredBundleFilesForApp(entry.appId);
  const missingBundleFiles = collectMissingBundleFiles(input.bundleDir, requiredFiles);
  const zipArtifacts = collectZipArtifacts(outputRoot);

  if (missingBundleFiles.length > 0) {
    issues.push(
      `[packaging] Missing required bundle files for ${entry.appId}: ${missingBundleFiles.join(', ')}.`
    );
  }

  if (zipArtifacts.length === 0) {
    issues.push(
      `[packaging] Missing zip artifacts under "${normalize(outputRoot)}".`
    );
  }

  if (issues.length > 0) {
    throw new Error(formatValidationIssues(issues));
  }

  return {
    entry,
    requiredFiles,
    zipArtifacts,
  };
}

function collectZipArtifacts(outputRoot: string, current = outputRoot): string[] {
  return readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = join(current, entry.name);

    if (entry.isDirectory()) {
      return collectZipArtifacts(outputRoot, nextPath);
    }

    return entry.name.endsWith('.zip')
      ? [relative(outputRoot, nextPath)]
      : [];
  });
}

export function createReviewArtifactManifest(
  input: ReviewArtifactInput
): ReviewArtifactManifest {
  const { entry, requiredFiles, zipArtifacts } = validateReviewArtifactInput(input);

  const manifestPath = resolve(input.bundleDir, 'manifest.json');
  const manifest = JSON.parse(
    readFileSync(manifestPath, 'utf8')
  ) as ExtensionManifest;

  return {
    appId: input.appId,
    packageName: input.packageName,
    releaseChannel: entry.releaseChannel,
    claimState: entry.claimState,
    reviewChannel: input.reviewChannel,
    surface: input.surface,
    extensionName: manifest.name,
    extensionVersion: manifest.version,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    githubWorkflow: input.githubWorkflow,
    githubRunId: input.githubRunId,
    sourceSha: input.sourceSha,
    zipArtifacts,
    bundleCompleteness: {
      requiredFiles,
      zipArtifacts,
    },
  };
}

export function writeReviewArtifactManifest(input: ReviewArtifactInput) {
  validateReviewArtifactInput(input);

  const reviewArtifact = createReviewArtifactManifest(input);
  const outputPath = join(input.bundleDir, 'shopflow-review-artifact.json');

  writeFileSync(outputPath, `${JSON.stringify(reviewArtifact, null, 2)}\n`);

  return outputPath;
}

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function main() {
  const appDir = readRequiredEnv('SHOPFLOW_APP_DIR');
  const bundleDir = resolve(process.cwd(), appDir, '.output', 'chrome-mv3');

  writeReviewArtifactManifest({
    appId: readRequiredEnv('SHOPFLOW_APP_ID'),
    packageName: readRequiredEnv('SHOPFLOW_PACKAGE_NAME'),
    reviewChannel: readRequiredEnv('SHOPFLOW_REVIEW_CHANNEL'),
    surface: readRequiredEnv('SHOPFLOW_SURFACE'),
    bundleDir,
    githubWorkflow: process.env.GITHUB_WORKFLOW,
    githubRunId: process.env.GITHUB_RUN_ID,
    sourceSha: process.env.GITHUB_SHA,
  });
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main();
}
