import type {
  CapabilityId,
  CapabilityState,
  CapabilityStatus,
  DetectionResult,
  StoreAdapter,
  StoreId,
} from '@shopflow/contracts';
import {
  loadContractFixture,
  primeContractFixtureDocument,
} from './contract-fixture';
import { createHtmlFixture } from './html-fixture';

export function createPageKindFixture(
  pageKind: DetectionResult['pageKind'],
  body = ''
) {
  return createHtmlFixture(
    `<main data-page-kind="${pageKind}">${body}</main>`
  );
}

export function getCapabilityState(
  detection: DetectionResult,
  capability: CapabilityId
): CapabilityState {
  const state = detection.capabilityStates.find(
    (candidate) => candidate.capability === capability
  );

  if (!state) {
    throw new Error(`Missing capability state for ${capability}`);
  }

  return state;
}

export interface SimpleStorefrontDetectionSnapshot {
  matches: boolean;
  detection: DetectionResult;
  capabilityStatuses: Partial<Record<CapabilityId, CapabilityStatus>>;
}

export function createSimpleStorefrontContractHarness(
  storeId: StoreId,
  adapter: Pick<StoreAdapter, 'matches' | 'detect'>
) {
  return {
    inspectDetection(
      url: string,
      doc: Document
    ): SimpleStorefrontDetectionSnapshot {
      const parsedUrl = new URL(url);
      primeContractFixtureDocument(doc, parsedUrl.toString());
      const detection = adapter.detect(parsedUrl, doc);

      return {
        matches: adapter.matches(parsedUrl),
        detection,
        capabilityStatuses: Object.fromEntries(
          detection.capabilityStates.map((state) => [
            state.capability,
            state.status,
          ])
        ) as Partial<Record<CapabilityId, CapabilityStatus>>,
      };
    },
    loadFixture(relativePath: string, url: string) {
      return loadContractFixture(`tests/fixtures/${storeId}/${relativePath}`, url);
    },
  };
}
