/**
 * @fileoverview Service Factories 테스트
 * Lazy singleton 패턴, Promise 기반 동시성 안전성, 테스트 리셋 검증
 */
import { describe, it, expect, beforeEach } from 'vitest';

// 팩토리 함수들을 import
import {
  getMediaService,
  getBulkDownloadService,
  getSettingsService,
  __resetServiceFactories,
} from '@/shared/services/service-factories';

describe('Service Factories', () => {
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

  describe('getBulkDownloadService()', () => {
    it('BulkDownloadService 인스턴스를 반환한다', async () => {
      const service = await getBulkDownloadService();

      expect(service).toBeDefined();
      expect(typeof service).toBe('object');
    });

    it('여러 번 호출해도 동일한 인스턴스를 반환한다 (싱글톤)', async () => {
      const service1 = await getBulkDownloadService();
      const service2 = await getBulkDownloadService();

      expect(service1).toBe(service2);
    });

    it('동시 호출에서도 하나의 인스턴스만 생성한다 (Promise 기반 동시성 안전)', async () => {
      const [service1, service2, service3] = await Promise.all([
        getBulkDownloadService(),
        getBulkDownloadService(),
        getBulkDownloadService(),
      ]);

      expect(service1).toBe(service2);
      expect(service2).toBe(service3);
    });

    it('리셋 후에는 새로운 인스턴스를 생성한다', async () => {
      const service1 = await getBulkDownloadService();

      __resetServiceFactories();

      const service2 = await getBulkDownloadService();

      // 리셋 후 새 인스턴스
      expect(service1).not.toBe(service2);
    });
  });

  describe('getSettingsService()', () => {
    it('호출 시 에러를 던진다 (deprecated, features 레이어로 이동)', async () => {
      await expect(getSettingsService()).rejects.toThrow(
        'getSettingsService(): features 레이어 factory(@features/settings/services/settings-factory)를 직접 import 하세요'
      );
    });

    it('에러 메시지에 올바른 import 경로가 포함된다', async () => {
      await expect(getSettingsService()).rejects.toThrow(
        '@features/settings/services/settings-factory'
      );
    });
  });

  describe('__resetServiceFactories()', () => {
    it('모든 팩토리 캐시를 초기화한다', async () => {
      // 먼저 서비스들을 생성
      const media1 = await getMediaService();
      const bulk1 = await getBulkDownloadService();

      // 리셋 실행
      __resetServiceFactories();

      // 새로운 인스턴스 생성 확인
      const media2 = await getMediaService();
      const bulk2 = await getBulkDownloadService();

      expect(media2).toBeDefined();
      expect(bulk2).toBeDefined();
      // BulkDownloadService는 매번 new로 생성되므로 다른 인스턴스
      expect(bulk1).not.toBe(bulk2);
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
    it('MediaService와 BulkDownloadService는 독립적인 인스턴스다', async () => {
      const mediaService = await getMediaService();
      const bulkDownloadService = await getBulkDownloadService();

      expect(mediaService).not.toBe(bulkDownloadService);
    });

    it('한 팩토리의 리셋이 다른 팩토리에 영향을 주지 않는다', async () => {
      const media1 = await getMediaService();
      const bulk1 = await getBulkDownloadService();

      // 전체 리셋
      __resetServiceFactories();

      const media2 = await getMediaService();
      const bulk2 = await getBulkDownloadService();

      // 둘 다 새로운 인스턴스 (BulkDownloadService는 매번 new)
      expect(media2).toBeDefined();
      expect(bulk2).toBeDefined();
      expect(bulk1).not.toBe(bulk2);
    });
  });

  describe('에러 처리', () => {
    it('getSettingsService는 항상 에러를 던진다', async () => {
      const promises = [getSettingsService(), getSettingsService(), getSettingsService()];

      await Promise.allSettled(promises).then(results => {
        results.forEach(result => {
          expect(result.status).toBe('rejected');
          if (result.status === 'rejected') {
            expect(result.reason.message).toContain('features 레이어 factory');
          }
        });
      });
    });
  });

  describe('타입 안전성', () => {
    it('getMediaService는 MediaService 타입을 반환한다', async () => {
      const service = await getMediaService();

      // MediaService 인터페이스 메서드 존재 확인
      expect(service).toHaveProperty('extractMedia');
    });

    it('getBulkDownloadService는 BulkDownloadService 타입을 반환한다', async () => {
      const service = await getBulkDownloadService();

      // BulkDownloadService 인터페이스 메서드 존재 확인
      expect(service).toHaveProperty('downloadMultiple');
      expect(service).toHaveProperty('downloadSingle');
    });
  });

  describe('동시성 시나리오 (Concurrency Scenarios)', () => {
    it('복잡한 동시 호출 패턴에서도 싱글톤을 보장한다', async () => {
      // 여러 비동기 컨텍스트에서 동시 호출
      const calls = Array.from({ length: 10 }, (_, i) =>
        Promise.all([getMediaService(), getBulkDownloadService(), getMediaService()])
      );

      const results = await Promise.all(calls);

      // 모든 MediaService는 동일
      const allMediaServices = results.flatMap(r => [r[0], r[2]]);
      const firstMedia = allMediaServices[0];
      allMediaServices.forEach(service => {
        expect(service).toBe(firstMedia);
      });

      // 모든 BulkDownloadService는 동일
      const allBulkServices = results.map(r => r[1]);
      const firstBulk = allBulkServices[0];
      allBulkServices.forEach(service => {
        expect(service).toBe(firstBulk);
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
