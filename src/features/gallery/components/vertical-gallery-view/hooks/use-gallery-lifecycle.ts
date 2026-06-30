// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Lifecycle management: animations, video cleanup, viewport tracking.
 * Three coordinated effects: scroll setup, animation timing, viewport observer.
 */

import { observeViewportCssVars } from '@shared/dom/viewport';
import { logger } from '@shared/logging/logger';
import { animateGalleryEnter, animateGalleryExit } from '@shared/utils/css/css-animations';
import { createEffect, on, onCleanup } from 'solid-js';

/**
 * Ensure gallery and content containers have scrollable overflow enabled.
 */
function ensureGalleryScrollAvailable(element: HTMLElement | null): void {
  if (!element) return;

  // Only [role="list"] matches — the items container in VerticalGalleryView
  // uses <div role="list">. The other selectors were vestigial from an
  // earlier iteration that used plain class names (.itemsList, .content).
  const scrollableElements = element.querySelectorAll('[role="list"]') as NodeListOf<HTMLElement>;

  scrollableElements.forEach((el) => {
    if (el.style.overflowY !== 'auto' && el.style.overflowY !== 'scroll') {
      el.style.overflowY = 'auto';
    }
  });
}

interface UseGalleryLifecycleOptions {
  readonly containerEl: () => HTMLDivElement | null;
  readonly toolbarWrapperEl: () => HTMLDivElement | null;
  readonly isVisible: () => boolean;
}

export function useGalleryLifecycle(options: UseGalleryLifecycleOptions): void {
  const { containerEl, toolbarWrapperEl, isVisible } = options;

  // Effect 1: Scroll setup on container mount
  createEffect(
    on(containerEl, (element) => {
      if (element) ensureGalleryScrollAvailable(element);
    })
  );

  // Effect 2: Enter/exit animations + video cleanup on visibility change
  createEffect(
    on(
      [containerEl, isVisible],
      ([container, visible]) => {
        if (!container) return;

        // Respect prefers-reduced-motion: skip JS-driven animation
        const prefersReducedMotion =
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        if (prefersReducedMotion) return;

        if (visible) {
          animateGalleryEnter(container).catch(() => {});
        } else {
          animateGalleryExit(container).catch(() => {});

          const logCleanupFailure = (error: unknown) => {
            if (__DEV__) logger.warn('video cleanup failed', { error });
          };

          const videos = container.querySelectorAll('video');
          videos.forEach((video) => {
            try {
              video.pause();
            } catch (error) {
              logCleanupFailure(error);
            }
            try {
              if (video.currentTime !== 0) video.currentTime = 0;
            } catch (error) {
              logCleanupFailure(error);
            }
          });
        }
      },
      { defer: true }
    )
  );

  // Effect 3: Viewport CSS var sync via ResizeObserver
  createEffect(() => {
    const container = containerEl();
    const wrapper = toolbarWrapperEl();
    if (!container || !wrapper) return;

    const cleanup = observeViewportCssVars(container, () => {
      const toolbarHeight = wrapper ? Math.floor(wrapper.getBoundingClientRect().height) : 0;
      return { toolbarHeight, paddingTop: 0, paddingBottom: 0 } as const;
    });

    onCleanup(() => cleanup?.());
  });
}
