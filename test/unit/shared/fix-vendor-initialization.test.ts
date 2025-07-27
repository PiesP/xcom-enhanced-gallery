/**
 * @fileoverview Vendor 초기화 에러 수정 테스트
 * @description getPreactCompat 초기화 순서 문제 해결 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Vendor 초기화 에러 수정', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('초기화 순서 문제', () => {
    it('initializeVendors() 없이 getPreactCompat() 호출 시 에러가 발생해야 한다', async () => {
      // vendor-api를 다시 import하여 초기화되지 않은 상태 테스트
      const { getPreactCompat } = await import('@shared/external/vendors');

      try {
        getPreactCompat();
        // 에러가 발생하지 않으면 테스트 실패
        expect(false).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toContain('Preact Compat이 초기화되지 않았습니다');
      }
    });

    it('initializeVendors() 호출 후에는 getPreactCompat()이 정상 작동해야 한다', async () => {
      const { initializeVendors, getPreactCompat } = await import('@shared/external/vendors');

      // 초기화 수행
      await initializeVendors();

      // 이제 정상적으로 호출되어야 함
      const compat = getPreactCompat();
      expect(compat).toBeDefined();
      expect(compat.memo).toBeDefined();
      expect(typeof compat.memo).toBe('function');
    });
  });

  describe('컴포넌트 수준 해결책', () => {
    it('컴포넌트에서 동적으로 memo를 가져와야 한다', async () => {
      // 동적 import 패턴 검증
      const dynamicGetMemo = async () => {
        try {
          const { getPreactCompat } = await import('@shared/external/vendors');
          return getPreactCompat().memo;
        } catch {
          // fallback for 미초기화 상태
          return null;
        }
      };

      // initializeVendors가 이미 호출되었으므로 memo 함수가 정상적으로 반환됨
      const memo = await dynamicGetMemo();
      expect(memo).toBeDefined();
      expect(typeof memo).toBe('function');
    });
  });
});
