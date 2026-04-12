// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCurrentHash } from '../../packages/ui/src/use-current-hash';

function HashProbe() {
  const hash = useCurrentHash();
  return <output data-testid="hash-probe">{hash}</output>;
}

describe('useCurrentHash', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    window.location.hash = '';
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    window.location.hash = '';
  });

  it('reads the current hash on mount and updates when the hash changes', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    window.location.hash = '#claim-readiness-board';

    await act(async () => {
      root.render(<HashProbe />);
    });

    expect(container.textContent).toBe('#claim-readiness-board');
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'hashchange',
      expect.any(Function)
    );

    const registeredHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === 'hashchange'
    )?.[1] as EventListener;

    window.location.hash = '#verified-scope-ext-albertsons';
    await act(async () => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(container.textContent).toBe('#verified-scope-ext-albertsons');

    await act(async () => {
      root.unmount();
    });

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'hashchange',
      registeredHandler
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('falls back to an empty string when no hash is present yet', async () => {
    await act(async () => {
      root.render(<HashProbe />);
    });

    expect(container.textContent).toBe('');
  });
});
