import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../../..');

export function primeContractFixtureDocument(
  targetDocument: Document,
  url: string
) {
  const normalizedUrl = new URL(url).toString();

  Object.defineProperty(targetDocument, 'URL', {
    configurable: true,
    value: normalizedUrl,
  });

  const priorFixtureBase = targetDocument.head.querySelector(
    'base[data-shopflow-fixture-base]'
  );
  priorFixtureBase?.remove();

  const base = targetDocument.createElement('base');
  base.setAttribute('data-shopflow-fixture-base', 'true');
  base.href = normalizedUrl;
  targetDocument.head.prepend(base);
}

export function loadContractFixture(relativePath: string, url: string) {
  const html = readFileSync(resolve(repoRoot, relativePath), 'utf8');
  const parsed = new DOMParser().parseFromString(html, 'text/html');

  document.documentElement.lang =
    parsed.documentElement.getAttribute('lang') ?? '';
  document.head.innerHTML = parsed.head.innerHTML;
  document.body.innerHTML = parsed.body.innerHTML;
  primeContractFixtureDocument(document, url);

  return {
    url: new URL(url),
    document,
  };
}
