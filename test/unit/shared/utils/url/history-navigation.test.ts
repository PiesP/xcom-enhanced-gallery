// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { installHistoryNavigationFallback } from '@shared/utils/url/history-navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('installHistoryNavigationFallback', () => {
  let uninstall: (() => void) | undefined;

  beforeEach(() => {
    window.history.replaceState({}, '', '/settings');
  });

  afterEach(() => {
    uninstall?.();
    uninstall = undefined;
  });

  it('starts the app after pushState moves from settings to a timeline', () => {
    const start = vi.fn();
    const cleanup = vi.fn();
    uninstall = installHistoryNavigationFallback((url) => {
      if (new URL(url).pathname.startsWith('/settings')) cleanup();
      else start();
    });

    window.history.pushState({}, '', '/home');

    expect(start).toHaveBeenCalledOnce();
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('cleans up after replaceState moves from a timeline to an excluded path', () => {
    window.history.replaceState({}, '', '/home');
    const start = vi.fn();
    const cleanup = vi.fn();
    uninstall = installHistoryNavigationFallback((url) => {
      if (new URL(url).pathname.startsWith('/settings')) cleanup();
      else start();
    });

    window.history.replaceState({}, '', '/settings/account');

    expect(cleanup).toHaveBeenCalledOnce();
    expect(start).not.toHaveBeenCalled();
  });

  it('reports popstate navigation', () => {
    const onNavigate = vi.fn();
    uninstall = installHistoryNavigationFallback(onNavigate);

    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(onNavigate).toHaveBeenCalledWith(window.location.href);
  });

  it('restores history methods and removes the listener when uninstalled', () => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    const onNavigate = vi.fn();
    uninstall = installHistoryNavigationFallback(onNavigate);

    uninstall();
    uninstall = undefined;

    expect(window.history.pushState).toBe(originalPushState);
    expect(window.history.replaceState).toBe(originalReplaceState);
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
