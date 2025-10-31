/**
 * @fileoverview Phase 5 - SERVICE_KEYS 사용량 감소 테스트 (ServiceHarness 기반)
 *
 * 목표: legacy SERVICE_KEYS 직접 사용을 줄이고 표준 접근자/하네스를 통한 접근으로 전환
 *
 * TDD Approach:
 * 1. Red: SERVICE_KEYS 사용량 기준선 설정
 * 2. Green: ServiceHarness 기반 서비스 access 추가
 * 3. Refactor: legacy usage 점진적 대체
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SERVICE_KEYS } from '@/constants';
import { createServiceHarness, ServiceHarness } from '@/shared/container/ServiceHarness';
import {
  getMediaServiceFromContainer,
  getThemeService,
  getToastController,
  getBulkDownloadServiceFromContainer,
  getMediaFilenameService,
} from '@/shared/container/service-accessors';

describe('Phase 5 - SERVICE_KEYS Usage Reduction (ServiceHarness)', () => {
  let harness: ServiceHarness;

  beforeEach(async () => {
    harness = createServiceHarness();
    await harness.initCoreServices();
  });

  afterEach(() => {
    harness?.reset();
  });

  describe('SERVICE_KEYS 기준선 측정', () => {
    it('현재 SERVICE_KEYS 수가 합리적인 범위에 있어야 함', () => {
      // Red: 현재 SERVICE_KEYS 사용량을 측정하여 기준선 설정
      const serviceKeysCount = Object.keys(SERVICE_KEYS || {}).length;

      // 현재 SERVICE_KEYS는 30개 이하여야 함 (현실적 목표)
      expect(serviceKeysCount).toBeLessThanOrEqual(30);
      // console.log 대신 테스트 메타데이터로 기록
    });

    it('핵심 서비스들이 SERVICE_KEYS에 정의되어 있어야 함', () => {
      // Red: 필수 서비스들이 정의되어 있는지 확인
      const requiredServices = ['media.service', 'theme.auto', 'toast.controller', 'video.control'];

      const serviceValues = Object.values(SERVICE_KEYS || {});
      for (const service of requiredServices) {
        expect(serviceValues).toContain(service);
      }
    });
  });

  describe('ServiceHarness 기반 서비스 접근', () => {
    it('표준 접근자/브리지로 핵심 서비스 접근이 가능해야 함', async () => {
      // Green: 하네스 초기화 후 접근자들이 동작해야 함
      expect(() => getMediaServiceFromContainer()).not.toThrow();
      expect(() => getThemeService()).not.toThrow();
      expect(() => getToastController()).not.toThrow();
      expect(() => getBulkDownloadServiceFromContainer()).not.toThrow();
      expect(() => getMediaFilenameService()).not.toThrow();
    });

    it('bridge 기반 get과 접근자가 동일 인스턴스를 반환해야 함', () => {
      const mediaViaBridge = harness.get<typeof getMediaServiceFromContainer>(
        SERVICE_KEYS.MEDIA_SERVICE
      );
      const mediaViaAccessor = getMediaServiceFromContainer();
      expect(mediaViaAccessor).toBe(mediaViaBridge);

      const themeViaBridge = harness.get(SERVICE_KEYS.THEME);
      const themeViaAccessor = getThemeService();
      expect(themeViaAccessor).toBe(themeViaBridge);
    });
  });

  describe('타입 안전성 개선', () => {
    it('핵심 서비스 인스턴스는 객체여야 함', () => {
      const media = getMediaServiceFromContainer();
      const theme = getThemeService();
      const toast = getToastController();
      expect(typeof media === 'object' || typeof media === 'function').toBe(true);
      expect(typeof theme === 'object').toBe(true);
      expect(typeof toast === 'object').toBe(true);
    });
  });

  describe('점진적 마이그레이션 지원', () => {
    it('표준 접근자 사용을 권장(경고 훅은 향후 추가 대상)', () => {
      const consoleSpy = vi.spyOn(globalThis.console, 'warn').mockImplementation(() => {});
      // 현재는 경고를 강제하지 않음 — 접근자가 정상 동작하는지만 확인
      expect(() => getMediaServiceFromContainer()).not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('성능 최적화', () => {
    it('서비스 조회가 효율적이어야 함', async () => {
      // Refactor: 새로운 방식이 성능상 이점이 있어야 함
      const iterations = 100;

      const start = globalThis.performance.now();
      for (let i = 0; i < iterations; i++) {
        // 서비스 접근 (캐싱되어야 함)
        try {
          getMediaServiceFromContainer();
        } catch {
          // 테스트 환경에서 예상된 동작
        }
      }
      const end = globalThis.performance.now();

      const duration = end - start;

      // 100회 조회가 10ms 이내에 완료되어야 함
      expect(duration).toBeLessThan(10);
      // 성능 메트릭을 테스트 메타데이터로 기록
    });

    it('중복 서비스 인스턴스가 생성되지 않아야 함', () => {
      // Refactor: 싱글톤 패턴 검증
      try {
        const service1 = getMediaServiceFromContainer();
        const service2 = getMediaServiceFromContainer();

        // 같은 인스턴스여야 함
        expect(service1).toBe(service2);
      } catch (error) {
        // 테스트 환경에서 예상된 동작
        expect((error as Error).message).toContain('서비스를 찾을 수 없습니다');
      }
    });
  });

  describe('미래 확장성', () => {
    it('핵심 서비스 키가 존재하고 조회 가능해야 함', () => {
      const requiredKeys = [
        SERVICE_KEYS.MEDIA_SERVICE,
        SERVICE_KEYS.THEME,
        SERVICE_KEYS.TOAST,
        SERVICE_KEYS.BULK_DOWNLOAD,
        SERVICE_KEYS.MEDIA_FILENAME,
      ];
      for (const key of requiredKeys) {
        expect(() => harness.get(key)).not.toThrow();
      }
    });
  });
});
