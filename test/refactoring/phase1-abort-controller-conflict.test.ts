/**
 * @fileoverview AbortController 충돌 해결을 위한 TDD 테스트
 * @description Phase 1.1: AbortController 관리 통합
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MediaService } from '@shared/services/MediaService';
import { BulkDownloadService } from '@shared/services/BulkDownloadService';
import { AbortManager } from '@shared/services/AbortManager';

describe('Phase 1.1: AbortController 충돌 해결 - TDD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🔴 RED: 현재 충돌 문제 검증', () => {
    it('MediaService와 BulkDownloadService가 AbortManager를 사용함', async () => {
      // Given: 두 서비스 인스턴스
      const mediaService = new MediaService();
      const bulkService = new BulkDownloadService();

      // When: 각 서비스의 AbortController 관련 속성 확인
      const mediaServiceUsesAbortManager = 'abortManager' in mediaService;
      const bulkServiceUsesAbortManager = 'abortManager' in bulkService;

      // Then: 두 서비스 모두 AbortManager를 사용해야 함 (충돌 해결됨)
      expect(mediaServiceUsesAbortManager).toBe(true);
      expect(bulkServiceUsesAbortManager).toBe(true);

      // 더 이상 개별 AbortController는 없어야 함
      const mediaServiceHasDirectController = 'activePrefetchRequests' in mediaService;
      const bulkServiceHasDirectController = 'currentAbortController' in bulkService;

      expect(mediaServiceHasDirectController).toBe(false);
      expect(bulkServiceHasDirectController).toBe(false);
    });

    it('동시 다운로드와 프리페치 실행 시 AbortController 충돌 위험', async () => {
      // Given: 동시 실행 시나리오
      // NOTE: mockMediaItems는 향후 구현에서 사용 예정

      // When: 동시 abort 신호 발생 시뮬레이션
      const abortController1 = new globalThis.AbortController();
      const abortController2 = new globalThis.AbortController();

      // Then: 현재는 각 서비스가 독립적으로 abort를 관리하여 상호 간섭 가능
      expect(abortController1.signal.aborted).toBe(false);
      expect(abortController2.signal.aborted).toBe(false);

      // 동시 abort 시 예상치 못한 동작 가능
      abortController1.abort();
      expect(abortController1.signal.aborted).toBe(true);
      expect(abortController2.signal.aborted).toBe(false); // 독립적이지만 혼란 야기
    });

    it('중앙 AbortManager가 존재함', () => {
      // Given: AbortManager 모듈

      // When: AbortManager 클래스 존재 확인
      const abortManagerExists = typeof AbortManager === 'function';

      // Then: GREEN - 이제 중앙 AbortManager가 존재함
      expect(abortManagerExists).toBe(true);
    });
  });

  describe('🟢 GREEN: 중앙 AbortManager 구현', () => {
    it('중앙 AbortManager 클래스가 존재해야 함', async () => {
      // Given: AbortManager 구현 후
      // TODO: 구현 후 테스트가 통과하도록 만들기

      // When: AbortManager 클래스 확인
      let abortManagerExists = false;

      try {
        const { AbortManager } = await import('@shared/services/AbortManager');
        abortManagerExists = typeof AbortManager === 'function';
      } catch {
        abortManagerExists = false;
      }

      // Then: GREEN - AbortManager가 구현되어야 함
      expect(abortManagerExists).toBe(true);
    });

    it('AbortManager가 컨트롤러 생성/관리/해제 API를 제공해야 함', async () => {
      // Given: AbortManager 구현 후
      try {
        const { AbortManager } = await import('@shared/services/AbortManager');
        const manager = new AbortManager();

        // When: API 확인
        const hasCreateController = typeof manager.createController === 'function';
        const hasAbort = typeof manager.abort === 'function';
        const hasAbortAll = typeof manager.abortAll === 'function';
        const hasCleanup = typeof manager.cleanup === 'function';

        // Then: GREEN - 모든 필수 API가 구현되어야 함
        expect(hasCreateController).toBe(true);
        expect(hasAbort).toBe(true);
        expect(hasAbortAll).toBe(true);
        expect(hasCleanup).toBe(true);
      } catch {
        // TODO: 구현 후 이 테스트가 통과하도록 만들기
        expect.fail('AbortManager 구현 필요');
      }
    });

    it('MediaService가 AbortManager를 사용해야 함', async () => {
      // Given: 리팩토링 후
      try {
        const { MediaService } = await import('@shared/services/MediaService');
        const mediaService = MediaService.getInstance();

        // When: AbortManager 사용 확인
        const usesAbortManager = 'abortManager' in mediaService;

        // Then: GREEN - MediaService가 AbortManager를 사용해야 함
        expect(usesAbortManager).toBe(true);
      } catch {
        // TODO: 구현 후 이 테스트가 통과하도록 만들기
        expect.fail('MediaService AbortManager 통합 필요');
      }
    });

    it('BulkDownloadService가 AbortManager를 사용해야 함', async () => {
      // Given: 리팩토링 후
      try {
        const { BulkDownloadService } = await import('@shared/services/BulkDownloadService');
        const bulkService = new BulkDownloadService();

        // When: AbortManager 사용 확인
        const usesAbortManager = 'abortManager' in bulkService;

        // Then: GREEN - BulkDownloadService가 AbortManager를 사용해야 함
        expect(usesAbortManager).toBe(true);
      } catch {
        // TODO: 구현 후 이 테스트가 통과하도록 만들기
        expect.fail('BulkDownloadService AbortManager 통합 필요');
      }
    });
  });

  describe('🔧 REFACTOR: 통합된 Abort 관리 검증', () => {
    it('동시 작업 시 AbortManager를 통한 안전한 abort 처리', async () => {
      // Given: 통합 AbortManager 사용
      try {
        const { AbortManager } = await import('@shared/services/AbortManager');
        const manager = new AbortManager();

        // When: 여러 작업에 대한 컨트롤러 생성
        const downloadController = manager.createController('download-001');
        const prefetchController = manager.createController('prefetch-001');

        // Then: 각 작업이 독립적으로 관리되면서도 중앙에서 통제 가능
        expect(downloadController).toBeInstanceOf(globalThis.AbortController);
        expect(prefetchController).toBeInstanceOf(globalThis.AbortController);
        expect(downloadController).not.toBe(prefetchController);

        // And: 개별 abort 가능
        manager.abort('download-001');
        expect(downloadController.signal.aborted).toBe(true);
        expect(prefetchController.signal.aborted).toBe(false);

        // And: 전체 abort 가능
        manager.abortAll();
        expect(prefetchController.signal.aborted).toBe(true);
      } catch {
        // TODO: 구현 후 이 테스트가 통과하도록 만들기
        expect.fail('통합된 AbortManager 구현 및 테스트 필요');
      }
    });

    it('메모리 누수 방지를 위한 자동 정리', async () => {
      // Given: AbortManager의 메모리 관리
      try {
        const { AbortManager } = await import('@shared/services/AbortManager');
        const manager = new AbortManager();

        // When: 컨트롤러 생성 후 완료
        const controller = manager.createController('test-001');
        controller.abort();

        // Then: 완료된 컨트롤러는 자동으로 정리되어야 함
        manager.cleanup();

        // And: 정리 후 메모리 누수 없어야 함
        expect(manager.getActiveControllerCount()).toBe(0);
      } catch {
        // TODO: 구현 후 이 테스트가 통과하도록 만들기
        expect.fail('AbortManager 메모리 관리 구현 필요');
      }
    });
  });
});
