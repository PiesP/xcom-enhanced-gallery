import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  toastManager,
  addToast,
  removeToast,
  clearAllToasts,
} from '@shared/services/UnifiedToastManager';

const resetToasts = () => {
  toastManager.clear();
};

describe('UnifiedToastManager Solid integration', () => {
  beforeEach(() => {
    resetToasts();
  });

  it('updates the Solid accessor when showing and removing toasts', () => {
    const toastId = toastManager.show({
      title: 'Hello',
      message: 'World',
      type: 'info',
      route: 'toast-only',
    });

    expect(toastManager.signal.accessor()).toHaveLength(1);
    expect(toastManager.signal.accessor()[0]?.id).toBe(toastId);

    toastManager.remove(toastId);
    expect(toastManager.signal.accessor()).toHaveLength(0);
  });

  it('notifies subscribers about toast list changes', () => {
    const listener = vi.fn();
    const unsubscribe = toastManager.subscribe(listener);

    const toastId = toastManager.show({
      title: 'Info',
      message: 'Message',
      type: 'info',
      route: 'toast-only',
    });
    toastManager.remove(toastId);

    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    toastManager.show({
      title: 'Ignored',
      message: 'After unsubscribe',
      type: 'warning',
      route: 'toast-only',
    });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('delegates helper functions to the unified manager', () => {
    const infoId = addToast({
      title: 'Legacy Info',
      message: 'Delegated to manager',
      type: 'info',
    });

    expect(toastManager.signal.accessor()).toHaveLength(1);

    removeToast(infoId);
    expect(toastManager.signal.accessor()).toHaveLength(0);

    addToast({ title: 'Another', message: 'Toast', type: 'success' });
    expect(toastManager.signal.accessor()).toHaveLength(1);
    clearAllToasts();
    expect(toastManager.signal.accessor()).toHaveLength(0);
  });
});
