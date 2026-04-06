type SidePanelChrome = {
  sidePanel?: {
    open(details: { tabId: number }): Promise<void> | void;
    setOptions(details: {
      enabled: boolean;
      path: string;
      tabId?: number;
    }): Promise<void> | void;
  };
};

function getGlobalChromeApi(): SidePanelChrome {
  return (globalThis as { chrome?: SidePanelChrome }).chrome ?? {};
}

export class SidePanelController {
  constructor(
    private readonly sidePanelPath = 'sidepanel.html',
    private readonly chromeApi: SidePanelChrome = getGlobalChromeApi()
  ) {}

  isSupported() {
    return Boolean(this.chromeApi.sidePanel);
  }

  async enableForTab(tabId: number) {
    const sidePanel = this.requireSidePanel();

    await sidePanel.setOptions({
      enabled: true,
      path: this.sidePanelPath,
      tabId,
    });
  }

  async disableForTab(tabId: number) {
    const sidePanel = this.requireSidePanel();

    await sidePanel.setOptions({
      enabled: false,
      path: this.sidePanelPath,
      tabId,
    });
  }

  async openForTab(tabId: number) {
    await this.enableForTab(tabId);
    await this.requireSidePanel().open({ tabId });
  }

  private requireSidePanel() {
    if (!this.chromeApi.sidePanel) {
      throw new Error(
        'chrome.sidePanel is unavailable; Wave 1 browser smoke must run in a Chrome build that exposes the Side Panel API.'
      );
    }

    return this.chromeApi.sidePanel;
  }
}
