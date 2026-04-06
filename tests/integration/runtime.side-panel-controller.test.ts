import { describe, expect, it } from 'vitest';
import { SidePanelController } from '../../packages/runtime/src/side-panel/side-panel-controller';

function createChromeApi() {
  return {
    sidePanel: {
      openCalls: [] as Array<{ tabId: number }>,
      optionCalls: [] as Array<{
        enabled: boolean;
        path: string;
        tabId?: number;
      }>,
      async open(details: { tabId: number }) {
        this.openCalls.push(details);
      },
      async setOptions(details: {
        enabled: boolean;
        path: string;
        tabId?: number;
      }) {
        this.optionCalls.push(details);
      },
    },
  };
}

describe('side panel controller', () => {
  it('enables and opens the side panel for the active tab', async () => {
    const chromeApi = createChromeApi();
    const controller = new SidePanelController('sidepanel.html', chromeApi);

    await controller.openForTab(9);

    expect(chromeApi.sidePanel.optionCalls).toEqual([
      {
        enabled: true,
        path: 'sidepanel.html',
        tabId: 9,
      },
    ]);
    expect(chromeApi.sidePanel.openCalls).toEqual([{ tabId: 9 }]);
  });

  it('can disable a tab explicitly when support is unavailable', async () => {
    const chromeApi = createChromeApi();
    const controller = new SidePanelController('sidepanel.html', chromeApi);

    await controller.disableForTab(4);

    expect(chromeApi.sidePanel.optionCalls).toEqual([
      {
        enabled: false,
        path: 'sidepanel.html',
        tabId: 4,
      },
    ]);
  });

  it('throws an explicit error when the Side Panel API is missing', async () => {
    const controller = new SidePanelController('sidepanel.html', {});

    await expect(controller.openForTab(1)).rejects.toThrow(
      /chrome\.sidePanel is unavailable/
    );
  });
});
