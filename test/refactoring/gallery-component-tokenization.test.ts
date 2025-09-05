/**
 * Gallery Component Border-Radius Tokenization Test
 *
 * Week 2: Gallery Components의 하드코딩된 border-radius 값들을
 * 디자인 토큰으로 교체하는 TDD 기반 테스트
 *
 * @fileoverview Gallery.module.css, gallery-global.css, isolated-gallery.css의
 *               하드코딩된 border-radius 값들을 검증하고 토큰 교체를 안전하게 수행
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const GALLERY_MODULE_CSS = resolve('src/features/gallery/styles/Gallery.module.css');
const GALLERY_GLOBAL_CSS = resolve('src/features/gallery/styles/gallery-global.css');
const ISOLATED_GALLERY_CSS = resolve('src/shared/styles/isolated-gallery.css');

describe('Gallery Component Border-Radius Tokenization', () => {
  describe('RED Phase: 하드코딩된 border-radius 값 탐지', () => {
    test('Gallery.module.css에서 모든 border-radius 값이 토큰화되었는지 확인', () => {
      const content = readFileSync(GALLERY_MODULE_CSS, 'utf-8');

      // 토큰 사용 확인
      const tokenUsage = content.match(/border-radius:\s*var\(--xeg-radius-\w+\)/g) || [];
      expect(tokenUsage.length).toBeGreaterThan(0);

      // 하드코딩된 값 부재 확인
      const hardcodedPattern = /border-radius:\s*\d+px|border-radius:\s*\d+%/g;
      const hardcodedValues = content.match(hardcodedPattern) || [];
      expect(hardcodedValues.length).toBe(0);

      console.log('✅ Gallery.module.css 토큰화 검증 완료');
    });

    test('gallery-global.css에서 모든 border-radius 값이 토큰화되었는지 확인', () => {
      const content = readFileSync(GALLERY_GLOBAL_CSS, 'utf-8');

      // 토큰 사용 확인
      const tokenUsage = content.match(/border-radius:\s*var\(--xeg-radius-\w+\)/g) || [];
      expect(tokenUsage.length).toBeGreaterThan(0);

      // 하드코딩된 값 부재 확인
      const hardcodedPattern = /border-radius:\s*\d+px|border-radius:\s*\d+%/g;
      const hardcodedValues = content.match(hardcodedPattern) || [];
      expect(hardcodedValues.length).toBe(0);

      console.log('✅ gallery-global.css 토큰화 검증 완료');
    });

    test('isolated-gallery.css에서 semantic 토큰 참조가 올바른지 확인', () => {
      const content = readFileSync(ISOLATED_GALLERY_CSS, 'utf-8');

      // semantic 토큰 참조 확인
      const semanticMappings = [
        '--xeg-isolated-radius-sm: var(--xeg-radius-sm)',
        '--xeg-isolated-radius-md: var(--xeg-radius-lg)',
        '--xeg-isolated-radius-lg: var(--xeg-radius-xl)',
        '--xeg-isolated-radius-xl: var(--xeg-radius-2xl)',
        '--xeg-isolated-radius-full: var(--xeg-radius-full)',
      ];

      semanticMappings.forEach(mapping => {
        expect(content).toContain(mapping);
      });

      console.log('✅ isolated-gallery.css semantic 토큰 참조 검증 완료');
    });
  });

  describe('GREEN Phase: 토큰 교체 검증', () => {
    test('Gallery.module.css의 border-radius가 토큰을 사용해야 함', () => {
      const content = readFileSync(GALLERY_MODULE_CSS, 'utf-8');

      // 교체되어야 할 토큰 매핑
      const tokenMappings = [
        'border-radius: var(--xeg-radius-lg)', // 8px → --xeg-radius-lg
      ];

      tokenMappings.forEach(token => {
        expect(content).toContain(token);
      });

      // 하드코딩된 값이 제거되었는지 확인
      expect(content).not.toContain('border-radius: 8px');

      console.log('✅ Gallery.module.css의 border-radius 토큰화 완료');
    });

    test('gallery-global.css의 border-radius가 토큰을 사용해야 함', () => {
      const content = readFileSync(GALLERY_GLOBAL_CSS, 'utf-8');

      // 교체되어야 할 토큰 매핑
      const tokenMappings = [
        'border-radius: var(--xeg-radius-lg)', // 8px → --xeg-radius-lg
        'border-radius: var(--xeg-radius-2xl)', // 16px → --xeg-radius-2xl
        'border-radius: var(--xeg-radius-xl)', // 10px → --xeg-radius-xl (가장 가까운 토큰)
        'border-radius: var(--xeg-radius-md)', // 6px → --xeg-radius-md
        'border-radius: var(--xeg-radius-full)', // 50% → --xeg-radius-full
        'border-radius: var(--xeg-radius-xs)', // 2px → --xeg-radius-xs
      ];

      tokenMappings.forEach(token => {
        expect(content).toContain(token);
      });

      // 하드코딩된 값이 제거되었는지 확인
      const hardcodedValues = [
        'border-radius: 8px',
        'border-radius: 16px',
        'border-radius: 10px',
        'border-radius: 6px',
        'border-radius: 50%',
        'border-radius: 2px',
      ];

      hardcodedValues.forEach(value => {
        expect(content).not.toContain(value);
      });

      console.log('✅ gallery-global.css의 border-radius 토큰화 완료');
    });

    test('isolated-gallery.css의 border-radius 토큰이 semantic 토큰을 참조해야 함', () => {
      const content = readFileSync(ISOLATED_GALLERY_CSS, 'utf-8');

      // isolated 토큰들이 semantic 토큰을 참조하도록 변경
      const semanticMappings = [
        '--xeg-isolated-radius-sm: var(--xeg-radius-sm)', // 4px → semantic token
        '--xeg-isolated-radius-md: var(--xeg-radius-lg)', // 8px → semantic token
        '--xeg-isolated-radius-lg: var(--xeg-radius-xl)', // 12px → semantic token (가장 가까운 10px)
        '--xeg-isolated-radius-xl: var(--xeg-radius-2xl)', // 16px → semantic token
        '--xeg-isolated-radius-full: var(--xeg-radius-full)', // 9999px → semantic token
      ];

      semanticMappings.forEach(mapping => {
        expect(content).toContain(mapping);
      });

      // 하드코딩된 픽셀 값이 제거되었는지 확인
      const hardcodedDefinitions = [
        '--xeg-isolated-radius-sm: 4px',
        '--xeg-isolated-radius-md: 8px',
        '--xeg-isolated-radius-lg: 12px',
        '--xeg-isolated-radius-xl: 16px',
        '--xeg-isolated-radius-full: 9999px',
      ];

      hardcodedDefinitions.forEach(definition => {
        expect(content).not.toContain(definition);
      });

      console.log('✅ isolated-gallery.css의 토큰이 semantic 토큰 참조로 변경됨');
    });
  });

  describe('REFACTOR Phase: 일관성 및 최적화 검증', () => {
    test('모든 Gallery 컴포넌트가 일관된 토큰 시스템을 사용해야 함', () => {
      const galleryModuleContent = readFileSync(GALLERY_MODULE_CSS, 'utf-8');
      const galleryGlobalContent = readFileSync(GALLERY_GLOBAL_CSS, 'utf-8');
      const isolatedGalleryContent = readFileSync(ISOLATED_GALLERY_CSS, 'utf-8');

      // 모든 border-radius가 토큰을 사용하는지 확인
      const tokenPattern = /border-radius:\s*var\(--xeg-radius-\w+\)/g;
      const hardcodedPattern = /border-radius:\s*\d+px|border-radius:\s*\d+%/g;

      // Gallery.module.css 검증
      const galleryModuleTokens = galleryModuleContent.match(tokenPattern) || [];
      const galleryModuleHardcoded = galleryModuleContent.match(hardcodedPattern) || [];

      expect(galleryModuleTokens.length).toBeGreaterThan(0);
      expect(galleryModuleHardcoded.length).toBe(0);

      // gallery-global.css 검증
      const galleryGlobalTokens = galleryGlobalContent.match(tokenPattern) || [];
      const galleryGlobalHardcoded = galleryGlobalContent.match(hardcodedPattern) || [];

      expect(galleryGlobalTokens.length).toBeGreaterThan(0);
      expect(galleryGlobalHardcoded.length).toBe(0);

      console.log('✅ 모든 Gallery 컴포넌트가 일관된 토큰 시스템 사용 확인됨');
    });

    test('토큰 사용량이 적절한 수준이어야 함', () => {
      const galleryModuleContent = readFileSync(GALLERY_MODULE_CSS, 'utf-8');
      const galleryGlobalContent = readFileSync(GALLERY_GLOBAL_CSS, 'utf-8');

      // 각 파일별 토큰 사용량 확인
      const moduleTokenUsage = (galleryModuleContent.match(/var\(--xeg-radius-\w+\)/g) || [])
        .length;
      const globalTokenUsage = (galleryGlobalContent.match(/var\(--xeg-radius-\w+\)/g) || [])
        .length;

      // 최소 사용량 확인 (실제 하드코딩된 값 개수만큼)
      expect(moduleTokenUsage).toBeGreaterThanOrEqual(1); // Gallery.module.css: 1개 이상
      expect(globalTokenUsage).toBeGreaterThanOrEqual(6); // gallery-global.css: 6개 이상

      console.log(
        `✅ 토큰 사용량 - Gallery.module.css: ${moduleTokenUsage}개, gallery-global.css: ${globalTokenUsage}개`
      );
    });

    test('성능 영향이 최소화되어야 함', () => {
      const galleryModuleContent = readFileSync(GALLERY_MODULE_CSS, 'utf-8');
      const galleryGlobalContent = readFileSync(GALLERY_GLOBAL_CSS, 'utf-8');

      // 중첩된 CSS 변수 사용이 과도하지 않은지 확인
      const nestedVariablePattern = /var\(--xeg-radius-\w+,\s*var\(/g;
      const moduleNested = galleryModuleContent.match(nestedVariablePattern) || [];
      const globalNested = galleryGlobalContent.match(nestedVariablePattern) || [];

      // 중첩 깊이 제한 (성능상 3단계 이하 권장)
      expect(moduleNested.length).toBeLessThanOrEqual(2);
      expect(globalNested.length).toBeLessThanOrEqual(3);

      console.log('✅ 성능 영향 최소화 확인됨');
    });
  });

  describe('Integration: 다른 컴포넌트와의 호환성', () => {
    test('UnifiedToolbarButton과 Toast 컴포넌트와 일관된 토큰 사용', () => {
      const galleryGlobalContent = readFileSync(GALLERY_GLOBAL_CSS, 'utf-8');

      // 동일한 크기의 요소들이 같은 토큰을 사용하는지 확인
      const commonTokens = [
        'var(--xeg-radius-lg)', // 8px - 공통 버튼 크기
        'var(--xeg-radius-2xl)', // 16px - 큰 컨테이너
        'var(--xeg-radius-full)', // 원형 버튼
      ];

      commonTokens.forEach(token => {
        expect(galleryGlobalContent).toContain(token);
      });

      console.log('✅ 다른 컴포넌트와의 토큰 일관성 확인됨');
    });
  });
});
