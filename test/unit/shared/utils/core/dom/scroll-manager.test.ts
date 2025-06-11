/**
 * Page Scroll Lock Manager Unit Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PageScrollLockManager } from '../../../../../../src/shared/utils/core/dom/scroll-manager';

// Mock 설정
const mockScrollTo = vi.fn();
const mockWindow = {
  pageYOffset: 0,
  pageXOffset: 0,
  scrollTo: mockScrollTo,
};

const mockDocument = {
  documentElement: {
    scrollTop: 0,
    scrollLeft: 0,
  },
  body: {
    style: {
      position: '',
      top: '',
      left: '',
      width: '',
      overflow: '',
    },
  },
};

describe('PageScrollLockManager', () => {
  let scrollManager: PageScrollLockManager;

  beforeEach(() => {
    vi.clearAllMocks();
    global.window = mockWindow as any;
    global.document = mockDocument as any;

    mockDocument.body.style = {
      position: '',
      top: '',
      left: '',
      width: '',
      overflow: '',
    };

    scrollManager = PageScrollLockManager.getInstance();
  });

  afterEach(() => {
    if (scrollManager.isScrollLocked()) {
      scrollManager.forceUnlock();
    }
    (PageScrollLockManager as any).instance = null;
  });

  describe('Basic Functionality', () => {
    it('should create singleton instance', () => {
      const instance1 = PageScrollLockManager.getInstance();
      const instance2 = PageScrollLockManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should lock and unlock scroll', () => {
      mockWindow.pageYOffset = 100;
      mockWindow.pageXOffset = 50;

      scrollManager.lock();
      expect(scrollManager.isScrollLocked()).toBe(true);

      scrollManager.unlock();
      expect(scrollManager.isScrollLocked()).toBe(false);
    });
  });
});
