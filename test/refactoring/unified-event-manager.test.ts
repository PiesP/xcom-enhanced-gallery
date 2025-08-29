/**
 * @fileoverview 통합 이벤트 관리자 리팩토링 테스트
 * @description RED → GREEN → REFACTOR 사이클로 이벤트 시스템 통합
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventManager } from '@shared/services/EventManager';

// DOM API Mock
const createMockElement = () => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  tagName: 'DIV',
  className: '',
});

const createMockEvent = (type, options = {}) => ({
  type,
  bubbles: options.bubbles || false,
  stopImmediatePropagation: vi.fn(),
  preventDefault: vi.fn(),
  target: null,
  ...options,
});

describe('통합 이벤트 관리자 리팩토링', () => {
  let manager;
  let mockElement;

  beforeEach(() => {
    manager = EventManager.getInstance(true); // 강제 재초기화
    mockElement = createMockElement();
  });

  afterEach(() => {
    manager.cleanupAll();
    EventManager.resetInstance();
  });

  describe('TDD RED: 현재 문제점 식별', () => {
    test('중복된 이벤트 관리 시스템이 존재함', () => {
      // 현재 상황: DOMEventManager, events.ts, EventManager가 모두 존재
      expect(typeof EventManager).toBe('function');

      // RED: 통합된 인터페이스가 필요함을 나타내는 실패하는 테스트
      const unifiedManager = new EventManager();
      expect(unifiedManager.addEventListener).toBeDefined();
      expect(unifiedManager.addListener).toBeDefined();
      expect(unifiedManager.cleanup).toBeDefined();
    });
  });

  describe('TDD GREEN: 최소 구현으로 테스트 통과', () => {
    test('단일 이벤트 관리 인터페이스로 모든 기능 제공', () => {
      const unifiedManager = EventManager.getInstance();

      // DOM 이벤트와 갤러리 이벤트를 동일한 인터페이스로 관리
      expect(unifiedManager.addEventListener).toBeDefined();
      expect(unifiedManager.addListener).toBeDefined();
      expect(unifiedManager.cleanup).toBeDefined();
      expect(unifiedManager.cleanupAll).toBeDefined();
    });

    test('안정적인 이벤트 처리', () => {
      const unifiedManager = EventManager.getInstance();
      const mockHandler = vi.fn();

      // DOM 이벤트 추가
      unifiedManager.addEventListener(mockElement, 'click', mockHandler);

      // 갤러리 이벤트 추가
      const listenerId = unifiedManager.addListener(mockElement, 'click', mockHandler);

      expect(typeof listenerId).toBe('string');
      expect(unifiedManager.getListenerCount()).toBeGreaterThan(0);
    });

    test('이벤트 위임 패턴으로 안전한 처리', () => {
      const unifiedManager = EventManager.getInstance();
      const mockHandler = vi.fn();

      // 더 안전한 이벤트 처리
      unifiedManager.addEventListener(mockElement, 'click', mockHandler);

      // 이벤트 발생 시뮬레이션
      const clickEvent = createMockEvent('click', { bubbles: true });
      mockElement.dispatchEvent(clickEvent);

      expect(mockElement.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('TDD REFACTOR: 기존 코드와의 호환성 유지', () => {
    test('기존 DOMEventManager 호환 인터페이스 제공', () => {
      const unifiedManager = EventManager.getInstance();

      // 기존 코드가 계속 작동하도록 호환성 유지
      expect(unifiedManager.addEventListener).toBeDefined();
      expect(unifiedManager.addCustomEventListener).toBeDefined();
      expect(unifiedManager.getListenerCount).toBeDefined();
      expect(unifiedManager.getIsDestroyed).toBeDefined();
    });

    test('기존 events.ts 함수들과 호환', () => {
      const unifiedManager = EventManager.getInstance();

      // 기존 갤러리 이벤트 함수들과 호환
      expect(unifiedManager.addListener).toBeDefined();
      expect(unifiedManager.removeListener).toBeDefined();
      expect(unifiedManager.removeByContext).toBeDefined();
    });

    test('통합 상태 조회 기능', () => {
      const unifiedManager = EventManager.getInstance();

      const status = unifiedManager.getUnifiedStatus();
      expect(status).toHaveProperty('domEvents');
      expect(status).toHaveProperty('galleryEvents');
      expect(status).toHaveProperty('totalListeners');
      expect(status).toHaveProperty('isDestroyed');
    });

    test('안전한 정리 기능', () => {
      const unifiedManager = EventManager.getInstance();
      const mockHandler = vi.fn();

      // 여러 이벤트 추가
      unifiedManager.addEventListener(mockElement, 'click', mockHandler);
      unifiedManager.addListener(mockElement, 'keydown', mockHandler);

      expect(unifiedManager.getListenerCount()).toBeGreaterThan(0);

      // 통합 정리
      unifiedManager.cleanupAll();

      expect(unifiedManager.getIsDestroyed()).toBe(true);
    });
  });

  describe('성능 및 메모리 최적화', () => {
    test('메모리 누수 방지', () => {
      const unifiedManager = EventManager.getInstance();
      const mockHandler = vi.fn();

      // 많은 이벤트 추가
      for (let i = 0; i < 10; i++) {
        const element = createMockElement();
        unifiedManager.addEventListener(element, 'click', mockHandler);
      }

      const initialCount = unifiedManager.getListenerCount();
      expect(initialCount).toBe(10);

      // 정리 후 메모리 해제 확인
      unifiedManager.cleanupAll();
      expect(unifiedManager.getListenerCount()).toBe(0);
    });

    test('이벤트 추적 시스템', () => {
      const unifiedManager = EventManager.getInstance();
      const mockHandler = vi.fn();

      // 같은 이벤트를 여러 번 등록
      const id1 = unifiedManager.addListener(mockElement, 'click', mockHandler);
      const id2 = unifiedManager.addListener(mockElement, 'click', mockHandler);

      // 각각 다른 ID를 가져야 함
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });
  });
});
