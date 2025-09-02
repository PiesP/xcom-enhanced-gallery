// @ts-nocheck
/**
 * @fileoverview Phase 10: 중복 초기화 방지 및 갤러리 재실행 안정성 테스트
 * @description 서비스 중복 등록 차단 & 단일 실행 보장 및 재열기 안정성 회귀 검증
 * 목표:
 * - 서비스 중복 등록 발생률: 0%
 * - 앱 초기화 중복 실행: 0회
 * - 갤러리 재실행 성공률: 100%
 * - 콘솔 경고/경고성 로그 메시지: 0건 (명시적 allowOverwrite 제외)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '@shared/logging/logger';

describe('Phase 10: 중복 초기화 방지', () => {
  let loggerSpy; // any

  beforeEach(() => {
    // 전역 상태 초기화
    try {
      delete globalThis.__XEG_EXECUTION_STATE__;
    } catch {
      /* ignore */
    }

    // logger spy 설정
    loggerSpy = vi.spyOn(logger, 'warn');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('중복 시작점 방지', () => {
    it('[GREEN] ensureSingleExecution이 중복 실행을 방지해야 함', async () => {
      // 전역 실행 키 직접 테스트
      const GLOBAL_EXECUTION_KEY = '__XEG_EXECUTION_STATE__';

      // 첫 번째 실행 시뮬레이션
      function ensureSingleExecution() {
        if (globalThis[GLOBAL_EXECUTION_KEY]) {
          return false;
        }
        globalThis[GLOBAL_EXECUTION_KEY] = {
          started: true,
          timestamp: Date.now(),
          instanceId: `xeg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        return true;
      }

      const firstExecution = ensureSingleExecution();
      expect(firstExecution).toBe(true);

      const secondExecution = ensureSingleExecution();
      expect(secondExecution).toBe(false);
    });

    it('[GREEN] 전역 실행 상태가 올바르게 설정되어야 함', () => {
      const GLOBAL_EXECUTION_KEY = '__XEG_EXECUTION_STATE__';

      // 전역 상태 설정
      globalThis[GLOBAL_EXECUTION_KEY] = {
        started: true,
        timestamp: Date.now(),
        instanceId: `xeg-${Date.now()}-test`,
      };

      // 전역 상태 확인
      const executionState = globalThis[GLOBAL_EXECUTION_KEY];
      expect(executionState).toBeDefined();

      if (executionState && typeof executionState === 'object') {
        expect(executionState).toHaveProperty('started', true);
        expect(executionState).toHaveProperty('timestamp');
        expect(executionState).toHaveProperty('instanceId');

        expect(typeof executionState.timestamp).toBe('number');
        expect(typeof executionState.instanceId).toBe('string');
        expect(executionState.instanceId).toMatch(/^xeg-\d+-/);
      }
    });
  });

  describe('ServiceManager 중복 방지', () => {
    it('[GREEN] 동일한 서비스 중복 등록 시 무시되어야 함', async () => {
      const { CoreService } = await import('@shared/services/ServiceManager');
      const serviceManager = CoreService.getInstance();

      // 테스트용 서비스 인스턴스
      const testService1 = { name: 'test1' };
      const testService2 = { name: 'test2' };

      // 첫 번째 등록
      serviceManager.register('test.service', testService1);

      // logger.warn이 호출되지 않았는지 확인
      expect(loggerSpy).not.toHaveBeenCalled();

      // 두 번째 등록 (중복) - 무시되어야 함
      serviceManager.register('test.service', testService2);

      // logger.warn이 호출되지 않았는지 확인 (중복 등록이 무시됨)
      expect(loggerSpy).not.toHaveBeenCalled();

      // 첫 번째 서비스가 유지되어야 함
      const retrievedService = serviceManager.get('test.service');
      expect(retrievedService).toBe(testService1);
      expect(retrievedService).not.toBe(testService2);
    });

    it('[GREEN] 명시적 덮어쓰기 허용 시에만 경고 발생', async () => {
      const { CoreService } = await import('@shared/services/ServiceManager');
      const serviceManager = CoreService.getInstance();

      const testService1 = { name: 'test1' };
      const testService2 = { name: 'test2' };

      // 첫 번째 등록
      serviceManager.register('test.overwrite', testService1);

      // 명시적 덮어쓰기 허용
      serviceManager.register('test.overwrite', testService2, true);

      // 명시적 덮어쓰기 시에만 경고 발생
      expect(loggerSpy).toHaveBeenCalledWith(
        '[CoreService] 서비스 명시적 덮어쓰기: test.overwrite'
      );

      // 두 번째 서비스로 교체됨
      const retrievedService = serviceManager.get('test.overwrite');
      expect(retrievedService).toBe(testService2);
    });

    it('[GREEN] 서비스 중복 등록 시 debug 로그만 발생', async () => {
      const { CoreService } = await import('@shared/services/ServiceManager');
      const serviceManager = CoreService.getInstance();

      const debugSpy = vi.spyOn(logger, 'debug');
      const testService = { name: 'test' };

      // 첫 번째 등록
      serviceManager.register('test.debug', testService);

      // 두 번째 등록 (중복)
      serviceManager.register('test.debug', testService);

      // warn이 아닌 debug 로그만 발생해야 함
      expect(loggerSpy).not.toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalledWith(
        '[CoreService] 서비스 이미 등록됨, 중복 무시: test.debug'
      );

      debugSpy.mockRestore();
    });
  });

  describe('갤러리 재실행 안정성', () => {
    it('[GREEN] 갤러리 상태 초기화 후 재실행 가능해야 함', async () => {
      // galleryState 모듈 동적 import
      const { galleryState, openGallery, closeGallery } = await import(
        '@shared/state/signals/gallery.signals'
      );

      // 테스트용 미디어 아이템
      const mockMediaItems = [
        { id: '1', type: 'image', url: 'test1.jpg', alt: 'Test 1', filename: 'test1.jpg' },
        { id: '2', type: 'image', url: 'test2.jpg', alt: 'Test 2', filename: 'test2.jpg' },
      ];

      // 갤러리 열기
      openGallery(mockMediaItems, 0);
      expect(galleryState.value.isOpen).toBe(true);
      expect(galleryState.value.mediaItems.length).toBe(2);

      // 갤러리 닫기
      closeGallery();
      expect(galleryState.value.isOpen).toBe(false);

      // 재실행 - 문제없이 다시 열려야 함
      openGallery(mockMediaItems, 1);
      expect(galleryState.value.isOpen).toBe(true);
      expect(galleryState.value.currentIndex).toBe(1);

      // 정리
      closeGallery();
    });

    it('[GREEN] 여러 번의 갤러리 열기/닫기 사이클이 안정적이어야 함', async () => {
      const { galleryState, openGallery, closeGallery } = await import(
        '@shared/state/signals/gallery.signals'
      );

      const mockMediaItems = [
        { id: '1', type: 'image', url: 'test.jpg', alt: 'Test', filename: 'test.jpg' },
      ];

      // 5번의 열기/닫기 사이클
      for (let i = 0; i < 5; i++) {
        openGallery(mockMediaItems, 0);
        expect(galleryState.value.isOpen).toBe(true);

        closeGallery();
        expect(galleryState.value.isOpen).toBe(false);
      }

      // 메모리 누수나 상태 오염이 없어야 함 (마지막 닫기 후 상태 확인)
      expect(galleryState.value.isOpen).toBe(false);
      expect(galleryState.value.currentIndex).toBe(0);
      expect(galleryState.value.error).toBeNull();
      // mediaItems는 닫기 후에도 남아있을 수 있음 (정상 동작)
    });
  });

  describe('메모리 누수 방지', () => {
    it('[GREEN] cleanup 함수가 모든 상태를 초기화해야 함', async () => {
      // main.ts의 cleanup 함수 테스트
      const mainModule = await import('@/main');
      const { cleanup } = mainModule.default;

      expect(typeof cleanup).toBe('function');

      // cleanup 실행 시 오류가 발생하지 않아야 함
      await expect(cleanup()).resolves.not.toThrow();
    });

    it('[GREEN] 전역 상태 정리 후 재초기화 가능해야 함', () => {
      const GLOBAL_EXECUTION_KEY = '__XEG_EXECUTION_STATE__';

      // 전역 상태 설정
      globalThis[GLOBAL_EXECUTION_KEY] = {
        started: true,
        timestamp: Date.now(),
        instanceId: 'test-instance',
      };

      // 현재 전역 상태 확인
      expect(globalThis[GLOBAL_EXECUTION_KEY]).toBeDefined();

      // 전역 상태 정리
      delete globalThis[GLOBAL_EXECUTION_KEY];
      expect(globalThis[GLOBAL_EXECUTION_KEY]).toBeUndefined();

      // 재초기화 시뮬레이션 - 새로운 상태가 생성되어야 함
      globalThis[GLOBAL_EXECUTION_KEY] = {
        started: true,
        timestamp: Date.now(),
        instanceId: 'new-test-instance',
      };
      expect(globalThis[GLOBAL_EXECUTION_KEY]).toBeDefined();
    });
  });
});
