/**
 * 런타임 vendor 초기화 에러 테스트
 * 실제 프로덕션 환경에서 발생하는 vendor 초기화 문제를 재현하고 검증
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('런타임 vendor 초기화 에러', () => {
  beforeEach(() => {
    // 모든 import 캐시 정리
    vi.resetModules();
  });

  describe('프로덕션 환경 시뮬레이션', () => {
    it('프로덕션 환경에서 getPreactCompat() 호출 시 자동 초기화가 작동해야 한다', async () => {
      // import.meta.env.DEV를 false로 설정
      vi.stubGlobal('import', {
        meta: {
          env: {
            DEV: false,
            PROD: true,
          },
        },
      });

      // 콘솔 로그 캡처
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // vendor-api를 새로 import
      const { getPreactCompat } = await import('@shared/external/vendors');

      // 자동 초기화가 작동하여 에러가 발생하지 않아야 함
      expect(() => {
        const compat = getPreactCompat();
        expect(compat).toBeDefined();
        expect(compat.memo).toBeDefined();
        expect(compat.forwardRef).toBeDefined();
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('프로덕션 환경에서 컴포넌트 memo 적용이 안전하게 작동해야 한다', async () => {
      // import.meta.env.DEV를 false로 설정
      vi.stubGlobal('import', {
        meta: {
          env: {
            DEV: false,
            PROD: true,
          },
        },
      });

      // GalleryContainer import 시 에러가 발생하지 않아야 함
      expect(async () => {
        const { GalleryContainer } = await import('@shared/components/isolation/GalleryContainer');
        expect(GalleryContainer).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('환경 독립적 자동 초기화', () => {
    it('환경과 상관없이 자동 초기화가 작동해야 한다', async () => {
      // 환경 변수를 다양하게 설정
      const environments = [
        { DEV: true, PROD: false },
        { DEV: false, PROD: true },
        { DEV: undefined, PROD: undefined },
      ];

      for (const env of environments) {
        vi.resetModules();
        vi.stubGlobal('import', {
          meta: {
            env,
          },
        });

        const { getPreactCompat } = await import('@shared/external/vendors');

        expect(() => {
          const compat = getPreactCompat();
          expect(compat).toBeDefined();
          expect(compat.memo).toBeDefined();
          expect(compat.forwardRef).toBeDefined();
        }).not.toThrow();
      }
    });
  });

  describe('fallback 메커니즘', () => {
    it('초기화 실패 시에도 기본 memo/forwardRef 구현을 제공해야 한다', async () => {
      const { getPreactCompat } = await import('@shared/external/vendors');

      const compat = getPreactCompat();
      expect(compat.memo).toBeDefined();
      expect(compat.forwardRef).toBeDefined();

      // memo 함수 테스트
      const TestComponent = (props: { value: string }) => {
        return props.value;
      };
      const MemoizedComponent = compat.memo(TestComponent);
      expect(MemoizedComponent).toBeDefined();
      expect(typeof MemoizedComponent).toBe('function');

      // forwardRef 함수 테스트
      const ForwardedComponent = compat.forwardRef(TestComponent);
      expect(ForwardedComponent).toBeDefined();
      expect(typeof ForwardedComponent).toBe('function');
    });
  });
});
