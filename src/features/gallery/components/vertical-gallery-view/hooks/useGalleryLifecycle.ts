/**
 * @fileoverview Gallery lifecycle hook
 * @description Manages gallery animations, video cleanup, and container setup
 * @module features/gallery/components/vertical-gallery-view/hooks/useGalleryLifecycle
 * @version 1.0.0
 */

import { ensureGalleryScrollAvailable } from '@edge/dom/ensure-gallery-scroll';
import { observeViewportCssVars } from '@shared/dom/viewport';
import { logger } from '@shared/logging';
import { animateGalleryEnter, animateGalleryExit } from '@shared/utils/css/css-animations';
import { createEffect, on, onCleanup } from 'solid-js';

/**
 * Options for gallery lifecycle hook
 */
export interface UseGalleryLifecycleOptions {
  /** Container element accessor */
  readonly containerEl: () => HTMLDivElement | null;
  /** Toolbar wrapper element accessor */
  readonly toolbarWrapperEl: () => HTMLDivElement | null;
  /** Whether gallery is visible */
  readonly isVisible: () => boolean;
}

/**
 * Hook to manage gallery lifecycle behaviors
 *
 * Consolidated responsibilities:
 * - Container scroll setup
 * - Enter/exit animations
 * - Video cleanup on close
 * - Viewport CSS variables observation
 *
 * @param options - Hook configuration
 */
export function useGalleryLifecycle(options: UseGalleryLifecycleOptions): void {
  const { containerEl, toolbarWrapperEl, isVisible } = options;

  // Container scroll setup
  createEffect(
    on(containerEl, (element) => {
      if (element) {
        ensureGalleryScrollAvailable(element);
      }
    })
  );

  // Combined animation and video cleanup effect
  createEffect(
    on(
      [containerEl, isVisible],
      ([container, visible]) => {
        if (!container) return;

        if (visible) {
          animateGalleryEnter(container);
        } else {
          // Gallery is closing - run exit animation and cleanup videos
          animateGalleryExit(container);

          // Video cleanup
          const logCleanupFailure = (error: unknown) => {
            if (__DEV__) {
              logger.warn('video cleanup failed', { error });
            }
          };

          const videos = container.querySelectorAll('video');
          videos.forEach((video) => {
            try {
              video.pause();
            } catch (error) {
              logCleanupFailure(error);
            }

            try {
              if (video.currentTime !== 0) {
                video.currentTime = 0;
              }
            } catch (error) {
              logCleanupFailure(error);
            }
          });
        }
      },
      { defer: true }
    )
  );

  // Viewport CSS variables observation
  createEffect(() => {
    const container = containerEl();
    const wrapper = toolbarWrapperEl();
    if (!container || !wrapper) return;

    const cleanup = observeViewportCssVars(container, () => {
      const toolbarHeight = wrapper ? Math.floor(wrapper.getBoundingClientRect().height) : 0;
      return { toolbarHeight, paddingTop: 0, paddingBottom: 0 } as const;
    });

    onCleanup(() => {
      cleanup?.();
    });
  });
}
