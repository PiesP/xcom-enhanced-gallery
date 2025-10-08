/**
 * @fileoverview HeroX Icon Tests (Solid.js)
 * @description Type verification tests for HeroX Solid.js component
 * Phase 0 스타일: 컴파일 및 타입 검증만 수행, DOM 렌더링 테스트는 제외
 */

import { describe, it, expect } from 'vitest';
import { HeroX } from '@shared/components/ui/Icon/hero/HeroX';

describe('HeroX.solid (Type Verification - Phase 0 Style)', () => {
  it('should compile and export HeroX function', () => {
    expect(HeroX).toBeDefined();
    expect(typeof HeroX).toBe('function');
  });

  it('should accept no props (default)', () => {
    expect(() => HeroX({})).not.toThrow();
  });

  it('should accept size prop (number)', () => {
    expect(() => HeroX({ size: 16 })).not.toThrow();
  });

  it('should accept size prop (string)', () => {
    expect(() => HeroX({ size: 'var(--xeg-icon-size)' })).not.toThrow();
  });

  it('should accept class prop', () => {
    expect(() => HeroX({ class: 'custom-icon' })).not.toThrow();
  });

  it('should accept aria-label prop', () => {
    expect(() => HeroX({ 'aria-label': '닫기' })).not.toThrow();
  });

  it('should accept combined props', () => {
    expect(() =>
      HeroX({
        size: 24,
        class: 'hero-x-icon',
        'aria-label': 'Close dialog',
      })
    ).not.toThrow();
  });

  it('should return JSX element (basic type check)', () => {
    const result = HeroX({ size: 16 });
    expect(result).toBeDefined();
  });
});
