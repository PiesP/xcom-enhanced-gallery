/**
 * @fileoverview 이벤트 관리자 통합 테스트 (TDD)
 * @description DOMEventManager와 GalleryEventManager 중복 제거를 위한 통합 테스트
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// 테스트 더미 구현들
const mockElement = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockHandler = vi.fn();

describe('UnifiedEventManager Integration (TDD)', () => {
  let unifiedManager;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (unifiedManager) {
      unifiedManager.cleanup();
    }
  });

  describe('RED Phase: 기본 인터페이스 정의', () => {
    test('should have DOMEventManager functionality', async () => {
      // 현재 이 import는 실패할 것 (아직 구현하지 않음)
      const { UnifiedEventManager } = await import('@shared/services/UnifiedEventManager');
      unifiedManager = new UnifiedEventManager();

      // DOMEventManager 핵심 기능들
      expect(unifiedManager.addEventListener).toBeDefined();
      expect(unifiedManager.addCustomEventListener).toBeDefined();
      expect(unifiedManager.cleanup).toBeDefined();
      expect(unifiedManager.getListenerCount).toBeDefined();
      expect(unifiedManager.getIsDestroyed).toBeDefined();
    });

    test('should have GalleryEventManager functionality', async () => {
      const { UnifiedEventManager } = await import('@shared/services/UnifiedEventManager');
      unifiedManager = new UnifiedEventManager();

      // GalleryEventManager 핵심 기능들
      expect(unifiedManager.addListener).toBeDefined();
      expect(unifiedManager.removeListener).toBeDefined();
      expect(unifiedManager.removeByContext).toBeDefined();
      expect(unifiedManager.initializeGallery).toBeDefined();
      expect(unifiedManager.cleanupGallery).toBeDefined();
      expect(unifiedManager.getGalleryStatus).toBeDefined();
    });

    test('should have unified event management', async () => {
      const { UnifiedEventManager } = await import('@shared/services/UnifiedEventManager');
      unifiedManager = new UnifiedEventManager();

      // 통합된 기능들
      expect(unifiedManager.handleTwitterEvent).toBeDefined();
      expect(unifiedManager.getUnifiedStatus).toBeDefined();
      expect(unifiedManager.cleanupAll).toBeDefined();
    });
  });

  describe('GREEN Phase: 기본 기능 동작', () => {
    test('should register and cleanup DOM events', async () => {
      const { UnifiedEventManager } = await import('@shared/services/UnifiedEventManager');
      unifiedManager = new UnifiedEventManager();

      // DOM 이벤트 등록
      unifiedManager.addEventListener(mockElement, 'click', mockHandler);
      expect(unifiedManager.getListenerCount()).toBe(1);

      // 정리
      unifiedManager.cleanup();
      expect(unifiedManager.getIsDestroyed()).toBe(true);
    });

    test('should manage gallery events', async () => {
      const { UnifiedEventManager } = await import('@shared/services/UnifiedEventManager');
      unifiedManager = new UnifiedEventManager();

      const handlers = {
        onMediaClick: vi.fn(),
        onGalleryClose: vi.fn(),
      };

      // 갤러리 이벤트 초기화
      await unifiedManager.initializeGallery(handlers);
      const status = unifiedManager.getGalleryStatus();
      expect(status.initialized).toBe(true);

      // 정리
      unifiedManager.cleanupGallery();
    });

    test('should handle Twitter events', async () => {
      const { UnifiedEventManager } = await import('@shared/services/UnifiedEventManager');
      unifiedManager = new UnifiedEventManager();

      // 트위터 이벤트 처리
      const listenerId = unifiedManager.handleTwitterEvent(
        mockElement,
        'click',
        mockHandler,
        'twitter-test'
      );

      expect(typeof listenerId).toBe('string');
      expect(unifiedManager.removeListener(listenerId)).toBe(true);
    });
  });

  describe('REFACTOR Phase: 통합 최적화', () => {
    test('should prevent memory leaks', async () => {
      const { UnifiedEventManager } = await import('@shared/services/UnifiedEventManager');
      unifiedManager = new UnifiedEventManager();

      // 여러 이벤트 등록
      unifiedManager.addEventListener(mockElement, 'click', mockHandler);
      unifiedManager.addListener(mockElement, 'mouseover', mockHandler);

      const initialCount = unifiedManager.getListenerCount();
      expect(initialCount).toBeGreaterThan(0);

      // 전체 정리
      unifiedManager.cleanupAll();
      expect(unifiedManager.getListenerCount()).toBe(0);
      expect(unifiedManager.getIsDestroyed()).toBe(true);
    });

    test('should provide unified status', async () => {
      const { UnifiedEventManager } = await import('@shared/services/UnifiedEventManager');
      unifiedManager = new UnifiedEventManager();

      const status = unifiedManager.getUnifiedStatus();
      expect(status).toHaveProperty('domEvents');
      expect(status).toHaveProperty('galleryEvents');
      expect(status).toHaveProperty('totalListeners');
      expect(status).toHaveProperty('isDestroyed');
    });

    test('should support context-based cleanup', async () => {
      const { UnifiedEventManager } = await import('@shared/services/UnifiedEventManager');
      unifiedManager = new UnifiedEventManager();

      // 컨텍스트별 이벤트 등록
      unifiedManager.addListener(mockElement, 'click', mockHandler, undefined, 'context1');
      unifiedManager.addListener(mockElement, 'mouseover', mockHandler, undefined, 'context2');

      expect(unifiedManager.removeByContext('context1')).toBe(1);
      expect(unifiedManager.removeByContext('context2')).toBe(1);
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain DOMEventManager interface', async () => {
      const { UnifiedEventManager } = await import('@shared/services/UnifiedEventManager');
      unifiedManager = new UnifiedEventManager();

      // 기존 DOMEventManager처럼 체이닝 지원
      const result = unifiedManager
        .addEventListener(mockElement, 'click', mockHandler)
        .addCustomEventListener(mockElement, 'custom', mockHandler);

      expect(result).toBe(unifiedManager);
    });

    test('should maintain GalleryEventManager singleton pattern', async () => {
      const { UnifiedEventManager } = await import('@shared/services/UnifiedEventManager');

      const instance1 = UnifiedEventManager.getInstance();
      const instance2 = UnifiedEventManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
