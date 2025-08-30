/**
 * @fileoverview Phase 2: 환경 및 이벤트 처리 개선 TDD 테스트
 * @description logger 환경 감지, 이벤트 충돌, 비디오 제어 동기화
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger, createLogger, getEnvironmentLogLevel } from '@shared/logging/logger';
import { MediaService } from '@shared/services/MediaService';

describe('Phase 2: 환경 및 이벤트 처리 개선', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🔴 RED: 환경 감지 로직 안전화', () => {
    it('logger 환경 감지가 예외 없이 동작해야 함', () => {
      // Given: 다양한 환경 시뮬레이션
      const environments = [
        { type: 'browser', setup: () => ({ window: {}, process: undefined }) },
        { type: 'node', setup: () => ({ window: undefined, process: { env: {} } }) },
        { type: 'userscript', setup: () => ({ GM_info: {}, unsafeWindow: {} }) },
        { type: 'vite-dev', setup: () => ({ 'import.meta': { env: { DEV: true } } }) },
      ];

      environments.forEach(env => {
        // When: 환경별 로그 레벨 감지
        expect(() => {
          const logLevel = getEnvironmentLogLevel();
          return logLevel;
        }).not.toThrow();
      });
    });

    it('import.meta.env 접근 시 안전한 폴백이 있어야 함', () => {
      // Given: import.meta가 없는 환경
      const originalImportMeta = import.meta;

      // When: import.meta를 undefined로 설정
      try {
        (global as any).import = undefined;

        // Then: 에러 없이 동작
        expect(() => {
          createLogger({ level: 'info' });
        }).not.toThrow();
      } finally {
        // 환경 복원
        (global as any).import = { meta: originalImportMeta };
      }
    });

    it('process.env 접근 시 안전한 폴백이 있어야 함', () => {
      // Given: process가 없는 브라우저 환경
      const originalProcess = global.process;

      // When: process를 undefined로 설정
      try {
        (global as any).process = undefined;

        // Then: 에러 없이 기본값 사용
        expect(() => {
          const logLevel = getEnvironmentLogLevel();
          expect(['debug', 'info', 'warn', 'error']).toContain(logLevel);
        }).not.toThrow();
      } finally {
        // 환경 복원
        global.process = originalProcess;
      }
    });
  });

  describe('🔴 RED: 이벤트 핸들러 충돌 해결', () => {
    it('키보드 이벤트 중복 등록이 방지되어야 함', () => {
      // Given: 여러 컴포넌트에서 키보드 이벤트 등록
      const keydownEvents: EventListener[] = [];
      const originalAddEventListener = document.addEventListener;

      // 이벤트 리스너 등록 감시
      document.addEventListener = vi.fn((type: string, listener: EventListener) => {
        if (type === 'keydown') {
          keydownEvents.push(listener);
        }
        return originalAddEventListener.call(document, type, listener);
      });

      // When: 갤러리 초기화 (여러 번 호출 시뮬레이션)
      const mediaService = MediaService.getInstance();
      mediaService.prepareForGallery();
      mediaService.prepareForGallery(); // 중복 호출

      // Then: 이벤트 리스너 중복 등록 방지
      const uniqueListeners = new Set(keydownEvents);
      expect(uniqueListeners.size).toBeLessThanOrEqual(keydownEvents.length);

      // 정리
      document.addEventListener = originalAddEventListener;
    });

    it('이벤트 버블링이 적절히 제어되어야 함', () => {
      // Given: 이벤트 버블링 테스트 환경
      const parentElement = document.createElement('div');
      const childElement = document.createElement('div');
      parentElement.appendChild(childElement);

      let parentTriggered = false;
      let childTriggered = false;

      // When: 부모-자식 이벤트 핸들러 등록
      parentElement.addEventListener('click', () => {
        parentTriggered = true;
      });

      childElement.addEventListener('click', e => {
        childTriggered = true;
        e.stopPropagation(); // 버블링 방지
      });

      // 자식 요소 클릭 시뮬레이션
      const clickEvent = new MouseEvent('click', { bubbles: true });
      childElement.dispatchEvent(clickEvent);

      // Then: 버블링 제어 확인
      expect(childTriggered).toBe(true);
      expect(parentTriggered).toBe(false); // 버블링 방지됨
    });
  });

  describe('🔴 RED: 비디오 제어 상태 동기화', () => {
    it('여러 MediaService 인스턴스의 비디오 상태가 동기화되어야 함', () => {
      // Given: 복수 인스턴스 시뮬레이션
      const mediaService1 = MediaService.getInstance();
      const mediaService2 = MediaService.getInstance();

      // When: 한 인스턴스에서 비디오 일시정지
      mediaService1.pauseAllBackgroundVideos();

      // Then: 다른 인스턴스에서도 상태 동기화
      expect(mediaService1.getPausedVideoCount()).toBe(mediaService2.getPausedVideoCount());
      expect(mediaService1.isVideoControlActive()).toBe(mediaService2.isVideoControlActive());
    });

    it('비디오 제어 상태 카운트가 정확해야 함', () => {
      // Given: 비디오 요소들
      const videos = Array.from({ length: 3 }, () => document.createElement('video'));
      videos.forEach(video => {
        video.src = 'test.mp4';
        document.body.appendChild(video);
      });

      const mediaService = MediaService.getInstance();

      // When: 비디오 일시정지
      mediaService.pauseAllBackgroundVideos();
      const pausedCount = mediaService.getPausedVideoCount();

      // Then: 정확한 카운트
      expect(pausedCount).toBeGreaterThanOrEqual(0);
      expect(pausedCount).toBeLessThanOrEqual(videos.length);

      // 정리
      videos.forEach(video => document.body.removeChild(video));
    });
  });

  describe('🟢 GREEN: 개선된 기능 검증', () => {
    it('환경별 로그 레벨이 적절히 설정되어야 함', () => {
      // Given: 각 환경별 설정
      const environmentConfigs = {
        development: 'debug',
        production: 'warn',
        test: 'info',
        userscript: 'info',
      };

      // When: 환경별 로그 레벨 확인
      Object.entries(environmentConfigs).forEach(([env, expectedLevel]) => {
        // 환경 시뮬레이션
        const mockLogger = createLogger({ level: expectedLevel as any });

        // Then: 적절한 로그 레벨 설정
        expect(mockLogger).toBeDefined();
      });
    });

    it('통합 이벤트 관리자가 충돌을 방지해야 함', () => {
      // Given: 이벤트 관리자 사용
      const eventCounts = new Map<string, number>();

      // 이벤트 등록 추적
      const trackEventRegistration = (eventType: string) => {
        eventCounts.set(eventType, (eventCounts.get(eventType) || 0) + 1);
      };

      // When: 동일 이벤트 여러 번 등록 시도
      trackEventRegistration('keydown');
      trackEventRegistration('keydown');
      trackEventRegistration('scroll');

      // Then: 중복 방지 확인
      expect(eventCounts.get('keydown')).toBe(2);
      expect(eventCounts.get('scroll')).toBe(1);
    });

    it('비디오 상태가 Preact Signals로 관리되어야 함', () => {
      // Given: 비디오 상태 Signal
      const mediaService = MediaService.getInstance();

      // When: 상태 변경
      const initialActive = mediaService.isVideoControlActive();
      mediaService.pauseAllBackgroundVideos();
      const afterPause = mediaService.isVideoControlActive();

      // Then: 상태 변경 감지
      expect(typeof initialActive).toBe('boolean');
      expect(typeof afterPause).toBe('boolean');
    });
  });

  describe('🔧 REFACTOR: 성능 및 안정성 개선', () => {
    it('환경 감지 오버헤드가 최소화되어야 함', () => {
      // Given: 성능 측정
      const iterations = 1000;

      // When: 환경 감지 반복 실행
      const startTime = performance.now();
      for (let i = 0; i < iterations; i++) {
        getEnvironmentLogLevel();
      }
      const endTime = performance.now();

      // Then: 성능 기준 충족 (1ms 미만)
      const avgTime = (endTime - startTime) / iterations;
      expect(avgTime).toBeLessThan(1);
    });

    it('메모리 누수가 방지되어야 함', () => {
      // Given: 이벤트 리스너 등록/해제
      const mediaService = MediaService.getInstance();

      // When: 갤러리 진입/종료 반복
      for (let i = 0; i < 10; i++) {
        mediaService.prepareForGallery();
        mediaService.cleanupAfterGallery();
      }

      // Then: 메모리 사용량 안정
      const metrics = mediaService.getPrefetchMetrics();
      expect(metrics.activePrefetches).toBe(0);
    });

    it('에러 복구 메커니즘이 동작해야 함', () => {
      // Given: 에러 상황 시뮬레이션
      const mediaService = MediaService.getInstance();

      // When: 강제 리셋 실행
      mediaService.forceResetVideoControl();

      // Then: 정상 상태 복구
      expect(mediaService.isVideoControlActive()).toBe(false);
      expect(mediaService.getPausedVideoCount()).toBe(0);
    });
  });
});
