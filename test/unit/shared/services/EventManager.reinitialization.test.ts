/**
 * @fileoverview EventManager 재초기화 기능 테스트
 * @description TDD RED 단계: EventManager 파괴 상태 경고 해결을 위한 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventManager } from '@shared/services/EventManager';
import { logger } from '@shared/logging/logger';

// 로거 모킹
vi.mock('@shared/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('EventManager 재초기화 기능', () => {
  let eventManager: EventManager;

  beforeEach(() => {
    // 각 테스트 전에 EventManager 인스턴스 초기화
    EventManager.resetInstance();
    eventManager = EventManager.getInstance();
    vi.clearAllMocks();
  });

  describe('재초기화 패턴', () => {
    it('cleanup 후에도 새로운 이벤트 리스너를 등록할 수 있어야 함', () => {
      // Given: EventManager가 cleanup된 상태이고 자동 재초기화 활성화
      const mockElement = document.createElement('div');
      const mockHandler = vi.fn();

      EventManager.enableAutoReinitialize(true);
      eventManager.cleanup();

      // When: 새로운 이벤트 리스너를 등록함
      eventManager.addEventListener(mockElement, 'click', mockHandler);

      // Then: 경고 메시지가 출력되지 않고 정상적으로 등록됨
      expect(logger.warn).not.toHaveBeenCalledWith(expect.stringContaining('파괴된 상태에서'));
      expect(eventManager.getIsDestroyed()).toBe(false);
    });

    it('cleanup 후 재초기화되면 새로운 인스턴스여야 함', () => {
      // Given: 원본 EventManager
      const originalManager = EventManager.getInstance();

      // When: cleanup 후 재초기화
      originalManager.cleanup();
      const newManager = EventManager.getInstance(true); // 강제 재초기화

      // Then: 새로운 인스턴스가 생성됨
      expect(newManager).not.toBe(originalManager);
      expect(newManager.getIsDestroyed()).toBe(false);
    });

    it('자동 재초기화 모드에서는 파괴된 상태에서 접근 시 자동으로 재초기화되어야 함', () => {
      // Given: EventManager가 cleanup된 상태
      const mockElement = document.createElement('div');
      const mockHandler = vi.fn();

      eventManager.cleanup();
      EventManager.enableAutoReinitialize(true);

      // When: 파괴된 상태에서 이벤트 리스너를 등록함
      const result = eventManager.addEventListener(mockElement, 'click', mockHandler);

      // Then: 자동으로 재초기화되어 정상 동작함
      expect(result).toBe(eventManager);
      expect(logger.warn).not.toHaveBeenCalledWith(expect.stringContaining('파괴된 상태에서'));
    });

    it('자동 재초기화가 비활성화된 상태에서는 경고만 출력하고 동작하지 않아야 함', () => {
      // Given: EventManager가 cleanup된 상태이고 자동 재초기화 비활성화
      const mockElement = document.createElement('div');
      const mockHandler = vi.fn();

      eventManager.cleanup();
      EventManager.enableAutoReinitialize(false);

      // When: 파괴된 상태에서 이벤트 리스너를 등록함
      eventManager.addEventListener(mockElement, 'click', mockHandler);

      // Then: 경고 메시지가 출력됨
      expect(logger.warn).toHaveBeenCalledWith(
        'EventManager가 파괴된 상태에서 addEventListener 호출'
      );
    });
  });

  describe('EventManager 상태 관리', () => {
    it('isDestroyed 플래그를 정확히 관리해야 함', () => {
      // Given: 새로운 EventManager
      expect(eventManager.getIsDestroyed()).toBe(false);

      // When: cleanup 수행
      eventManager.cleanup();

      // Then: 파괴된 상태로 변경됨
      expect(eventManager.getIsDestroyed()).toBe(true);
    });

    it('reinitialize 메서드로 수동 재초기화할 수 있어야 함', () => {
      // Given: cleanup된 EventManager
      eventManager.cleanup();
      expect(eventManager.getIsDestroyed()).toBe(true);

      // When: 수동으로 재초기화
      eventManager.reinitialize();

      // Then: 다시 사용 가능한 상태가 됨
      expect(eventManager.getIsDestroyed()).toBe(false);
    });

    it('재초기화 시 이전 리스너들은 모두 정리되어야 함', () => {
      // Given: 이벤트 리스너가 등록된 상태
      const mockElement = document.createElement('div');
      const mockHandler = vi.fn();

      eventManager.addEventListener(mockElement, 'click', mockHandler);
      const initialCount = eventManager.getListenerCount();
      expect(initialCount).toBeGreaterThan(0);

      // When: 재초기화
      eventManager.reinitialize();

      // Then: 리스너 개수가 0이 됨
      expect(eventManager.getListenerCount()).toBe(0);
    });
  });

  describe('정적 메서드들', () => {
    it('resetInstance 메서드로 싱글톤 인스턴스를 초기화할 수 있어야 함', () => {
      // Given: EventManager 인스턴스가 있음
      const instance1 = EventManager.getInstance();

      // When: resetInstance 수행
      EventManager.resetInstance();
      const instance2 = EventManager.getInstance();

      // Then: 새로운 인스턴스가 생성됨
      expect(instance2).not.toBe(instance1);
    });

    it('enableAutoReinitialize로 자동 재초기화 모드를 설정할 수 있어야 함', () => {
      // When: 자동 재초기화 모드 활성화
      EventManager.enableAutoReinitialize(true);

      // Then: 설정이 적용됨 (내부 상태 확인)
      expect(EventManager.isAutoReinitializeEnabled()).toBe(true);
    });
  });
});
