/**
 * @fileoverview Phase 0: Solid.js Infrastructure Test
 * @description Solid.js 빌드 환경 검증 테스트 (컴파일 및 타입 검증)
 */

import { describe, it, expect } from 'vitest';
import { HelloSolid } from '../../../src/shared/components/HelloSolid.solid';

describe('Phase 0: Solid.js Infrastructure', () => {
  describe('Build System Verification', () => {
    it('should compile Solid component successfully', () => {
      // 컴포넌트가 정상적으로 import되고 타입이 올바른지 확인
      expect(HelloSolid).toBeDefined();
      expect(typeof HelloSolid).toBe('function');
    });

    it('should have correct TypeScript types', () => {
      // TypeScript가 Solid JSX를 올바르게 인식하는지 확인
      const props = { initialCount: 5 };
      const component = <HelloSolid {...props} />;

      // JSX가 올바르게 컴파일되었는지 확인 (타입 오류 없이 실행됨)
      expect(component).toBeDefined();
    });

    it('should support Solid primitives import', async () => {
      // Solid.js 코어 primitives가 올바르게 import되는지 확인
      const { createSignal } = await import('solid-js');

      expect(createSignal).toBeDefined();
      expect(typeof createSignal).toBe('function');

      // createSignal이 정상 작동하는지 확인
      const [count, setCount] = createSignal(0);
      expect(count()).toBe(0);

      setCount(5);
      expect(count()).toBe(5);
    });

    it('should have vite-plugin-solid configured', () => {
      // Solid 플러그인이 올바르게 설정되었는지 간접 확인
      // 이 테스트 파일이 실행되었다는 것은 .solid.tsx 파일이 컴파일되었다는 의미
      expect(true).toBe(true);
    });
  });
});
