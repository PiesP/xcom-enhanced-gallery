import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { waitFor } from '@test-utils/testing-library';

import { renderSolidToastHost } from '@/features/notifications/solid/renderSolidToastHost';
import { toastManager } from '@/shared/services/UnifiedToastManager';

describe('FRAME-ALT-001 Stage C — Solid toast bridge parity', () => {
  let hostContainer: ReturnType<typeof document.createElement>;
  let disposeHost: (() => void) | undefined;

  beforeEach(() => {
    hostContainer = document.createElement('div');
    document.body.appendChild(hostContainer);
    toastManager.clear();
    disposeHost = undefined;
  });

  afterEach(async () => {
    try {
      disposeHost?.();
    } finally {
      toastManager.clear();
      hostContainer.remove();
    }
  });

  it('renders toast items when ToastManager emits toast-only payloads', async () => {
    const instance = renderSolidToastHost({
      container: hostContainer,
      position: 'top-right',
      maxToasts: 3,
      testId: 'solid-toast-host',
    });
    disposeHost = instance.dispose;

    const toastId = toastManager.show({
      title: 'Download ready',
      message: 'Zip file prepared successfully',
      type: 'success',
      route: 'toast-only',
      duration: 250,
    });

    await waitFor(() => {
      const nodes = hostContainer.querySelectorAll('[data-xeg-solid-toast=""]');
      expect(nodes.length).toBe(1);
      const toastNode = nodes[0];
      expect(toastNode.textContent).toContain('Zip file prepared successfully');
      expect(toastNode.getAttribute('data-toast-id')).toBe(toastId);
    });

    toastManager.remove(toastId);

    await waitFor(() => {
      const nodes = hostContainer.querySelectorAll('[data-xeg-solid-toast=""]');
      expect(nodes.length).toBe(0);
    });
  });

  it('respects maxToasts limit by only rendering the latest entries', async () => {
    const instance = renderSolidToastHost({
      container: hostContainer,
      position: 'bottom-left',
      maxToasts: 2,
    });
    disposeHost = instance.dispose;

    const ids = [
      toastManager.show({ title: 'T1', message: 'M1', type: 'error', route: 'both' }),
      toastManager.show({ title: 'T2', message: 'M2', type: 'error', route: 'both' }),
      toastManager.show({ title: 'T3', message: 'M3', type: 'error', route: 'both' }),
    ];

    await waitFor(() => {
      const nodes = hostContainer.querySelectorAll('[data-xeg-solid-toast=""]');
      expect(nodes.length).toBe(2);
      const renderedIds = Array.from(nodes).map(node => node.getAttribute('data-toast-id'));
      expect(renderedIds).toStrictEqual(ids.slice(-2));
    });
  });

  it('automatically clears timeout-bound toasts after their duration', async () => {
    const instance = renderSolidToastHost({
      container: hostContainer,
      position: 'top-right',
      maxToasts: 5,
    });
    disposeHost = instance.dispose;

    toastManager.show({
      title: 'Auto dismiss',
      message: 'This toast should disappear',
      type: 'error',
      route: 'both',
      duration: 50,
    });

    await waitFor(() => {
      const nodes = hostContainer.querySelectorAll('[data-xeg-solid-toast=""]');
      expect(nodes.length).toBe(1);
    });

    await waitFor(() => {
      const nodes = hostContainer.querySelectorAll('[data-xeg-solid-toast=""]');
      expect(nodes.length).toBe(0);
    });
  });
});
