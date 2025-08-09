/**
 * @fileoverview TDD: Preact Compat 안전 초기화
 * 목표:
 * 1) UI 컴포넌트에서 getPreactCompat 직접 import/모듈 스코프 호출 금지
 * 2) memo 유틸이 벤더 초기화 전에도 안전하게 동작해야 함
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'c:/git/xcom-enhanced-gallery';

function read(path: string): string {
  return readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

describe('TDD: Preact Compat 안전 초기화', () => {
  const targetFiles = [
    join(ROOT, 'src/shared/components/ui/Toast/Toast.tsx'),
    join(ROOT, 'src/shared/components/ui/Toast/ToastContainer.tsx'),
    join(ROOT, 'src/shared/components/ui/Button/Button.tsx'),
    join(ROOT, 'src/shared/components/ui/Toolbar/Toolbar.tsx'),
    join(ROOT, 'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.tsx'),
  ].filter(p => existsSync(p));

  it('RED: 위 컴포넌트들은 getPreactCompat를 직접 import하지 않아야 한다', () => {
    const offenders = targetFiles
      .map(p => ({ p, c: read(p) }))
      .filter(({ c }) => /getPreactCompat/.test(c));

    // 기대: 현재는 위반이 존재하여 실패(RED)
    expect({ offenders: offenders.map(o => o.p) }).toMatchObject({ offenders: [] });
  });

  describe('memo 유틸 안전성', () => {
    beforeEach(async () => {
      // 벤더 캐시 리셋으로 초기화 전 상태를 흉내
      const vendors = await import('../../src/shared/external/vendors/vendor-api');
      vendors.resetVendorCache();
    });

    it('RED: vendors 초기화 전에도 memo 유틸 호출 시 예외가 발생하지 않아야 한다', async () => {
      const { memo } = await import('../../src/shared/utils/optimization/memo');

      const Dummy = () => null;
      let Memoized: unknown = null;
      expect(() => {
        // 벤더 미초기화 상태에서 호출되더라도 안전해야 함
        // (최소한 예외가 발생하지 않아야 함)
        Memoized = (memo as any)(Dummy);
      }).not.toThrow();

      expect(Memoized).toBeTypeOf('function');
    });
  });
});
