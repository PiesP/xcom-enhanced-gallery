/**
 * 갤러리 이벤트 연속성 통합 테스트
 * - 실제 브라우저에서 발생한 "두 번째 클릭에서 트위터 네이티브 갤러리 활성화" 문제 재현
 * - 개선된 이벤트 시스템의 동작 검증
 *
 * @module GalleryEventContinuityTest
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 실제 사용되는 모듈들
import {
  cleanupGalleryEvents,
  destroyGalleryEvents,
  reinitializeGalleryEvents,
  initializeGalleryEvents,
  getGalleryEventStatus,
} from '@shared/utils/events';

describe('갤러리 이벤트 연속성 통합 테스트', () => {
  let mockHandlers: {
    onMediaClick: ReturnType<typeof vi.fn>;
    onGalleryClose: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // 각 테스트마다 깨끗한 상태로 시작
    destroyGalleryEvents();

    mockHandlers = {
      onMediaClick: vi.fn().mockResolvedValue(undefined),
      onGalleryClose: vi.fn(),
    };
  });

  afterEach(() => {
    destroyGalleryEvents();
    vi.clearAllMocks();
  });

  describe('실제 브라우저 시나리오 재현', () => {
    it('시나리오 1: 갤러리 열기 → 닫기 → 다시 열기가 정상 작동해야 함', async () => {
      // **Phase 1: 최초 갤러리 초기화 및 사용**

      // Given: 갤러리 앱이 시작되고 이벤트 시스템 초기화
      await initializeGalleryEvents(mockHandlers, {
        enableKeyboard: true,
        enableMediaDetection: true,
        debugMode: true,
        preventBubbling: true,
        context: 'integration-test',
      });

      let status = getGalleryEventStatus();
      expect(status.initialized).toBe(true);
      expect(status.hasHandlers).toBe(true);

      // **Phase 2: 첫 번째 갤러리 열기/닫기 사이클**

      // When: 사용자가 미디어를 클릭하여 갤러리 열기 (시뮬레이션)
      // (실제로는 DOM 이벤트가 발생하지만 여기서는 핸들러 호출 직접 시뮬레이션)
      mockHandlers.onMediaClick.mockClear();

      // When: 갤러리가 닫힘 (cleanupGalleryEvents 호출)
      cleanupGalleryEvents();

      // Then: 상태 확인 - 부분 정리만 됨
      status = getGalleryEventStatus();
      expect(status.initialized).toBe(true); // 여전히 초기화된 상태
      expect(status.hasHandlers).toBe(true); // 핸들러 유지

      // **Phase 3: 두 번째 갤러리 열기 시도 (문제 상황)**

      // When: 사용자가 다시 미디어를 클릭 (재초기화 트리거)
      reinitializeGalleryEvents();

      // Then: 이벤트 시스템이 재활성화되어야 함
      status = getGalleryEventStatus();
      expect(status.initialized).toBe(true);
      expect(status.hasHandlers).toBe(true);
      expect(status.hasPriorityInterval).toBe(true); // 우선순위 메커니즘 재시작

      // **Phase 4: 반복 사용 검증**

      // When: 여러 번 갤러리 열기/닫기 반복
      for (let i = 0; i < 3; i++) {
        cleanupGalleryEvents(); // 갤러리 닫기
        reinitializeGalleryEvents(); // 갤러리 다시 열기

        // Then: 매번 정상 작동해야 함
        status = getGalleryEventStatus();
        expect(status.initialized).toBe(true);
        expect(status.hasHandlers).toBe(true);
      }
    });

    it('시나리오 2: 갤러리 앱 완전 종료 후 재시작이 정상 작동해야 함', async () => {
      // **Phase 1: 갤러리 앱 시작**
      await initializeGalleryEvents(mockHandlers);

      let status = getGalleryEventStatus();
      expect(status.initialized).toBe(true);

      // **Phase 2: 갤러리 앱 완전 종료**
      destroyGalleryEvents();

      status = getGalleryEventStatus();
      expect(status.initialized).toBe(false);
      expect(status.hasHandlers).toBe(false);

      // **Phase 3: 갤러리 앱 재시작**
      await initializeGalleryEvents(mockHandlers);

      status = getGalleryEventStatus();
      expect(status.initialized).toBe(true);
      expect(status.hasHandlers).toBe(true);
    });

    it('시나리오 3: 예외 상황에서도 안정적으로 동작해야 함', async () => {
      // Given: 이벤트 시스템 초기화
      await initializeGalleryEvents(mockHandlers);

      // When: 예외적인 상황들 시뮬레이션

      // 1) 중복 정리 호출
      cleanupGalleryEvents();
      cleanupGalleryEvents(); // 중복 호출

      // 2) 상태 불일치 상황에서 재초기화
      reinitializeGalleryEvents();
      reinitializeGalleryEvents(); // 중복 호출

      // 3) 완전 정리 후 부분 정리 시도
      destroyGalleryEvents();
      cleanupGalleryEvents(); // 상태 불일치

      // Then: 예외가 발생하지 않고 안정적으로 동작해야 함
      expect(() => {
        const status = getGalleryEventStatus();
        expect(status).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('성능 및 메모리 효율성', () => {
    it('이벤트 리스너 누수가 발생하지 않아야 함', async () => {
      // Given: 초기 상태
      const initialStatus = getGalleryEventStatus();
      const initialListenerCount = initialStatus.listenerCount;

      // When: 여러 번 갤러리 열기/닫기 반복
      for (let i = 0; i < 10; i++) {
        await initializeGalleryEvents(mockHandlers);
        cleanupGalleryEvents();
        reinitializeGalleryEvents();
        cleanupGalleryEvents();
      }

      // 최종 정리
      destroyGalleryEvents();

      // Then: 리스너 개수가 초기 상태로 돌아가야 함
      const finalStatus = getGalleryEventStatus();
      expect(finalStatus.listenerCount).toBeLessThanOrEqual(initialListenerCount);
    });

    it('우선순위 인터벌이 올바르게 관리되어야 함', async () => {
      // Given: 이벤트 시스템 초기화
      await initializeGalleryEvents(mockHandlers);

      let status = getGalleryEventStatus();
      expect(status.hasPriorityInterval).toBe(true);

      // When: 갤러리 닫기 (부분 정리)
      cleanupGalleryEvents();

      // Then: 우선순위 인터벌이 정리되어야 함
      status = getGalleryEventStatus();
      expect(status.hasPriorityInterval).toBe(false);

      // When: 재초기화
      reinitializeGalleryEvents();

      // Then: 우선순위 인터벌이 재시작되어야 함
      status = getGalleryEventStatus();
      expect(status.hasPriorityInterval).toBe(true);

      // When: 완전 정리
      destroyGalleryEvents();

      // Then: 우선순위 인터벌이 완전히 정리되어야 함
      status = getGalleryEventStatus();
      expect(status.hasPriorityInterval).toBe(false);
    });
  });

  describe('실제 문제 해결 검증', () => {
    it('트위터 네이티브 갤러리 활성화 방지가 유지되어야 함', async () => {
      // 이 테스트는 실제 DOM 환경에서 트위터 이벤트와의 상호작용을 검증
      // 현재 테스트 환경에서는 개념적 검증만 수행

      // Given: 이벤트 시스템이 초기화됨
      await initializeGalleryEvents(mockHandlers, {
        enableMediaDetection: true,
        preventBubbling: true,
        context: 'anti-twitter-test',
      });

      // When: 갤러리 닫기 후 재초기화
      cleanupGalleryEvents();
      reinitializeGalleryEvents();

      // Then: 이벤트 처리 옵션이 유지되어야 함
      const status = getGalleryEventStatus();
      expect(status.options?.enableMediaDetection).toBe(true);
      expect(status.options?.preventBubbling).toBe(true);
    });

    it('로그 출력을 통한 디버깅 정보 제공', async () => {
      // Given: 디버그 모드로 초기화
      await initializeGalleryEvents(mockHandlers, {
        debugMode: true,
        context: 'debug-test',
      });

      // When: 다양한 상태 전환 수행
      cleanupGalleryEvents();
      reinitializeGalleryEvents();
      destroyGalleryEvents();

      // Then: 예외가 발생하지 않고 상태가 추적 가능해야 함
      expect(() => {
        const status = getGalleryEventStatus();
        expect(typeof status.initialized).toBe('boolean');
        expect(typeof status.hasHandlers).toBe('boolean');
      }).not.toThrow();
    });
  });
});
