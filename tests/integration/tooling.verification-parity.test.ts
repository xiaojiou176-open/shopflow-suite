import {
  publicClaimBoundaries,
  storeCatalog,
  type StoreVerificationCatalogEntry,
} from '@shopflow/contracts';
import { describe, expect, it } from 'vitest';
import {
  collectVerificationParityIssues,
  collectStructuredVerificationParityIssues,
  type VerificationParityAppDefinition,
} from '../../tooling/verification/check-verification-parity';

describe('tooling verification parity', () => {
  it('keeps verification catalog wiring aligned with repo reality', () => {
    expect(collectVerificationParityIssues()).toEqual([]);
  });

  it('calls out host match drift and unreadable reviewer start-path drift', () => {
    const temuEntry = {
      appId: 'ext-temu',
      storeId: 'temu',
      publicName: 'Shopflow for Temu',
      wave: 'Wave 2',
      tier: 'storefront-shell',
      claimState: 'repo-verified',
      releaseChannel: 'storefront-shell-candidate',
      appDir: 'apps/ext-temu',
      storePackageDir: 'packages/store-temu',
      contractTestPath: 'tests/contract/store-temu.contract.test.ts',
      e2eSmokePath: 'tests/e2e/ext-temu.smoke.spec.ts',
      fixtureDirectories: ['tests/fixtures/temu/product'],
      requiredEvidenceCaptureIds: ['temu-live-receipt'],
      requiresVerifiedScopeCopy: false,
    } satisfies StoreVerificationCatalogEntry;

    const driftedTemuDefinition = {
      appId: 'ext-temu',
      storeId: 'temu',
      title: 'Shopflow for Temu',
      summary: 'Differentiated shell that still needs live receipt evidence.',
      hostMatches: ['*://m.temu.com/*'],
      requiredEvidence: [{ captureId: 'temu-live-receipt' }],
    } satisfies VerificationParityAppDefinition;

    const issues = collectVerificationParityIssues({
      verificationEntries: [temuEntry],
      storeEntries: [temuEntry],
      storeCatalogMap: {
        ...storeCatalog,
        temu: {
          ...storeCatalog.temu,
          defaultHosts: ['www.temu.com'],
          hostPatterns: ['*://www.temu.com/*'],
        },
      },
      publicClaimBoundaryMap: {
        ...publicClaimBoundaries,
      },
      appDefinitionsById: {
        'ext-temu': driftedTemuDefinition,
      },
      suiteDefinition: {
        appId: 'ext-shopping-suite',
        mode: 'internal-alpha',
        guardrails: ['No public claim', 'No second logic plane'],
      },
      pathExists: () => true,
      fixtureDirectoryHasHtml: () => true,
      readPackageJson: () => ({
        name: '@shopflow/ext-temu',
        scripts: {
          build: 'build',
          test: 'test',
          zip: 'zip',
        },
      }),
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\[claim-boundary\].*host match drift/i),
        expect.stringMatching(/\[review-start-path\].*default review host/i),
      ])
    );
  });

  it('keeps app-scoped parity issues machine-readable for downstream reporting', () => {
    const temuEntry = {
      appId: 'ext-temu',
      storeId: 'temu',
      publicName: 'Shopflow for Temu',
      wave: 'Wave 2',
      tier: 'storefront-shell',
      claimState: 'repo-verified',
      releaseChannel: 'storefront-shell-candidate',
      appDir: 'apps/ext-temu',
      storePackageDir: 'packages/store-temu',
      contractTestPath: 'tests/contract/store-temu.contract.test.ts',
      e2eSmokePath: 'tests/e2e/ext-temu.smoke.spec.ts',
      fixtureDirectories: ['tests/fixtures/temu/product'],
      requiredEvidenceCaptureIds: [],
      requiresVerifiedScopeCopy: false,
    } satisfies StoreVerificationCatalogEntry;

    const issues = collectStructuredVerificationParityIssues({
      verificationEntries: [temuEntry],
      storeEntries: [temuEntry],
      storeCatalogMap: {
        ...storeCatalog,
        temu: {
          ...storeCatalog.temu,
          defaultHosts: ['www.temu.com'],
          hostPatterns: ['*://www.temu.com/*'],
        },
      },
      publicClaimBoundaryMap: publicClaimBoundaries,
      appDefinitionsById: {
        'ext-temu': {
          appId: 'ext-temu',
          storeId: 'temu',
          title: 'Shopflow for Temu',
          summary: 'Temu shell summary without overclaiming.',
          hostMatches: ['*://m.temu.com/*'],
        },
      },
      suiteDefinition: {
        appId: 'ext-shopping-suite',
        mode: 'internal-alpha',
        guardrails: ['No public claim', 'No second logic plane'],
      },
      pathExists: () => true,
      fixtureDirectoryHasHtml: () => true,
      readPackageJson: () => ({
        name: '@shopflow/ext-temu',
        scripts: {
          build: 'build',
          test: 'test',
          zip: 'zip',
        },
      }),
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          appId: 'ext-temu',
          category: 'claim-boundary',
        }),
        expect.objectContaining({
          appId: 'ext-temu',
          category: 'review-start-path',
        }),
      ])
    );
  });

  it('treats path-specific family review routes as host-covered instead of reviewer-start-path drift', () => {
    const albertsonsEntry = {
      appId: 'ext-albertsons',
      storeId: 'albertsons',
      publicName: 'Shopflow for Albertsons Family',
      wave: 'Wave 1',
      tier: 'capability-heavy-product',
      claimState: 'repo-verified',
      releaseChannel: 'capability-heavy-candidate',
      appDir: 'apps/ext-albertsons',
      storePackageDir: 'packages/store-albertsons',
      contractTestPath: 'tests/contract/store-albertsons.contract.test.ts',
      e2eSmokePath: 'tests/e2e/ext-albertsons.smoke.spec.ts',
      fixtureDirectories: ['tests/fixtures/albertsons/search'],
      requiredEvidenceCaptureIds: ['safeway-subscribe-live-receipt'],
      requiresVerifiedScopeCopy: true,
    } satisfies StoreVerificationCatalogEntry;

    const issues = collectStructuredVerificationParityIssues({
      verificationEntries: [albertsonsEntry],
      storeEntries: [albertsonsEntry],
      storeCatalogMap: {
        ...storeCatalog,
        albertsons: {
          ...storeCatalog.albertsons,
          defaultHosts: ['www.vons.com'],
          hostPatterns: ['*://*.vons.com/shop/search-results*'],
        },
      },
      publicClaimBoundaryMap: {
        ...publicClaimBoundaries,
        albertsons: {
          ...publicClaimBoundaries.albertsons,
          verifiedScopeCopy: 'Currently verified on Safeway.',
        },
      },
      appDefinitionsById: {
        'ext-albertsons': {
          appId: 'ext-albertsons',
          storeId: 'albertsons',
          title: 'Shopflow for Albertsons Family',
          summary:
            'Albertsons family shell remains repo-verified and live receipt gated. Currently verified on Safeway.',
          hostMatches: ['*://www.vons.com/shop/search-results*'],
          verifiedScopeCopy: 'Currently verified on Safeway.',
          requiredEvidence: [{ captureId: 'safeway-subscribe-live-receipt' }],
        },
      },
      suiteDefinition: {
        appId: 'ext-shopping-suite',
        mode: 'internal-alpha',
        guardrails: ['No public claim', 'No second logic plane'],
      },
      pathExists: () => true,
      fixtureDirectoryHasHtml: () => true,
      readPackageJson: () => ({
        name: '@shopflow/ext-albertsons',
        scripts: {
          build: 'build',
          test: 'test',
          zip: 'zip',
        },
      }),
    });

    expect(
      issues.some((issue) => issue.category === 'review-start-path')
    ).toBe(false);
  });

  it('flags path drift when the app host match changes route shape on the same family host', () => {
    const albertsonsEntry = {
      appId: 'ext-albertsons',
      storeId: 'albertsons',
      publicName: 'Shopflow for Albertsons Family',
      wave: 'Wave 1',
      tier: 'capability-heavy-product',
      claimState: 'repo-verified',
      releaseChannel: 'capability-heavy-candidate',
      appDir: 'apps/ext-albertsons',
      storePackageDir: 'packages/store-albertsons',
      contractTestPath: 'tests/contract/store-albertsons.contract.test.ts',
      e2eSmokePath: 'tests/e2e/ext-albertsons.smoke.spec.ts',
      fixtureDirectories: ['tests/fixtures/albertsons/search'],
      requiredEvidenceCaptureIds: ['safeway-subscribe-live-receipt'],
      requiresVerifiedScopeCopy: true,
    } satisfies StoreVerificationCatalogEntry;

    const issues = collectStructuredVerificationParityIssues({
      verificationEntries: [albertsonsEntry],
      storeEntries: [albertsonsEntry],
      storeCatalogMap: {
        ...storeCatalog,
        albertsons: {
          ...storeCatalog.albertsons,
          hostPatterns: ['*://*.vons.com/shop/search-results*'],
        },
      },
      publicClaimBoundaryMap: {
        ...publicClaimBoundaries,
        albertsons: {
          ...publicClaimBoundaries.albertsons,
          verifiedScopeCopy: 'Currently verified on Safeway.',
        },
      },
      appDefinitionsById: {
        'ext-albertsons': {
          appId: 'ext-albertsons',
          storeId: 'albertsons',
          title: 'Shopflow for Albertsons Family',
          summary:
            'Albertsons family shell remains repo-verified and live receipt gated. Currently verified on Safeway.',
          hostMatches: ['*://www.vons.com/pharmacy*'],
          verifiedScopeCopy: 'Currently verified on Safeway.',
          requiredEvidence: [{ captureId: 'safeway-subscribe-live-receipt' }],
        },
      },
      suiteDefinition: {
        appId: 'ext-shopping-suite',
        mode: 'internal-alpha',
        guardrails: ['No public claim', 'No second logic plane'],
      },
      pathExists: () => true,
      fixtureDirectoryHasHtml: () => true,
      readPackageJson: () => ({
        name: '@shopflow/ext-albertsons',
        scripts: {
          build: 'build',
          test: 'test',
          zip: 'zip',
        },
      }),
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          appId: 'ext-albertsons',
          category: 'claim-boundary',
        }),
      ])
    );
  });
});
