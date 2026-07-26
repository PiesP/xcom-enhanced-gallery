// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Observe same-document navigation in browsers without the Navigation API.
 *
 * X.com updates the current URL through both History API methods, neither of
 * which emits popstate. The returned teardown restores the methods only while
 * this installation still owns them, so it does not overwrite later patches.
 */
export function installHistoryNavigationFallback(onNavigate: (url: string) => void): () => void {
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  const pushState: History['pushState'] = (data, unused, url) => {
    originalPushState.call(window.history, data, unused, url);
    onNavigate(window.location.href);
  };
  const replaceState: History['replaceState'] = (data, unused, url) => {
    originalReplaceState.call(window.history, data, unused, url);
    onNavigate(window.location.href);
  };
  const handlePopState = (): void => {
    onNavigate(window.location.href);
  };

  window.history.pushState = pushState;
  window.history.replaceState = replaceState;
  window.addEventListener('popstate', handlePopState);

  return () => {
    window.removeEventListener('popstate', handlePopState);
    if (window.history.pushState === pushState) {
      window.history.pushState = originalPushState;
    }
    if (window.history.replaceState === replaceState) {
      window.history.replaceState = originalReplaceState;
    }
  };
}
