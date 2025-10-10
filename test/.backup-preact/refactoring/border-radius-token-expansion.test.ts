/**
 * @fileoverview Border Radius Token Expansion Tests
 * @description TDD 기반 확장된 radius 토큰 검증
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Border Radius Token Expansion', () => {
  let primitiveTokensContent: string;

  beforeEach(() => {
    const tokensPath = resolve(__dirname, '../../src/shared/styles/design-tokens.primitive.css');
    primitiveTokensContent = readFileSync(tokensPath, 'utf-8');
  });

  describe('RED 단계: 확장된 radius 토큰이 정의되어야 함', () => {
    it('--radius-xs 토큰이 정의되어야 함 (2px)', () => {
      expect(primitiveTokensContent).toContain('--radius-xs: 2px');
    });

    it('--radius-2xl 토큰이 정의되어야 함 (16px)', () => {
      expect(primitiveTokensContent).toContain('--radius-2xl: 16px');
    });

    it('--radius-pill 토큰이 정의되어야 함 (28px)', () => {
      expect(primitiveTokensContent).toContain('--radius-pill: 28px');
    });

    it('전체 radius 토큰 체계가 일관되어야 함', () => {
      const expectedTokens = [
        '--radius-xs: 2px',
        '--radius-sm: 4px',
        '--radius-md: 6px',
        '--radius-lg: 8px',
        '--radius-xl: 12px',
        '--radius-2xl: 16px',
        '--radius-pill: 28px',
      ];

      expectedTokens.forEach(token => {
        expect(primitiveTokensContent).toContain(token);
      });
    });
  });

  describe('GREEN 단계: 토큰 순서 및 주석이 적절해야 함', () => {
    it('radius 토큰들이 크기 순으로 정렬되어야 함', () => {
      const tokens = [
        '--radius-xs',
        '--radius-sm',
        '--radius-md',
        '--radius-lg',
        '--radius-xl',
        '--radius-2xl',
        '--radius-pill',
      ];

      // 각 토큰이 존재하는지 확인
      tokens.forEach(token => {
        const tokenExists = primitiveTokensContent.includes(token);
        expect(tokenExists, `${token} should exist in tokens file`).toBe(true);
      });

      // 크기 순으로 정렬되어 있는지 확인 (인덱스 기준)
      let lastIndex = -1;
      tokens.forEach(token => {
        const currentIndex = primitiveTokensContent.indexOf(token);
        expect(currentIndex, `${token} should be found`).toBeGreaterThan(-1);
        expect(currentIndex, `${token} should come after previous token`).toBeGreaterThan(
          lastIndex
        );
        lastIndex = currentIndex;
      });
    });

    it('각 토큰에 사용 목적 주석이 있어야 함', () => {
      expect(primitiveTokensContent).toMatch(/--radius-xs.*\/\*.*작은.*\*\//);
      expect(primitiveTokensContent).toMatch(/--radius-2xl.*\/\*.*큰.*\*\//);
      expect(primitiveTokensContent).toMatch(/--radius-pill.*\/\*.*pill.*둥근.*\*\//);
    });
  });
});
