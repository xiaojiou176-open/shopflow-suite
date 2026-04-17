import { describe, expect, it } from 'vitest';

type LiveReceiptTarget = {
  label: string;
  url: string;
  expectedText: string;
};

const liveReceiptTargets: LiveReceiptTarget[] = [
  {
    label: 'Pages front door',
    url: 'https://xiaojiou176-open.github.io/shopflow-suite/',
    expectedText: 'Chrome-first shopping extension family.',
  },
  {
    label: 'Product boundary',
    url: 'https://xiaojiou176-open.github.io/shopflow-suite/adr/ADR-001-shopflow-repo-topology-and-product-boundary.html',
    expectedText: 'ADR-001: Shopflow Repo Topology and Product Boundary',
  },
  {
    label: 'Verification boundary',
    url: 'https://xiaojiou176-open.github.io/shopflow-suite/contracts/testing-and-verification-bar.html',
    expectedText: 'Testing and Verification Bar',
  },
  {
    label: 'Builder Start Here',
    url: 'https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/builder-start-here.html',
    expectedText: 'Builder Start Here',
  },
  {
    label: 'Agent Quickstarts',
    url: 'https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/agent-quickstarts.html',
    expectedText: 'Agent Quickstarts',
  },
  {
    label: 'Release Artifact Review Runbook',
    url: 'https://xiaojiou176-open.github.io/shopflow-suite/runbooks/release-artifact-review.html',
    expectedText: 'Release Artifact Review Runbook',
  },
];

async function expectLiveHtmlReceipt(target: LiveReceiptTarget) {
  const response = await fetch(target.url, {
    headers: { 'user-agent': 'shopflow-front-door-live-guard' },
    redirect: 'follow',
  });

  expect(response.status, `${target.label} should return HTTP 200`).toBe(200);

  const contentType = response.headers.get('content-type') ?? '';
  expect(
    contentType,
    `${target.label} should resolve to a text/html page`
  ).toContain('text/html');

  const html = await response.text();
  expect(
    html,
    `${target.label} should not degrade into a generic Pages 404 shell`
  ).not.toContain("There isn't a GitHub Pages site here.");
  expect(
    html,
    `${target.label} should keep its page-specific marker text`
  ).toContain(target.expectedText);
}

describe('live public front door receipts', () => {
  it(
    'keeps the public Pages product-first routes reachable as real HTML pages',
    async () => {
      for (const target of liveReceiptTargets) {
        await expectLiveHtmlReceipt(target);
      }
    },
    30_000
  );
});
