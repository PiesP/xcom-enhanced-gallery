/**
 * @fileoverview TDD 기반 의존성 최적화 테스트
 * @description 사용하지 않는 외부 라이브러리 제거 검증
 */

import { describe, it, expect } from 'vitest';

describe('의존성 최적화 테스트 - Phase GREEN (구현 완료)', () => {
  describe('1. Motion 라이브러리 제거 검증', () => {
    it('Motion 관련 import가 존재하지 않아야 한다', async () => {
      // Motion 라이브러리가 번들에 포함되지 않았는지 확인
      expect(() => {
        // @ts-expect-error Motion 라이브러리가 제거되어 존재하지 않음
        import('motion');
      }).toThrow();
    });

    it('vendor-api에서 getMotion 함수가 제거되었어야 한다', async () => {
      const vendorApi = await import('../src/shared/external/vendors/vendor-api');
      expect('getMotion' in vendorApi).toBe(false);
    });

    it('vendor-manager에서 MotionAPI 타입이 제거되었어야 한다', async () => {
      const vendorManager = await import('../src/shared/external/vendors/vendor-manager');
      // MotionAPI 타입이 export되지 않는지 확인
      expect('MotionAPI' in vendorManager).toBe(false);
    });

    it('AnimationService가 CSS 기반으로 동작해야 한다', async () => {
      const { AnimationService } = await import('../src/shared/services/AnimationService');
      const service = AnimationService.getInstance();

      // CSS 애니메이션 상수들이 정의되어 있는지 확인
      expect(service).toBeDefined();

      // DOM에 CSS 스타일이 주입되었는지 확인
      const styleElement = document.querySelector('style[data-animation-service]');
      expect(styleElement).toBeTruthy();
    });
  });

  describe('2. TanStack Query 라이브러리 제거 검증', () => {
    it('TanStack Query 관련 import가 존재하지 않아야 한다', async () => {
      // TanStack Query 라이브러리가 번들에 포함되지 않았는지 확인
      expect(() => {
        // @ts-expect-error TanStack Query 라이브러리가 제거되어 존재하지 않음
        import('@tanstack/query-core');
      }).toThrow();
    });

    it('vendor-api에서 getTanStackQuery 함수가 제거되었어야 한다', async () => {
      const vendorApi = await import('../src/shared/external/vendors/vendor-api');
      expect('getTanStackQuery' in vendorApi).toBe(false);
    });

    it('vendor-manager에서 TanStackQueryAPI 타입이 제거되었어야 한다', async () => {
      const vendorManager = await import('../src/shared/external/vendors/vendor-manager');
      // TanStackQueryAPI 타입이 export되지 않는지 확인
      expect('TanStackQueryAPI' in vendorManager).toBe(false);
    });
  });

  describe('3. 기능 유지 검증', () => {
    it('Preact 및 Preact Signals가 정상 동작해야 한다', async () => {
      const { initializeVendors, getPreact, getPreactSignals } = await import(
        '../src/shared/external/vendors'
      );

      await initializeVendors();

      const preact = getPreact();
      const signals = getPreactSignals();

      expect(preact).toBeDefined();
      expect(preact.createElement).toBeDefined();
      expect(signals).toBeDefined();
      expect(signals.signal).toBeDefined();
    });

    it('fflate 압축 기능이 정상 동작해야 한다', async () => {
      const { initializeVendors, getFflate } = await import('../src/shared/external/vendors');

      await initializeVendors();

      const fflate = getFflate();
      expect(fflate).toBeDefined();
      expect(fflate.zip).toBeDefined();
      expect(fflate.unzip).toBeDefined();
    });

    it('애니메이션 기능이 CSS 기반으로 정상 동작해야 한다', async () => {
      const { AnimationService } = await import('../src/shared/services/AnimationService');
      const service = AnimationService.getInstance();

      // 테스트용 DOM 요소 생성
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);

      // CSS 기반 애니메이션 실행
      await service.animateGalleryEnter(testElement);

      // 애니메이션 클래스가 적용되었는지 확인
      expect(testElement.classList.contains('animate-fade-in')).toBe(true);

      // 정리
      document.body.removeChild(testElement);
    });
  });

  describe('4. 번들 크기 최적화 검증', () => {
    it('번들 크기가 예상 범위 내에 있어야 한다', async () => {
      // 개발 빌드 기준 500KB 미만, 프로덕션 빌드 기준 300KB 미만
      // 실제 번들 크기는 빌드 시 확인되므로 여기서는 라이브러리 제거 확인
      const packageJson = await import('../package.json');

      // motion과 @tanstack/query-core가 dependencies에서 제거되었는지 확인
      expect(packageJson.dependencies).not.toHaveProperty('motion');
      expect(packageJson.dependencies).not.toHaveProperty('@tanstack/query-core');

      // 필요한 라이브러리들은 여전히 존재하는지 확인
      expect(packageJson.dependencies).toHaveProperty('preact');
      expect(packageJson.dependencies).toHaveProperty('@preact/signals');
      expect(packageJson.dependencies).toHaveProperty('fflate');
    });

    it('vendor 초기화가 빠르게 완료되어야 한다', async () => {
      const startTime = performance.now();

      const { initializeVendors } = await import('../src/shared/external/vendors');
      await initializeVendors();

      const endTime = performance.now();
      const initTime = endTime - startTime;

      // 초기화 시간이 100ms 미만이어야 함 (라이브러리 감소로 인한 성능 향상)
      expect(initTime).toBeLessThan(100);
    });
  });

  describe('5. 에러 처리 및 타입 안전성', () => {
    it('삭제된 라이브러리 함수 호출 시 안전하게 처리되어야 한다', async () => {
      // 컴파일 시점에서 이미 타입 에러로 방지되므로
      // 런타임에서는 해당 함수들이 존재하지 않음을 확인
      const vendorApi = await import('../src/shared/external/vendors/vendor-api');

      // Motion과 TanStack Query 관련 함수들이 undefined인지 확인
      expect((vendorApi as any).getMotion).toBeUndefined();
      expect((vendorApi as any).getMotionOne).toBeUndefined();
      expect((vendorApi as any).getTanStackQuery).toBeUndefined();
    });

    it('애니메이션 서비스가 Motion 없이도 안전하게 동작해야 한다', async () => {
      const { AnimationService } = await import('../src/shared/services/AnimationService');
      const service = AnimationService.getInstance();

      // Motion One 없이도 애니메이션이 실행되는지 확인
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);

      // 에러 없이 실행되어야 함
      expect(async () => {
        await service.animateGalleryEnter(testElement);
        await service.animateGalleryExit(testElement);
      }).not.toThrow();

      // 정리
      document.body.removeChild(testElement);
    });
  });
});
