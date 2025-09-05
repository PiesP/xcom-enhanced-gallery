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
    });

    test('isolated-gallery.css에서 radius alias 변수가 제거되었는지 확인', () => {
      const content = readFileSync(ISOLATED_GALLERY_CSS, 'utf-8');
      const aliasPattern = /--xeg-isolated-radius-(sm|md|lg|xl|full)/g;
      expect(content.match(aliasPattern)).toBeNull();
      // 직접 semantic 토큰 사용 여부 (toolbar, button 등)
      expect(content).toMatch(/border-radius:\s*var\(--xeg-radius-xl\)/);
      expect(content).toMatch(/border-radius:\s*var\(--xeg-radius-lg\)/);
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
    });

    test('isolated-gallery.css의 border-radius가 직접 semantic 토큰을 사용해야 함', () => {
      const content = readFileSync(ISOLATED_GALLERY_CSS, 'utf-8');
      // alias 제거 후 직접 참조된 패턴만 존재
      expect(content).toMatch(/border-radius:\s*var\(--xeg-radius-(lg|xl)\)/);
      // 제거된 alias 정의가 다시 등장하지 않아야 함
      [
        '--xeg-isolated-radius-sm',
        '--xeg-isolated-radius-md',
        '--xeg-isolated-radius-lg',
        '--xeg-isolated-radius-xl',
        '--xeg-isolated-radius-full',
      ].forEach(v => {
        expect(content).not.toContain(v);
      });
    });
  });

  describe('REFACTOR Phase: 일관성 및 최적화 검증', () => {
    test('모든 Gallery 컴포넌트가 일관된 토큰 시스템을 사용해야 함', () => {
      const galleryModuleContent = readFileSync(GALLERY_MODULE_CSS, 'utf-8');
      const galleryGlobalContent = readFileSync(GALLERY_GLOBAL_CSS, 'utf-8');
      // const isolatedGalleryContent = readFileSync(ISOLATED_GALLERY_CSS, 'utf-8'); // alias 제거로 현재 테스트에서 직접 사용 안 함

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
    });
  });

  describe('Integration: 다른 컴포넌트와의 호환성', () => {
    test('ToolbarButton과 Toast 컴포넌트와 일관된 토큰 사용', () => {
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
    });
  });
});
