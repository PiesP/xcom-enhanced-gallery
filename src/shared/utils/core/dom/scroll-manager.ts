/**
 * Page Scroll Lock Manager for X.com Enhanced Gallery
 *
 * Provides safe page-level scroll locking and restoration functionality for gallery modals.
 * Uses CSS-based approach to prevent background scroll while preserving visual position.
 *
 * This manager handles the main page scroll when gallery overlay is open.
 * For in-gallery scroll management, use GalleryScrollManager instead.
 */

import { logger } from '@infrastructure/logging/logger';
import { safeDom } from './safe-dom';

/**
 * Calculate scrollbar width for layout stability
 *
 * 갤러리 모달이 열릴 때 스크롤바가 사라지면서 발생하는 레이아웃 이동을 방지하기 위해
 * 브라우저의 스크롤바 너비를 측정합니다.
 *
 * @returns 현재 브라우저에서의 스크롤바 너비(픽셀). 스크롤바가 없는 경우 0을 반환
 */
export function calculateScrollbarWidth(): number {
  const outer = safeDom.createElement('div');
  if (!outer) {
    logger.error('Failed to create scrollbar measurement container');
    return 0;
  }

  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  outer.style.position = 'absolute';
  outer.style.width = '100px';
  outer.style.height = '100px';

  const inner = safeDom.createElement('div');
  if (!inner) {
    logger.error('Failed to create inner measurement container');
    return 0;
  }
  inner.style.width = '100%';
  inner.style.height = '100%';

  if (!safeDom.appendChild(outer, inner)) {
    logger.error('Failed to append inner container');
    return 0;
  }

  if (!safeDom.appendChild(document.body, outer)) {
    logger.error('Failed to append outer container to body');
    return 0;
  }

  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  safeDom.removeChild(document.body, outer);

  return scrollbarWidth;
}

/**
 * PageScrollLockManager class for managing background page scroll during gallery display
 * Uses CSS-only approach to prevent scroll without changing position
 */
export class PageScrollLockManager {
  private static instance: PageScrollLockManager | null = null;
  private isLocked = false;
  private originalOverflow = '';
  private originalPosition = '';
  private originalTop = '';
  private originalLeft = '';
  private originalWidth = '';
  private savedScrollTop = 0;
  private savedScrollLeft = 0;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PageScrollLockManager {
    PageScrollLockManager.instance ??= new PageScrollLockManager();
    return PageScrollLockManager.instance;
  }

  /**
   * Lock page scroll and preserve visual position
   * Uses position: fixed with top adjustment to maintain visual position
   *
   * @example
   * ```typescript
   * // Lock scroll when opening gallery
   * const manager = ScrollManager.getInstance();
   * manager.lock();
   * ```
   */
  lock(): void {
    if (this.isLocked) {
      logger.debug('Scroll already locked');
      return;
    }

    try {
      const body = document.body;

      // Save current scroll position
      this.savedScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      this.savedScrollLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;

      // Save original styles
      this.originalOverflow = body.style.overflow;
      this.originalPosition = body.style.position;
      this.originalTop = body.style.top;
      this.originalLeft = body.style.left;
      this.originalWidth = body.style.width;

      // Apply hybrid scroll lock with position preservation
      body.style.position = 'fixed';
      body.style.top = `-${this.savedScrollTop}px`;
      body.style.left = `-${this.savedScrollLeft}px`;
      body.style.width = '100%';
      body.style.overflow = 'hidden';

      this.isLocked = true;
      logger.debug('Scroll locked with position preservation', {
        scrollTop: this.savedScrollTop,
        scrollLeft: this.savedScrollLeft,
      });
    } catch (error) {
      logger.error('Failed to lock scroll:', error);
    }
  }

  /**
   * Unlock page scroll and restore position
   *
   * @example
   * ```typescript
   * // Unlock scroll when closing gallery
   * const manager = ScrollManager.getInstance();
   * manager.unlock();
   * ```
   */
  unlock(): void {
    if (!this.isLocked) {
      logger.debug('Scroll not locked');
      return;
    }

    try {
      const body = document.body;

      // Restore original styles
      body.style.position = this.originalPosition;
      body.style.top = this.originalTop;
      body.style.left = this.originalLeft;
      body.style.width = this.originalWidth;
      body.style.overflow = this.originalOverflow;

      // Restore scroll position
      window.scrollTo(this.savedScrollLeft, this.savedScrollTop);

      this.isLocked = false;
      this._resetState();

      logger.debug('Scroll unlocked and position restored', {
        scrollTop: this.savedScrollTop,
        scrollLeft: this.savedScrollLeft,
      });
    } catch (error) {
      logger.error('Failed to unlock scroll:', error);
    }
  }

  /**
   * Check if scroll is currently locked
   */
  isScrollLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Get saved scroll position
   */
  getSavedScrollPosition(): { top: number; left: number } {
    return {
      top: this.savedScrollTop,
      left: this.savedScrollLeft,
    };
  }

  /**
   * Force unlock (emergency cleanup)
   */
  forceUnlock(): void {
    if (this.isLocked) {
      logger.warn('Force unlocking scroll');
      this.isLocked = false;

      const body = document.body;
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.width = '';
      body.style.overflow = '';

      this._resetState();
    }
  }

  /**
   * Reset internal state
   * @private
   */
  private _resetState(): void {
    this.originalOverflow = '';
    this.originalPosition = '';
    this.originalTop = '';
    this.originalLeft = '';
    this.originalWidth = '';
    this.savedScrollTop = 0;
    this.savedScrollLeft = 0;
  }
}

/**
 * Utility functions for page scroll lock management
 */

/**
 * Get the default page scroll lock manager instance
 */
export function getPageScrollLockManager(): PageScrollLockManager {
  return PageScrollLockManager.getInstance();
}

/**
 * Lock background page scroll (for modal overlays)
 */
export function lockPageScroll(): void {
  PageScrollLockManager.getInstance().lock();
}

/**
 * Unlock background page scroll (for modal overlays)
 */
export function unlockPageScroll(): void {
  PageScrollLockManager.getInstance().unlock();
}

/**
 * Check if page scroll is locked
 */
export function isPageScrollLocked(): boolean {
  return PageScrollLockManager.getInstance().isScrollLocked();
}

/**
 * Smooth scroll to element
 */
export function scrollToElement(
  element: HTMLElement,
  options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'center' }
): void {
  try {
    element.scrollIntoView(options);
  } catch (error) {
    logger.warn('Failed to scroll to element:', error);
    // Fallback for older browsers
    element.scrollIntoView();
  }
}

/**
 * Get scroll position
 */
export function getScrollPosition(): { x: number; y: number } {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft || 0,
    y: window.pageYOffset || document.documentElement.scrollTop || 0,
  };
}

/**
 * Set scroll position
 */
export function setScrollPosition(x: number, y: number): void {
  try {
    window.scrollTo(x, y);
  } catch (error) {
    logger.warn('Failed to set scroll position:', error);
  }
}

/**
 * Cleanup function for page scroll lock
 */
export function cleanup(): void {
  const manager = PageScrollLockManager.getInstance();
  if (manager.isScrollLocked()) {
    manager.forceUnlock();
  }
}
