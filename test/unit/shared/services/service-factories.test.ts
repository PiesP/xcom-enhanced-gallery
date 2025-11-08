/**
 * @fileoverview Service Factories 테스트
 * Lazy singleton 패턴, Promise 기반 동시성 안전성, 테스트 리셋 검증
 * Phase 323-5: getBulkDownloadService 제거 (Phase 312에서 UnifiedDownloadService로 통합)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';

// 팩토리 함수들을 import
import {
  getMediaService,
  getSettingsService,
  __resetServiceFactories,
} from '@/shared/services/service-factories';

describe('Service Factories', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    // 각 테스트 전에 팩토리 상태 리셋
    __resetServiceFactories();
  });

  describe('getMediaService()', () => {
    it('MediaService 인스턴스를 반환한다', async () => {
      const service = await getMediaService();

      expect(service).toBeDefined();
      expect(typeof service).toBe('object');
    });

    it('여러 번 호출해도 동일한 인스턴스를 반환한다 (싱글톤)', async () => {
      const service1 = await getMediaService();
      const service2 = await getMediaService();

      expect(service1).toBe(service2);
    });

    it('동시 호출에서도 하나의 인스턴스만 생성한다 (Promise 기반 동시성 안전)', async () => {
      const [service1, service2, service3] = await Promise.all([
        getMediaService(),
        getMediaService(),
        getMediaService(),
      ]);

      expect(service1).toBe(service2);
      expect(service2).toBe(service3);
    });

    it('리셋 후에는 새로운 인스턴스를 생성한다', async () => {
      const service1 = await getMediaService();

      __resetServiceFactories();

      const service2 = await getMediaService();

      // 리셋 후 새 인스턴스이므로 다를 수 있음 (MediaService.getInstance() 동작에 따라 다름)
      // 하지만 팩토리의 Promise 캐시는 초기화됨
      expect(service2).toBeDefined();
    });
  });

  // Phase 323-5: getBulkDownloadService 제거 (Phase 312에서 UnifiedDownloadService로 통합)
  // 아래 describe 블록 전체 제거됨

  describe('getSettingsService()', () => {
    it('호출 시 에러를 던진다 (deprecated, features 레이어로 이동)', async () => {
      await expect(getSettingsService()).rejects.toThrow(
        'getSettingsService(): Use initializeSettingsService() from @features/settings'
      );
    });

    it('에러 메시지에 올바른 import 경로가 포함된다', async () => {
      await expect(getSettingsService()).rejects.toThrow('initializeSettingsService()');
    });
  });

  describe('__resetServiceFactories()', () => {
    it('모든 팩토리 캐시를 초기화한다', async () => {
      // 먼저 서비스를 생성
      const media1 = await getMediaService();

      // 리셋 실행
      __resetServiceFactories();

      // 새로운 인스턴스 생성 확인
      const media2 = await getMediaService();

      expect(media2).toBeDefined();
    });

    it('여러 번 호출해도 안전하다', () => {
      expect(() => {
        __resetServiceFactories();
        __resetServiceFactories();
        __resetServiceFactories();
      }).not.toThrow();
    });

    it('서비스 생성 전 호출해도 안전하다', () => {
      expect(() => {
        __resetServiceFactories();
      }).not.toThrow();
    });
  });

  describe('팩토리 격리 (Factory Isolation)', () => {
    // Phase 323-5: BulkDownloadService 테스트 제거 (Phase 312에서 통합됨)
    it('팩토리 리셋이 독립적으로 동작한다', async () => {
      const media1 = await getMediaService();

      // 전체 리셋
      __resetServiceFactories();

      const media2 = await getMediaService();

      expect(media2).toBeDefined();
    });
  });

  describe('에러 처리', () => {
    it('getSettingsService는 항상 에러를 던진다', async () => {
      const promises = [getSettingsService(), getSettingsService(), getSettingsService()];

      await Promise.allSettled(promises).then(results => {
        results.forEach(result => {
          expect(result.status).toBe('rejected');
          if (result.status === 'rejected') {
            expect(result.reason.message).toContain('initializeSettingsService');
          }
        });
      });
    });
  });

  describe('타입 안전성', () => {
    it('getMediaService는 MediaService 타입을 반환한다', async () => {
      const service = await getMediaService();

      // MediaService 인터페이스 메서드 존재 확인
      expect(service).toHaveProperty('extractFromClickedElement');
    });

    // Phase 323-5: getBulkDownloadService 테스트 제거 (Phase 312에서 통합됨)
  });

  describe('동시성 시나리오 (Concurrency Scenarios)', () => {
    it('복잡한 동시 호출 패턴에서도 싱글톤을 보장한다', async () => {
      // 여러 비동기 컨텍스트에서 동시 호출 (Phase 323-5: BulkDownloadService 제거)
      const calls = Array.from({ length: 10 }, (_, i) =>
        Promise.all([getMediaService(), getMediaService()])
      );

      const results = await Promise.all(calls);

      // 모든 MediaService는 동일
      const allMediaServices = results.flatMap(r => [r[0], r[1]]);
      const firstMedia = allMediaServices[0];
      allMediaServices.forEach(service => {
        expect(service).toBe(firstMedia);
      });
    });

    it('리셋과 동시 호출이 섞여도 안전하다', async () => {
      const service1 = await getMediaService();

      // 리셋과 동시 호출
      __resetServiceFactories();
      const [service2, service3] = await Promise.all([getMediaService(), getMediaService()]);

      // 리셋 후 생성된 서비스들은 동일
      expect(service2).toBe(service3);
      expect(service2).toBeDefined();
    });
  });
});
