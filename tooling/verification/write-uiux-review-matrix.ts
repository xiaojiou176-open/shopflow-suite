import { resolve } from 'node:path';
import { storeCatalog } from '@shopflow/contracts';
import { resolveFromRepo } from '../../tests/support/repo-paths';
import { writeFileAtomically } from '../shared/write-file-atomically';

type ReviewStatus =
  | 'pending'
  | 'partially-reviewed'
  | 'repo-verified'
  | 'blocked-external';

type ReviewSurfaceEntry = {
  id: string;
  category: 'extension-ui' | 'public-surface' | 'external-review';
  appId?: string;
  publicName?: string;
  surface: string;
  locale?: string;
  route?: string;
  reviewMode: 'manual-installed-chrome' | 'repo-capture' | 'browser-public' | 'external-judge';
  reviewers: string[];
  status: ReviewStatus;
  note: string;
};

type UiuxReviewMatrix = {
  generatedAt: string;
  outputPath: string;
  summary: {
    extensionUiEntries: number;
    publicSurfaceEntries: number;
    externalReviewEntries: number;
  };
  entries: ReviewSurfaceEntry[];
};

const publicSurfaceEntries: ReviewSurfaceEntry[] = [
  {
    id: 'public-readme',
    category: 'public-surface',
    surface: 'root README front door',
    route: 'README.md',
    reviewMode: 'repo-capture',
    reviewers: ['L1', 'Designer', 'Reviewer'],
    status: 'pending',
    note: 'Root public front door copy, CTA order, trust framing, and first-touch product story.',
  },
  {
    id: 'public-docs-atlas',
    category: 'public-surface',
    surface: 'GitHub docs atlas',
    route: 'docs/README.md',
    reviewMode: 'repo-capture',
    reviewers: ['L1', 'Designer', 'Reviewer'],
    status: 'pending',
    note: 'GitHub-local docs desk, first-hop clarity, and public/private plane discipline.',
  },
  {
    id: 'public-pages-lobby',
    category: 'public-surface',
    surface: 'Pages front door',
    route: 'docs/index.md',
    reviewMode: 'browser-public',
    reviewers: ['L1', 'Designer', 'Reviewer', 'Gemini'],
    status: 'pending',
    note: 'Real public first-touch lobby, CTA action tension, and Pages-safe navigation.',
  },
  {
    id: 'public-release-shelf',
    category: 'public-surface',
    surface: 'latest review shelf',
    route: 'GitHub releases latest',
    reviewMode: 'browser-public',
    reviewers: ['L1', 'Reviewer', 'Gemini'],
    status: 'pending',
    note: 'Review shelf truth, non-overclaim wording, and public inspection clarity.',
  },
  {
    id: 'public-distribution-packets',
    category: 'public-surface',
    surface: 'distribution packet mirrors',
    route: 'distribution/public-packets/**',
    reviewMode: 'repo-capture',
    reviewers: ['L1', 'Reviewer'],
    status: 'pending',
    note: 'Codex / Claude Code / packet mirror honesty and side-shelf containment.',
  },
];

const externalReviewEntries: ReviewSurfaceEntry[] = [
  {
    id: 'external-designer-pass',
    category: 'external-review',
    surface: 'designer visual pass',
    reviewMode: 'external-judge',
    reviewers: ['Designer'],
    status: 'partially-reviewed',
    note: 'Design-only critique over fresh captures and public first-touch surfaces.',
  },
  {
    id: 'external-reviewer-pass',
    category: 'external-review',
    surface: 'reviewer blocker pass',
    reviewMode: 'external-judge',
    reviewers: ['Reviewer'],
    status: 'partially-reviewed',
    note: 'Blocker-only read against UI/public-surface semantics and verification honesty.',
  },
  {
    id: 'external-gemini-pass',
    category: 'external-review',
    surface: 'Gemini visual pass',
    reviewMode: 'external-judge',
    reviewers: ['Gemini'],
    status: 'partially-reviewed',
    note: 'Chrome side-panel review using shared screenshot/tab context; final verdict still pending richer prompt/response capture.',
  },
  {
    id: 'external-stitch-pass',
    category: 'external-review',
    surface: 'Stitch-native review',
    reviewMode: 'external-judge',
    reviewers: ['Stitch'],
    status: 'blocked-external',
    note: 'Current environment still lacks Stitch auth/export, so only repo-local fallback artifacts are available.',
  },
];

function buildExtensionUiEntries(): ReviewSurfaceEntry[] {
  const storeEntries = Object.values(storeCatalog)
    .map((entry) => [
      {
        id: `${entry.appId}-popup-en`,
        category: 'extension-ui' as const,
        appId: entry.appId,
        publicName: entry.publicName,
        surface: 'popup',
        locale: 'en',
        route: `${entry.appId}/popup.html`,
        reviewMode: 'manual-installed-chrome' as const,
        reviewers: ['L1', 'Designer', 'Reviewer', 'Gemini'],
        status: 'pending' as const,
        note: 'Real extension popup in installed Chrome state.',
      },
      {
        id: `${entry.appId}-sidepanel-en`,
        category: 'extension-ui' as const,
        appId: entry.appId,
        publicName: entry.publicName,
        surface: 'sidepanel',
        locale: 'en',
        route: `${entry.appId}/sidepanel.html`,
        reviewMode: 'manual-installed-chrome' as const,
        reviewers: ['L1', 'Designer', 'Reviewer', 'Gemini'],
        status: 'pending' as const,
        note: 'Real extension sidepanel in installed Chrome state.',
      },
    ])
    .flat();

  return [
    ...storeEntries,
    {
      id: 'ext-shopping-suite-popup-en',
      category: 'extension-ui',
      appId: 'ext-shopping-suite',
      publicName: 'Shopflow Suite',
      surface: 'popup',
      locale: 'en',
      route: 'ext-shopping-suite/popup.html',
      reviewMode: 'manual-installed-chrome',
      reviewers: ['L1', 'Designer', 'Reviewer', 'Gemini'],
      status: 'pending',
      note: 'Suite popup in installed Chrome state.',
    },
    {
      id: 'ext-shopping-suite-sidepanel-en',
      category: 'extension-ui',
      appId: 'ext-shopping-suite',
      publicName: 'Shopflow Suite',
      surface: 'sidepanel',
      locale: 'en',
      route: 'ext-shopping-suite/sidepanel.html',
      reviewMode: 'manual-installed-chrome',
      reviewers: ['L1', 'Designer', 'Reviewer', 'Gemini'],
      status: 'pending',
      note: 'Suite lobby sidepanel in installed Chrome state.',
    },
    {
      id: 'ext-shopping-suite-sidepanel-zh-CN',
      category: 'extension-ui',
      appId: 'ext-shopping-suite',
      publicName: 'Shopflow Suite',
      surface: 'sidepanel',
      locale: 'zh-CN',
      route: 'ext-shopping-suite/sidepanel.html?locale=zh-CN',
      reviewMode: 'manual-installed-chrome',
      reviewers: ['L1', 'Designer'],
      status: 'pending',
      note: 'Suite zh-CN surface and locale fit in installed Chrome state.',
    },
  ];
}

export function buildUiuxReviewMatrix(outputPath = resolveFromRepo('.runtime-cache/uiux-review-matrix-latest.json')): UiuxReviewMatrix {
  const extensionUiEntries = buildExtensionUiEntries();
  const entries = [
    ...extensionUiEntries,
    ...publicSurfaceEntries,
    ...externalReviewEntries,
  ];

  return {
    generatedAt: new Date().toISOString(),
    outputPath,
    summary: {
      extensionUiEntries: extensionUiEntries.length,
      publicSurfaceEntries: publicSurfaceEntries.length,
      externalReviewEntries: externalReviewEntries.length,
    },
    entries,
  };
}

export async function writeUiuxReviewMatrix(outputPath?: string) {
  const matrix = buildUiuxReviewMatrix(outputPath);
  writeFileAtomically(matrix.outputPath, `${JSON.stringify(matrix, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(matrix, null, 2)}\n`);
  return matrix;
}

if (import.meta.url === new URL(import.meta.url).href && process.argv[1] != null) {
  const isDirect = new URL(import.meta.url).pathname.endsWith(process.argv[1]);
  if (isDirect) {
    await writeUiuxReviewMatrix(process.argv[2] ? resolve(repoRoot, process.argv[2]) : undefined);
  }
}
