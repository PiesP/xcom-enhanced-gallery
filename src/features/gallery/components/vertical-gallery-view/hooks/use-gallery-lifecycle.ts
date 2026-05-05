/**
 * @fileoverview Lifecycle management: animations, video cleanup, viewport tracking.
 * Three coordinated effects: scroll setup, animation timing, viewport observer.
 */

import { ensureGalleryScrollAvailable } from '@shared/dom/ensure-gallery-scroll';
import { observeViewportCssVars } from '@shared/dom/viewport';
import { logger } from '@shared/logging/logger';
import { animateGalleryEnter, animateGalleryExit } from '@shared/utils/css/css-animations';
import { createEffect, on, onCleanup } from 'solid-js';

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

        if (visible) {
          animateGalleryEnter(container);
        } else {
          animateGalleryExit(container);

          const logCleanupFailure = (error: unknown) => {
            if (__DEV__) logger.warn('video cleanup failed', { error });
          };

          const videos = container.querySelectorAll('video');
          videos.forEach((video) => {
            try { video.pause(); } catch (error) { logCleanupFailure(error); }
            try { if (video.currentTime !== 0) video.currentTime = 0; } catch (error) { logCleanupFailure(error); }
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
