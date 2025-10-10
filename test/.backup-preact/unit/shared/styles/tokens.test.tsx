/**
 * @fileoverview P5: Design Tokens Unit Tests
 *
 * 디자인 토큰의 일관성과 정확성을 검증하는 단위 테스트
 */

import { describe, test, expect } from 'vitest';
import {
  SPACING_TOKENS,
  RADIUS_TOKENS,
  CSS_SPACING_VARS,
  CSS_RADIUS_VARS,
  SPACING_MIGRATION_MAP,
  RADIUS_MIGRATION_MAP,
  getSpacing,
  getRadius,
  getSpacingVar,
  getRadiusVar,
  ALL_CSS_VARS,
} from '../../../../src/shared/styles/tokens';

describe('P5: Design Tokens', () => {
  describe('SPACING_TOKENS', () => {
    test('모든 spacing 토큰이 정의되어야 함', () => {
      expect(SPACING_TOKENS).toEqual({
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        xxl: '24px',
        xxxl: '32px',
      });
    });

    test('spacing 값들이 4px 배수 기반이어야 함', () => {
      const spacingValues = Object.values(SPACING_TOKENS);

      spacingValues.forEach(value => {
        const numericValue = parseInt(value, 10);
        // 2px는 예외적으로 허용 (매우 작은 간격용)
        if (numericValue !== 2) {
          expect(numericValue % 4).toBe(0);
        }
      });
    });

    test('spacing 토큰이 올바른 순서로 정렬되어야 함', () => {
      const values = Object.values(SPACING_TOKENS).map(v => parseInt(v, 10));
      const sortedValues = [...values].sort((a, b) => a - b);

      expect(values).toEqual(sortedValues);
    });
  });

  describe('RADIUS_TOKENS', () => {
    test('모든 radius 토큰이 정의되어야 함', () => {
      expect(RADIUS_TOKENS).toEqual({
        none: '0',
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        full: '50%',
      });
    });

    test('radius 값들이 적절한 형식이어야 함', () => {
      Object.entries(RADIUS_TOKENS).forEach(([key, value]) => {
        if (key === 'none') {
          expect(value).toBe('0');
        } else if (key === 'full') {
          expect(value).toBe('50%');
        } else {
          expect(value).toMatch(/^\d+px$/);
          const numericValue = parseInt(value, 10);
          expect(numericValue % 2).toBe(0); // 2px 배수
        }
      });
    });
  });

  describe('CSS Custom Properties', () => {
    test('spacing CSS 변수가 올바르게 생성되어야 함', () => {
      expect(CSS_SPACING_VARS).toEqual({
        '--spacing-xs': '2px',
        '--spacing-sm': '4px',
        '--spacing-md': '8px',
        '--spacing-lg': '12px',
        '--spacing-xl': '16px',
        '--spacing-xxl': '24px',
        '--spacing-xxxl': '32px',
      });
    });

    test('radius CSS 변수가 올바르게 생성되어야 함', () => {
      expect(CSS_RADIUS_VARS).toEqual({
        '--radius-none': '0',
        '--radius-xs': '2px',
        '--radius-sm': '4px',
        '--radius-md': '8px',
        '--radius-lg': '12px',
        '--radius-full': '50%',
      });
    });

    test('모든 CSS 변수가 통합되어야 함', () => {
      const expectedVars = {
        ...CSS_SPACING_VARS,
        ...CSS_RADIUS_VARS,
      };

      expect(ALL_CSS_VARS).toEqual(expectedVars);
      expect(Object.keys(ALL_CSS_VARS)).toHaveLength(13);
    });

    test('CSS 변수명이 올바른 형식이어야 함', () => {
      Object.keys(ALL_CSS_VARS).forEach(varName => {
        expect(varName).toMatch(/^--[a-z]+([-][a-z]+)*$/);
      });
    });
  });

  describe('Migration Maps', () => {
    test('spacing migration map이 모든 legacy 값을 커버해야 함', () => {
      const expectedLegacyValues = [
        '2px',
        '4px',
        '6px',
        '8px',
        '10px',
        '12px',
        '16px',
        '20px',
        '24px',
        '32px',
      ];

      expectedLegacyValues.forEach(legacyValue => {
        expect(SPACING_MIGRATION_MAP).toHaveProperty(legacyValue);
      });
    });

    test('spacing migration이 유효한 토큰으로 매핑되어야 함', () => {
      Object.values(SPACING_MIGRATION_MAP).forEach(token => {
        expect(SPACING_TOKENS).toHaveProperty(token);
      });
    });

    test('radius migration map이 올바르게 정의되어야 함', () => {
      expect(RADIUS_MIGRATION_MAP).toEqual({
        '0': 'none',
        '2px': 'xs',
        '4px': 'sm',
        '6px': 'sm', // 6px -> 4px로 정규화
        '8px': 'md',
        '12px': 'lg',
        '50%': 'full',
      });
    });

    test('radius migration이 유효한 토큰으로 매핑되어야 함', () => {
      Object.values(RADIUS_MIGRATION_MAP).forEach(token => {
        expect(RADIUS_TOKENS).toHaveProperty(token);
      });
    });
  });

  describe('Helper Functions', () => {
    test('getSpacing이 올바른 값을 반환해야 함', () => {
      expect(getSpacing('xs')).toBe('2px');
      expect(getSpacing('md')).toBe('8px');
      expect(getSpacing('xxl')).toBe('24px');
    });

    test('getRadius가 올바른 값을 반환해야 함', () => {
      expect(getRadius('none')).toBe('0');
      expect(getRadius('sm')).toBe('4px');
      expect(getRadius('full')).toBe('50%');
    });

    test('getSpacingVar가 올바른 CSS 변수를 반환해야 함', () => {
      expect(getSpacingVar('xs')).toBe('var(--spacing-xs)');
      expect(getSpacingVar('md')).toBe('var(--spacing-md)');
      expect(getSpacingVar('xxl')).toBe('var(--spacing-xxl)');
    });

    test('getRadiusVar가 올바른 CSS 변수를 반환해야 함', () => {
      expect(getRadiusVar('none')).toBe('var(--radius-none)');
      expect(getRadiusVar('sm')).toBe('var(--radius-sm)');
      expect(getRadiusVar('full')).toBe('var(--radius-full)');
    });
  });

  describe('Type Safety', () => {
    test('SpacingToken 타입이 올바른 키를 허용해야 함', () => {
      // TypeScript 컴파일 타임 체크
      const validTokens = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'];

      validTokens.forEach(token => {
        expect(SPACING_TOKENS[token]).toBeDefined();
      });
    });

    test('RadiusToken 타입이 올바른 키를 허용해야 함', () => {
      // TypeScript 컴파일 타임 체크
      const validTokens = ['none', 'xs', 'sm', 'md', 'lg', 'full'];

      validTokens.forEach(token => {
        expect(RADIUS_TOKENS[token]).toBeDefined();
      });
    });
  });

  describe('Consistency Validation', () => {
    test('토큰 개수가 일관되어야 함', () => {
      // spacing과 radius 토큰 개수 확인
      expect(Object.keys(SPACING_TOKENS)).toHaveLength(7);
      expect(Object.keys(RADIUS_TOKENS)).toHaveLength(6);

      // CSS 변수 개수가 토큰 개수와 일치해야 함
      expect(Object.keys(CSS_SPACING_VARS)).toHaveLength(7);
      expect(Object.keys(CSS_RADIUS_VARS)).toHaveLength(6);
    });

    test('값에 중복이 없어야 함 (circular 제외)', () => {
      const spacingValues = Object.values(SPACING_TOKENS);
      const uniqueSpacingValues = [...new Set(spacingValues)];
      expect(spacingValues).toHaveLength(uniqueSpacingValues.length);

      // radius는 none과 full이 특별하므로 px 값만 체크
      const pxRadiusValues = Object.values(RADIUS_TOKENS).filter(v => v.endsWith('px'));
      const uniquePxRadiusValues = [...new Set(pxRadiusValues)];
      expect(pxRadiusValues).toHaveLength(uniquePxRadiusValues.length);
    });

    test('토큰명이 일관된 명명 규칙을 따라야 함', () => {
      const spacingKeys = Object.keys(SPACING_TOKENS);
      const radiusKeys = Object.keys(RADIUS_TOKENS);

      // spacing 토큰은 xs, sm, md, lg, xl, xxl, xxxl 패턴
      expect(spacingKeys).toEqual(['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl']);

      // radius 토큰은 none, xs, sm, md, lg, full 패턴
      expect(radiusKeys).toEqual(['none', 'xs', 'sm', 'md', 'lg', 'full']);
    });
  });
});
