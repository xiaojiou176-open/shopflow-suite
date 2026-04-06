import type { DetectionResult } from '@shopflow/contracts';

export type SiteContextSnapshot = {
  appId: string;
  tabId: number;
  url: string;
  detection: DetectionResult;
};

export class SiteContextCoordinator {
  private readonly contexts = new Map<number, SiteContextSnapshot>();
  private readonly latestByApp = new Map<string, SiteContextSnapshot>();

  set(snapshot: SiteContextSnapshot) {
    this.contexts.set(snapshot.tabId, snapshot);
    this.latestByApp.set(snapshot.appId, snapshot);
  }

  get(tabId: number) {
    return this.contexts.get(tabId);
  }

  getLatestForApp(appId: string) {
    return this.latestByApp.get(appId);
  }
}
