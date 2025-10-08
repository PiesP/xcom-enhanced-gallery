/**
 * @fileoverview Phase 4.1: Icon Component (Solid.js) Test
 * @description
 * Icon.solid 컴포넌트의 TDD 테스트 (Phase 4.1)
 * NOTE: Phase 0 스타일 테스트 (컴파일/타입 검증). DOM 렌더링 테스트는 Phase 4 후반에 추가 예정.
 */

import { describe, it, expect } from 'vitest';
import { Icon } from '../../../../../src/shared/components/ui/Icon/Icon';

describe('Icon.solid (TDD - Phase 4.1)', () => {
  describe('Build System Verification', () => {
    it('should compile Solid Icon component successfully', () => {
      // 컴포넌트가 정상적으로 import되고 타입이 올바른지 확인
      expect(Icon).toBeDefined();
      expect(typeof Icon).toBe('function');
    });

    it('should have correct TypeScript types', () => {
      // TypeScript가 Solid JSX를 올바르게 인식하는지 확인
      const component = (
        <Icon aria-label='Test icon'>
          <path d='M7 4v16l13-8z' />
        </Icon>
      );

      // JSX가 올바르게 컴파일되었는지 확인 (타입 오류 없이 실행됨)
      expect(component).toBeDefined();
    });

    it('should support size prop with number type', () => {
      const component = <Icon size={16} />;
      expect(component).toBeDefined();
    });

    it('should support size prop with string type', () => {
      const component = <Icon size='var(--xeg-icon-size-lg)' />;
      expect(component).toBeDefined();
    });

    it('should support custom className', () => {
      const component = <Icon class='custom-icon' />;
      expect(component).toBeDefined();
    });

    it('should support aria-label for accessibility', () => {
      const component = <Icon aria-label='Download' />;
      expect(component).toBeDefined();
    });

    it('should support children (SVG content)', () => {
      const component = (
        <Icon>
          <path d='M7 4v16l13-8z' />
          <circle cx='12' cy='12' r='10' />
        </Icon>
      );
      expect(component).toBeDefined();
    });

    it('should support Solid primitives import', async () => {
      // Solid.js 코어 primitives가 올바르게 import되는지 확인
      const { mergeProps, splitProps } = await import('solid-js');

      expect(mergeProps).toBeDefined();
      expect(typeof mergeProps).toBe('function');
      expect(splitProps).toBeDefined();
      expect(typeof splitProps).toBe('function');
    });
  });
});
