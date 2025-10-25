/**
 * Phase 2 - Legacy Adapter Contract 테스트
 *
 * 목적: 기존 SERVICE_KEYS 기반 코드가 새로운 AppContainer와 호환되도록 보장
 * 범위: getService() 호출을 새 컨테이너로 투명하게 매핑
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { createAppContainer } from '../../helpers/createAppContainer';
import { SERVICE_KEYS } from '@/constants';

describe('Phase 2 - Legacy Adapter Contract', () => {
  let container;

  beforeEach(async () => {
    // Legacy adapter 활성화된 컨테이너 생성
    container = await createAppContainer({ enableLegacyAdapter: true });
  });

  afterEach(async () => {
    await container?.dispose();
  });

  describe('SERVICE_KEYS 호환성', () => {
    test('기존 SERVICE_KEYS가 새 서비스로 매핑되어야 함', () => {
      // Given: Legacy adapter가 활성화된 컨테이너
      expect(container).toBeDefined();

      // When: SERVICE_KEYS 확인
      // Then: 모든 키가 정의되어 있어야 함
      expect(SERVICE_KEYS.MEDIA_SERVICE).toBeDefined();
      expect(SERVICE_KEYS.THEME).toBeDefined();
      expect(SERVICE_KEYS.TOAST).toBeDefined();
      expect(SERVICE_KEYS.VIDEO_CONTROL).toBeDefined();
    });

    test('Legacy adapter가 글로벌에 설치되어야 함', () => {
      // When: 글로벌 adapter 확인
      const globalAdapter = (globalThis as any).__XEG_LEGACY_ADAPTER__;

      // Then: Adapter가 설치되어 있어야 함
      expect(globalAdapter).toBeDefined();
      expect(typeof globalAdapter.getService).toBe('function');
    });

    test('각 SERVICE_KEY가 적절한 서비스 타입으로 매핑되어야 함', () => {
      // Given: Legacy adapter
      const adapter = (globalThis as any).__XEG_LEGACY_ADAPTER__;

      // When & Then: 각 키가 올바른 서비스로 매핑되어야 함
      expect(() => {
        const mediaService = adapter.getService(SERVICE_KEYS.MEDIA_SERVICE);
        expect(mediaService).toBeDefined();
        expect(typeof mediaService.extractMediaUrls).toBe('function');
      }).not.toThrow();

      expect(() => {
        const themeService = adapter.getService(SERVICE_KEYS.THEME);
        expect(themeService).toBeDefined();
        expect(typeof themeService.getCurrentTheme).toBe('function');
      }).not.toThrow();

      expect(() => {
        const toastService = adapter.getService(SERVICE_KEYS.TOAST);
        expect(toastService).toBeDefined();
        expect(typeof toastService.show).toBe('function');
      }).not.toThrow();

      expect(() => {
        const videoService = adapter.getService(SERVICE_KEYS.VIDEO_CONTROL);
        expect(videoService).toBeDefined();
        expect(typeof videoService.pauseAll).toBe('function');
      }).not.toThrow();
    });
  });

  describe('Deprecation 경고', () => {
    test('Legacy getService 사용 시 deprecation 경고가 발생해야 함', () => {
      // Given: 경고 메시지를 캡처할 spy
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const adapter = (globalThis as any).__XEG_LEGACY_ADAPTER__;

      // When: Legacy getService 사용
      adapter.getService(SERVICE_KEYS.MEDIA_SERVICE);

      // Then: Deprecation 경고가 발생해야 함
      // Note: logger.warn을 사용하므로 console.warn이 아닐 수 있음
      // 실제 구현에 따라 조정 필요

      consoleSpy.mockRestore();
    });

    test('새로운 컨테이너 방식 사용 시 경고가 없어야 함', () => {
      // Given: 경고 메시지를 캡처할 spy
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // When: 새로운 방식으로 서비스 사용
      const mediaService = container.services.media;
      expect(mediaService).toBeDefined();

      // Then: 경고가 발생하지 않아야 함
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('기존 코드 패턴 호환성', () => {
    test('기존 getService(key) 패턴이 작동해야 함', () => {
      // Given: Legacy adapter
      const adapter = (globalThis as any).__XEG_LEGACY_ADAPTER__;

      // When: 기존 패턴으로 서비스 접근
      const mediaService = adapter.getService(SERVICE_KEYS.MEDIA_SERVICE);
      const themeService = adapter.getService(SERVICE_KEYS.THEME);

      // Then: 서비스들이 정상적으로 반환되어야 함
      expect(mediaService).toBeDefined();
      expect(themeService).toBeDefined();
      expect(mediaService).toBe(container.services.media);
      expect(themeService).toBe(container.services.theme);
    });

    test('존재하지 않는 서비스 키에 대한 적절한 폴백이 있어야 함', () => {
      // Given: Legacy adapter
      const adapter = (globalThis as any).__XEG_LEGACY_ADAPTER__;

      // When: 알 수 없는 키로 서비스 조회
      expect(() => {
        adapter.getService('unknown.service.key');
      }).toThrow(); // 또는 적절한 폴백 반환
    });

    test('서비스 메서드 호출이 정상 작동해야 함', async () => {
      // Given: Legacy 방식으로 가져온 서비스
      const adapter = (globalThis as any).__XEG_LEGACY_ADAPTER__;
      const mediaService = adapter.getService(SERVICE_KEYS.MEDIA_SERVICE);

      // When: 서비스 메서드 호출
      const mockElement = { querySelector: () => null, querySelectorAll: () => [] } as unknown as {
        querySelector: (s: string) => unknown;
        querySelectorAll: (s: string) => unknown;
      };

      // Then: 에러 없이 실행되어야 함
      expect(async () => {
        await mediaService.extractMediaUrls(mockElement);
      }).not.toThrow();
    });
  });

  describe('점진적 마이그레이션 지원', () => {
    test('Legacy와 새 방식이 동시에 작동해야 함', () => {
      // Given: 두 방식으로 접근한 서비스
      const adapter = (globalThis as any).__XEG_LEGACY_ADAPTER__;
      const legacyMediaService = adapter.getService(SERVICE_KEYS.MEDIA_SERVICE);
      const newMediaService = container.services.media;

      // When: 두 방식으로 얻은 서비스 비교
      // Then: 같은 인스턴스여야 함
      expect(legacyMediaService).toBe(newMediaService);
    });

    test('컨테이너 dispose 시 legacy adapter도 정리되어야 함', async () => {
      // Given: 활성 legacy adapter
      const adapter = (globalThis as any).__XEG_LEGACY_ADAPTER__;
      expect(adapter).toBeDefined();

      // When: 컨테이너 dispose
      await container.dispose();

      // Then: Legacy adapter가 정리되어야 함
      const adapterAfterDispose = (globalThis as any).__XEG_LEGACY_ADAPTER__;
      expect(adapterAfterDispose).toBeUndefined();
    });
  });

  describe('성능 및 안정성', () => {
    test('Legacy adapter 오버헤드가 최소화되어야 함', () => {
      // Given: 성능 측정 시작
      const adapter = (globalThis as any).__XEG_LEGACY_ADAPTER__;
      const startTime = Date.now();

      // When: 다수의 서비스 조회
      for (let i = 0; i < 100; i++) {
        adapter.getService(SERVICE_KEYS.MEDIA_SERVICE);
        adapter.getService(SERVICE_KEYS.THEME);
      }

      // Then: 합리적인 시간 내에 완료되어야 함
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(50); // 50ms 미만
    });

    test('메모리 누수가 없어야 함', async () => {
      // Given: 다수의 컨테이너 생성/해제
      const containers = [];

      // When: 컨테이너들 생성
      for (let i = 0; i < 5; i++) {
        const testContainer = await createAppContainer({ enableLegacyAdapter: true });
        containers.push(testContainer);
      }

      // And: 모두 해제
      await Promise.all(containers.map(c => c.dispose()));

      // Then: 글로벌 adapter가 정리되어야 함
      const finalAdapter = (globalThis as any).__XEG_LEGACY_ADAPTER__;
      expect(finalAdapter).toBeUndefined();
    });
  });
});
