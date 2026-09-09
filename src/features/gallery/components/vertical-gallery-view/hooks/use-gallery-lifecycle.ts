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

  const scrollableElements = element.querySelectorAll(
    '[data-gallery-element="items"]'
  ) as NodeListOf<HTMLElement>;

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
  readonly onViewportApplied?: () => void;
}

export function useGalleryLifecycle(options: UseGalleryLifecycleOptions): void {
  const { containerEl, toolbarWrapperEl, isVisible, onViewportApplied } = options;

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

        // Respect prefers-reduced-motion for animation only. Media cleanup is
        // independent of motion preferences and must always run on close.
        const prefersReducedMotion =
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

        if (visible) {
          if (!prefersReducedMotion) animateGalleryEnter(container).catch(() => {});
        } else {
          if (!prefersReducedMotion) animateGalleryExit(container).catch(() => {});

          const logCleanupFailure = (error: unknown) => {
            __DEV__ && logger.warn('video cleanup failed', { error });
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
  createEffect(
    on([containerEl, toolbarWrapperEl], ([container, wrapper]) => {
      if (!container || !wrapper) return;

      // Initial alignment reads scroll/focus state. Those reads must not
      // recreate this observer when a user scrolls or changes the focused item.
      const cleanup = observeViewportCssVars(
        container,
        () => {
          const toolbarHeight = Math.floor(wrapper.getBoundingClientRect().height);
          return { toolbarHeight, paddingTop: 0, paddingBottom: 0 } as const;
        },
        onViewportApplied
      );

      onCleanup(cleanup);
    })
  );
}
