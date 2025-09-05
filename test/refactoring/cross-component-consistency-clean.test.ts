/**
 * Cross-Component Consistency Test
 * Week 3: 전체 시스템 일관성 검증
 *
 * 목적: 모든 컴포넌트 간 border-radius 토큰 사용 일관성 검증
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// 테스트 대상 CSS 파일들
const CSS_FILES = {
  designTokensPrimitive: 'src/shared/styles/design-tokens.primitive.css',
  designTokensSemantic: 'src/shared/styles/design-tokens.semantic.css',
  unifiedToolbarButton:
    'src/shared/components/UnifiedToolbarButton/UnifiedToolbarButton.module.css',
  toast: 'src/shared/components/Toast/Toast.module.css',
  gallery: 'src/features/gallery/components/Gallery/Gallery.module.css',
  galleryGlobal: 'src/features/gallery/assets/styles/gallery-global.css',
  isolatedGallery: 'src/features/gallery/assets/styles/isolated-gallery.css',
};

function readCSSFile(relativePath) {
  try {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
  } catch {
    return '';
  }
}

describe('Cross-Component Consistency Verification', () => {
  describe('Phase 1: 토큰 체계 완전성 검증', () => {
    it('모든 primitive 토큰이 정의되어야 함', () => {
      const primitiveCSS = readCSSFile(CSS_FILES.designTokensPrimitive);

      const expectedTokens = [
        '--radius-xs: 2px',
        '--radius-sm: 4px',
        '--radius-md: 6px',
        '--radius-lg: 8px',
        '--radius-xl: 12px',
        '--radius-2xl: 16px',
        '--radius-pill: 28px',
        '--radius-full: 50%',
      ];

      expectedTokens.forEach(token => {
        expect(primitiveCSS).toContain(token);
      });
    });

    it('모든 semantic 토큰이 primitive를 참조해야 함', () => {
      const semanticCSS = readCSSFile(CSS_FILES.designTokensSemantic);

      const expectedMappings = [
        '--xeg-radius-xs: var(--radius-xs)',
        '--xeg-radius-sm: var(--radius-sm)',
        '--xeg-radius-md: var(--radius-md)',
        '--xeg-radius-lg: var(--radius-lg)',
        '--xeg-radius-xl: var(--radius-xl)',
        '--xeg-radius-2xl: var(--radius-2xl)',
        '--xeg-radius-pill: var(--radius-pill)',
        '--xeg-radius-full: var(--radius-full)',
      ];

      expectedMappings.forEach(mapping => {
        expect(semanticCSS).toContain(mapping);
      });
    });
  });

  describe('Phase 2: 컴포넌트별 토큰 사용 검증', () => {
    it('UnifiedToolbarButton이 적절한 토큰만 사용해야 함', () => {
      const buttonCSS = readCSSFile(CSS_FILES.unifiedToolbarButton);

      // 하드코딩된 border-radius 값이 없어야 함
      const hardcodedValues = /border-radius:\s*\d+px/g;
      expect(buttonCSS).not.toMatch(hardcodedValues);

      // xeg-radius 토큰 사용 확인
      expect(buttonCSS).toMatch(/var\(--xeg-radius-\w+\)/);
    });

    it('Toast 컴포넌트가 적절한 토큰만 사용해야 함', () => {
      const toastCSS = readCSSFile(CSS_FILES.toast);

      // 하드코딩된 border-radius 값이 없어야 함
      const hardcodedValues = /border-radius:\s*\d+px/g;
      expect(toastCSS).not.toMatch(hardcodedValues);

      // 적절한 토큰 사용 확인
      expect(toastCSS).toMatch(/var\(--xeg-radius-2xl\)/); // Toast 컨테이너
      expect(toastCSS).toMatch(/var\(--xeg-radius-lg\)/); // Action button
      expect(toastCSS).toMatch(/var\(--xeg-radius-sm\)/); // 작은 요소들
    });

    it('Gallery 컴포넌트들이 적절한 토큰만 사용해야 함', () => {
      const galleryCSS = readCSSFile(CSS_FILES.gallery);
      const galleryGlobalCSS = readCSSFile(CSS_FILES.galleryGlobal);

      // 하드코딩된 border-radius 값이 없어야 함
      const hardcodedValues = /border-radius:\s*\d+px/g;
      expect(galleryCSS).not.toMatch(hardcodedValues);
      expect(galleryGlobalCSS).not.toMatch(hardcodedValues);

      // Gallery 컴포넌트 토큰 사용 확인
      expect(galleryCSS).toMatch(/var\(--xeg-radius-lg\)/); // 기본 요소
      expect(galleryCSS).toMatch(/var\(--xeg-radius-pill\)/); // 컨트롤 버튼
      expect(galleryCSS).toMatch(/var\(--xeg-radius-full\)/); // 원형 요소
      expect(galleryCSS).toMatch(/var\(--xeg-radius-2xl\)/); // 큰 컨테이너
    });

    it('Isolated Gallery가 semantic 토큰을 참조해야 함', () => {
      const isolatedCSS = readCSSFile(CSS_FILES.isolatedGallery);

      // 직접 primitive 토큰 참조 대신 semantic 토큰 참조 확인
      expect(isolatedCSS).toMatch(/var\(--xeg-radius-\w+\)/);
      expect(isolatedCSS).not.toMatch(/var\(--radius-\w+\)(?!.*xeg)/);
    });
  });

  describe('Phase 3: 역할별 토큰 사용 일관성', () => {
    it('버튼 역할 요소들이 일관된 토큰을 사용해야 함', () => {
      const buttonCSS = readCSSFile(CSS_FILES.unifiedToolbarButton);
      const toastCSS = readCSSFile(CSS_FILES.toast);
      const galleryCSS = readCSSFile(CSS_FILES.gallery);

      // 버튼 요소들은 주로 lg 토큰 사용
      const buttonTokenPattern = /var\(--xeg-radius-lg\)/;
      expect(buttonCSS).toMatch(buttonTokenPattern);
      expect(toastCSS).toMatch(buttonTokenPattern); // Action button
      expect(galleryCSS).toMatch(buttonTokenPattern); // Control buttons
    });

    it('컨테이너 역할 요소들이 적절한 크기별 토큰을 사용해야 함', () => {
      const toastCSS = readCSSFile(CSS_FILES.toast);
      const galleryCSS = readCSSFile(CSS_FILES.gallery);

      // 큰 컨테이너는 2xl 토큰
      expect(toastCSS).toMatch(/var\(--xeg-radius-2xl\)/);
      expect(galleryCSS).toMatch(/var\(--xeg-radius-2xl\)/);

      // 일반 컨테이너는 lg 토큰
      expect(galleryCSS).toMatch(/var\(--xeg-radius-lg\)/);
    });

    it('특수 형태 요소들이 적절한 토큰을 사용해야 함', () => {
      const galleryCSS = readCSSFile(CSS_FILES.gallery);

      // 원형 요소: full 토큰
      expect(galleryCSS).toMatch(/var\(--xeg-radius-full\)/);

      // 알약 형태: pill 토큰
      expect(galleryCSS).toMatch(/var\(--xeg-radius-pill\)/);
    });
  });

  describe('Phase 4: 시스템 완전성 검증', () => {
    it('하드코딩된 border-radius 값이 전혀 없어야 함', () => {
      const allCSS = Object.values(CSS_FILES)
        .filter(file => file.includes('module.css') || file.includes('global.css'))
        .map(file => readCSSFile(file))
        .join('\n');

      // 하드코딩된 px 값 패턴 검사 (토큰 정의 제외)
      const hardcodedPattern = /border-radius:\s*\d+px(?!\s*;?\s*\/\*.*토큰)/g;
      const matches = allCSS.match(hardcodedPattern) || [];

      expect(matches).toHaveLength(0);
    });

    it('토큰 네이밍 컨벤션이 일관되어야 함', () => {
      const semanticCSS = readCSSFile(CSS_FILES.designTokensSemantic);

      // xeg-radius 접두사 일관성 확인
      const tokenPattern = /--xeg-radius-\w+:/g;
      const tokens = semanticCSS.match(tokenPattern) || [];

      expect(tokens.length).toBeGreaterThan(0);

      // 모든 토큰이 xeg-radius로 시작하는지 확인
      tokens.forEach(token => {
        expect(token).toMatch(/^--xeg-radius-/);
      });
    });

    it('미사용 토큰이 없어야 함', () => {
      const semanticCSS = readCSSFile(CSS_FILES.designTokensSemantic);
      const allComponentCSS = Object.values(CSS_FILES)
        .filter(file => !file.includes('design-tokens'))
        .map(file => readCSSFile(file))
        .join('\n');

      // 정의된 토큰들 추출
      const definedTokens = (semanticCSS.match(/--xeg-radius-\w+/g) || []).map(token =>
        token.replace(':', '')
      );

      // 각 토큰이 최소 한 번은 사용되는지 확인
      definedTokens.forEach(token => {
        const isUsed = allComponentCSS.includes(`var(${token})`);
        expect(isUsed).toBe(true);
      });
    });
  });

  describe('Phase 5: 성능 및 최적화 검증', () => {
    it('CSS 토큰 사용으로 인한 중복 코드가 제거되어야 함', () => {
      const allCSS = Object.values(CSS_FILES)
        .filter(file => file.includes('module.css') || file.includes('global.css'))
        .map(file => readCSSFile(file))
        .join('\n');

      // border-radius 관련 줄 수 계산
      const borderRadiusLines = (allCSS.match(/border-radius:/g) || []).length;

      // 토큰 사용 줄 수 계산
      const tokenUsageLines = (allCSS.match(/var\(--xeg-radius-\w+\)/g) || []).length;

      // 대부분의 border-radius가 토큰을 사용해야 함
      const tokenUsageRatio = tokenUsageLines / borderRadiusLines;
      expect(tokenUsageRatio).toBeGreaterThan(0.8); // 80% 이상 토큰 사용
    });

    it('토큰 계층 구조가 효율적이어야 함', () => {
      const primitiveCSS = readCSSFile(CSS_FILES.designTokensPrimitive);
      const semanticCSS = readCSSFile(CSS_FILES.designTokensSemantic);

      // Primitive 토큰 개수
      const primitiveTokens = (primitiveCSS.match(/--radius-\w+:/g) || []).length;

      // Semantic 토큰 개수
      const semanticTokens = (semanticCSS.match(/--xeg-radius-\w+:/g) || []).length;

      // Semantic 토큰이 primitive 토큰과 1:1 매핑되어야 함
      expect(semanticTokens).toBe(primitiveTokens);
    });
  });
});

// Deprecated duplicate of cross-component-consistency.test.ts kept temporarily to avoid environment cache issues.
// File intentionally minimized.
describe.skip('Cross-Component Consistency Verification (legacy clean variant - deprecated)', () => {
  it('deprecated placeholder', () => {
    expect(true).toBe(true);
  });
});
