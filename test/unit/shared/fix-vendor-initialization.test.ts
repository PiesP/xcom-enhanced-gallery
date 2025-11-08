/**
 * @fileoverview Vendor 초기화 에러 수정 테스트
 * @description getSolid 초기화 순서 문제 해결 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';

describe('Vendor 초기화 에러 수정', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('초기화 순서 문제', () => {
    it('initializeVendors() 없이 getSolid() 호출 시 자동 초기화가 작동해야 한다', async () => {
      // vendor-api를 다시 import하여 초기화되지 않은 상태 테스트
      const { getSolid } = await import('@shared/external/vendors');

      // 자동 초기화가 작동하므로 에러가 발생하지 않아야 함
      const compat = getSolid();
      expect(compat).toBeDefined();
      expect(compat.memo).toBeDefined();
      expect(compat.forwardRef).toBeDefined();
    });

    it('initializeVendors() 호출 후에는 getSolid()이 정상 작동해야 한다', async () => {
      const { initializeVendors, getSolid } = await import('@shared/external/vendors');

      // 초기화 수행
      await initializeVendors();

      // 이제 정상적으로 호출되어야 함
      const compat = getSolid();
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
          const { getSolid } = await import('@shared/external/vendors');
          return getSolid().memo;
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
