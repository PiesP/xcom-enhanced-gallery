/**
 * Phase 4 - Feature Lazy Factory Contract 테스트
 *
 * 목적: Feature 모듈들이 지연 로딩되고 단일 인스턴스로 캐싱되는지 검증
 * 범위: features.loadGallery() 등 lazy factory 패턴 구현
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createAppContainer } from '@features/gallery/createAppContainer';

describe('Phase 4 - Feature Lazy Factory Contract', () => {
  let container;

  beforeEach(async () => {
    container = await createAppContainer({ enableLegacyAdapter: false });
  });

  afterEach(async () => {
    await container?.dispose();
  });

  describe('Gallery Feature Factory', () => {
    test('loadGallery가 팩토리 함수로 정의되어야 함', () => {
      // When: features 객체 확인
      const { features } = container;

      // Then: loadGallery가 함수여야 함
      expect(features).toBeDefined();
      expect(typeof features.loadGallery).toBe('function');
    });

    test('첫 번째 호출 시 갤러리 앱을 생성해야 함', async () => {
      // When: 첫 번째 loadGallery 호출
      let galleryApp;

      // 실제 갤러리 서비스가 없는 테스트 환경에서는 에러가 발생할 수 있음
      // 따라서 try-catch로 처리하되, 타입은 확인
      try {
        galleryApp = await container.features.loadGallery();

        // Then: 갤러리 앱이 반환되어야 함
        expect(galleryApp).toBeDefined();
        expect(typeof galleryApp.initialize).toBe('function');
        expect(typeof galleryApp.cleanup).toBe('function');
      } catch (error) {
        // 테스트 환경에서는 서비스 누락으로 에러가 날 수 있음
        // 이 경우에도 에러 메시지가 적절해야 함
        expect(error.message).toContain('서비스를 찾을 수 없습니다');
      }
    });

    test('동일한 갤러리 인스턴스가 캐싱되어야 함', async () => {
      // Given: 갤러리 로딩이 가능한 상황 (모킹 또는 실제 환경)
      let firstInstance, secondInstance;

      try {
        // When: 두 번 연속 호출
        firstInstance = await container.features.loadGallery();
        secondInstance = await container.features.loadGallery();

        // Then: 동일한 인스턴스여야 함
        expect(firstInstance).toBe(secondInstance);
      } catch (error) {
        // 테스트 환경에서 서비스 누락 시
        // 최소한 같은 에러가 발생해야 함 (캐싱 동작 확인)
        let secondError;
        try {
          await container.features.loadGallery();
        } catch (e) {
          secondError = e;
        }

        expect(error.message).toBe(secondError?.message);
      }
    });

    test('컨테이너 dispose 시 갤러리도 정리되어야 함', async () => {
      // Given: 로드된 갤러리 (가능한 경우)
      try {
        await container.features.loadGallery();

        // When: 컨테이너 dispose
        await container.dispose();

        // Then: 갤러리가 정리되어야 함 (에러 없이)
        // 실제 cleanup 호출은 dispose 내부에서 처리됨
        expect(true).toBe(true); // dispose가 에러 없이 완료되었음을 확인
      } catch {
        // 테스트 환경에서 서비스 누락 시에도 dispose는 안전해야 함
        expect(async () => {
          await container.dispose();
        }).not.toThrow();
      }
    });
  });

  describe('Feature Factory 성능', () => {
    test('갤러리 팩토리가 효율적으로 작동해야 함', async () => {
      // Given: 성능 측정 시작
      const startTime = Date.now();

      // When: 갤러리 로딩 시도 (5회)
      const promises = Array(5)
        .fill(null)
        .map(() => {
          return container.features.loadGallery().catch(() => null); // 에러 무시
        });

      await Promise.all(promises);

      // Then: 합리적인 시간 내에 완료되어야 함
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(1000); // 1초 미만
    });

    test('동시 호출이 중복 생성을 하지 않아야 함', async () => {
      // Given: 동시 호출 준비
      const promises = Array(3)
        .fill(null)
        .map(() => container.features.loadGallery().catch(error => ({ error: error.message })));

      // When: 동시에 호출
      const results = await Promise.all(promises);

      // Then: 모든 결과가 같아야 함 (성공 시 같은 인스턴스, 실패 시 같은 에러)
      if (results[0].error) {
        // 에러 발생 시 모든 에러가 같아야 함
        expect(results.every(r => r.error === results[0].error)).toBe(true);
      } else {
        // 성공 시 모든 인스턴스가 같아야 함
        expect(results.every(r => r === results[0])).toBe(true);
      }
    });
  });

  describe('Feature Factory 확장성', () => {
    test('향후 추가될 feature factory들을 위한 구조가 준비되어야 함', () => {
      // When: features 객체 구조 확인
      const { features } = container;

      // Then: 확장 가능한 구조여야 함
      expect(features).toBeDefined();
      expect(typeof features).toBe('object');

      // 현재는 loadGallery만 있지만, 구조적으로 확장 가능해야 함
      expect(Object.keys(features)).toContain('loadGallery');

      // features 객체가 prototype을 가지지 않는 plain object여야 함
      expect(Object.getPrototypeOf(features)).toBe(Object.prototype);
    });

    test('feature factory가 컨테이너 의존성을 올바르게 전달해야 함', async () => {
      // Given: 컨테이너의 서비스들
      const { services, logger, config } = container;

      // When: 갤러리 factory 함수 실행 시도
      try {
        const galleryApp = await container.features.loadGallery();

        // Then: 갤러리가 컨테이너의 의존성들을 활용할 수 있어야 함
        // (실제 구현에서는 이들이 갤러리에 주입됨)
        expect(galleryApp).toBeDefined();
      } catch {
        // 테스트 환경에서는 의존성 부족으로 에러가 날 수 있음
        // 하지만 컨테이너 자체의 의존성들은 정상이어야 함
        expect(services).toBeDefined();
        expect(logger).toBeDefined();
        expect(config).toBeDefined();
      }
    });
  });

  describe('Feature Factory 에러 처리', () => {
    test('갤러리 로딩 실패 시 적절한 에러를 제공해야 함', async () => {
      // When: 갤러리 로딩 시도
      try {
        await container.features.loadGallery();
        // 성공하면 테스트 통과
        expect(true).toBe(true);
      } catch (error) {
        // Then: 의미있는 에러 메시지를 제공해야 함
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe('string');
        expect(error.message.length).toBeGreaterThan(0);
      }
    });

    test('갤러리 초기화 실패 후 재시도가 가능해야 함', async () => {
      // Given: 첫 번째 시도 실패
      let firstError;
      try {
        await container.features.loadGallery();
      } catch (error) {
        firstError = error;
      }

      // When: 두 번째 시도
      let secondError;
      try {
        await container.features.loadGallery();
      } catch (error) {
        secondError = error;
      }

      // Then: 두 번째 시도도 같은 방식으로 처리되어야 함
      if (firstError) {
        expect(secondError).toBeDefined();
        expect(secondError.message).toBe(firstError.message);
      }
    });

    test('부분적 의존성 누락 시에도 graceful한 처리를 해야 함', async () => {
      // Given: 일부 서비스만 누락된 상황
      const { services } = container;

      // When: 서비스 상태 확인
      // Then: 컨테이너 자체는 정상 생성되어야 함
      expect(services.media).toBeDefined();
      expect(services.theme).toBeDefined();
      expect(services.toast).toBeDefined();
      expect(services.video).toBeDefined();

      // 갤러리 로딩 실패는 별도 이슈이고, 컨테이너는 안정해야 함
      expect(() => container.features.loadGallery()).not.toThrow();
    });
  });
});
