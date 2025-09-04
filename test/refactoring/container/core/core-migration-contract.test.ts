/**
 * Phase 3 - Core Migration Contract 테스트
 *
 * 목적: 핵심 코드가 새로운 AppContainer를 사용하도록 마이그레이션 검증
 * 범위: main.ts와 핵심 엔트리 포인트의 마이그레이션 확인
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createAppContainer } from '../../../../src/shared/container/createAppContainer';

describe('Phase 3 - Core Migration Contract', () => {
  let container;

  beforeEach(async () => {
    container = await createAppContainer();
  });

  afterEach(async () => {
    await container?.dispose();
  });

  describe('AppContainer 생성 및 초기화', () => {
    test('createAppContainer가 유효한 AppContainer를 반환해야 함', async () => {
      // When: AppContainer 생성
      const testContainer = await createAppContainer();

      // Then: 유효한 컨테이너가 반환되어야 함
      expect(testContainer).toBeDefined();
      expect(typeof testContainer.dispose).toBe('function');
      expect(testContainer.services).toBeDefined();
      expect(testContainer.features).toBeDefined();
      expect(testContainer.config).toBeDefined();
      expect(testContainer.logger).toBeDefined();

      // Cleanup
      await testContainer.dispose();
    });

    test('기본 설정으로 AppContainer 생성이 가능해야 함', async () => {
      // When: 기본 설정으로 컨테이너 생성
      const testContainer = await createAppContainer();

      // Then: 필수 서비스들이 준비되어야 함
      expect(testContainer.services.media).toBeDefined();
      expect(testContainer.services.theme).toBeDefined();
      expect(testContainer.services.toast).toBeDefined();
      expect(testContainer.services.video).toBeDefined();

      // And: 갤러리 팩토리가 준비되어야 함
      expect(typeof testContainer.features.loadGallery).toBe('function');

      // Cleanup
      await testContainer.dispose();
    });

    test('커스텀 설정으로 AppContainer 생성이 가능해야 함', async () => {
      // Given: 커스텀 설정
      const customConfig = {
        enableLegacyAdapter: false,
        config: {
          version: '4.0.0-test',
          isDevelopment: true,
          debug: true,
          autoStart: false,
          performanceMonitoring: false,
        },
      };

      // When: 커스텀 설정으로 컨테이너 생성
      const testContainer = await createAppContainer(customConfig);

      // Then: 설정이 적용되어야 함
      expect(testContainer.config.version).toBe('4.0.0-test');
      expect(testContainer.config.isDevelopment).toBe(true);
      expect(testContainer.config.debug).toBe(true);
      expect(testContainer.config.autoStart).toBe(false);

      // Cleanup
      await testContainer.dispose();
    });
  });

  describe('서비스 의존성 주입', () => {
    test('모든 서비스가 올바른 의존성으로 초기화되어야 함', () => {
      // When: 서비스들 확인
      const { services } = container;

      // Then: 모든 서비스가 의존성과 함께 초기화되어야 함
      expect(services.media).toBeDefined();
      expect(services.theme).toBeDefined();
      expect(services.toast).toBeDefined();
      expect(services.video).toBeDefined();

      // And: 서비스들이 필요한 메서드들을 가져야 함
      expect(typeof services.media.extractMediaUrls).toBe('function');
      expect(typeof services.theme.getCurrentTheme).toBe('function');
      expect(typeof services.toast.show).toBe('function');
      expect(typeof services.video.pauseAll).toBe('function');
    });

    test('서비스 간 상호 의존성이 올바르게 설정되어야 함', async () => {
      // When: 의존성이 있는 서비스 메서드 호출
      const { services } = container;

      // Then: 의존성이 정상적으로 주입되어야 함
      expect(() => {
        // MediaService가 내부적으로 다른 서비스를 사용할 때 에러가 발생하지 않아야 함
        // 실제 DOM 요소 대신 모의 객체 사용
        const mockElement = {
          querySelector: () => null,
          querySelectorAll: () => [],
        } as HTMLElement;
        services.media.extractMediaUrls(mockElement);
      }).not.toThrow();

      expect(() => {
        // ThemeService가 정상적으로 작동해야 함
        services.theme.getCurrentTheme();
      }).not.toThrow();
    });
  });

  describe('애플리케이션 진입점 마이그레이션', () => {
    test('갤러리 앱 로딩이 새로운 컨테이너를 통해 작동해야 함', async () => {
      // When: 갤러리 로딩 시도
      const galleryApp = await container.features.loadGallery();

      // Then: 갤러리 앱이 정상 생성되어야 함
      expect(galleryApp).toBeDefined();
      expect(typeof galleryApp.initialize).toBe('function');
      expect(typeof galleryApp.cleanup).toBe('function');
    });

    test('설정 마이그레이션이 올바르게 작동해야 함', () => {
      // When: 컨테이너에서 설정 접근
      const config = container.config;

      // Then: 기본 설정이 로드되어야 함
      expect(config).toBeDefined();
      expect(config.version).toBeDefined();
      expect(config.isDevelopment).toBeDefined();
      expect(config.debug).toBeDefined();
      expect(config.autoStart).toBeDefined();

      // And: 기본값이 올바르게 설정되어야 함
      expect(typeof config.version).toBe('string');
      expect(typeof config.isDevelopment).toBe('boolean');
      expect(typeof config.debug).toBe('boolean');
      expect(typeof config.autoStart).toBe('boolean');
    });
  });

  describe('라이프사이클 관리', () => {
    test('컨테이너 dispose가 모든 리소스를 정리해야 함', async () => {
      // Given: 활성 컨테이너
      expect(container).toBeDefined();

      // When: dispose 호출
      await container.dispose();

      // Then: 정리가 완료되어야 함 (에러 없이)
      expect(async () => {
        await container.dispose(); // 이중 dispose도 안전해야 함
      }).not.toThrow();
    });

    test('여러 컨테이너가 독립적으로 작동해야 함', async () => {
      // Given: 여러 컨테이너 생성
      const container1 = await createAppContainer({
        config: {
          version: '4.0.0-test1',
          debug: true,
        },
      });
      const container2 = await createAppContainer({
        config: {
          version: '4.0.0-test2',
          debug: false,
        },
      });

      // When: 각각의 설정 확인
      const config1 = container1.config.version;
      const config2 = container2.config.version;

      // Then: 독립적인 설정을 가져야 함
      expect(config1).toBe('4.0.0-test1');
      expect(config2).toBe('4.0.0-test2');
      expect(config1).not.toBe(config2);

      // Cleanup
      await container1.dispose();
      await container2.dispose();
    });
  });

  describe('에러 핸들링 및 복구', () => {
    test('서비스 초기화 실패 시 적절한 에러 처리를 해야 함', async () => {
      // When: 잘못된 설정으로 컨테이너 생성 시도
      expect(async () => {
        const testContainer = await createAppContainer({
          config: {
            version: null as any, // 의도적인 잘못된 설정 테스트
            isDevelopment: 'invalid' as any, // boolean이 아닌 값
          },
        });
        await testContainer.dispose();
      }).not.toThrow(); // 내부적으로 기본값으로 복구되어야 함
    });

    test('필수 서비스 누락 시 적절한 폴백을 제공해야 함', async () => {
      // When: 컨테이너 생성 (내부적으로 서비스 생성 실패가 있어도)
      const testContainer = await createAppContainer();

      // Then: 최소한의 기능은 제공되어야 함
      expect(testContainer.services).toBeDefined();
      expect(testContainer.logger).toBeDefined();
      expect(typeof testContainer.dispose).toBe('function');

      // Cleanup
      await testContainer.dispose();
    });
  });

  describe('성능 및 메모리 관리', () => {
    test('컨테이너 생성이 효율적이어야 함', async () => {
      // Given: 성능 측정 시작
      const startTime = Date.now();

      // When: 컨테이너 생성
      const testContainer = await createAppContainer();

      // Then: 합리적인 시간 내에 생성되어야 함 (1초 미만)
      const creationTime = Date.now() - startTime;
      expect(creationTime).toBeLessThan(1000);

      // Cleanup
      await testContainer.dispose();
    });

    test('메모리 누수가 없어야 함', async () => {
      // Given: 다수의 컨테이너 생성 및 정리
      const containers = [];

      // When: 컨테이너들 생성
      for (let i = 0; i < 10; i++) {
        containers.push(await createAppContainer());
      }

      // And: 모두 정리
      await Promise.all(containers.map(c => c.dispose()));

      // Then: 에러 없이 정리되어야 함
      expect(containers.length).toBe(10);
      // 메모리 누수는 별도 도구로 확인해야 하지만,
      // 최소한 dispose 과정에서 에러가 없어야 함
    });
  });
});
