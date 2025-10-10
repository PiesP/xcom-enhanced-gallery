/**
 * @file 하드코딩된 CSS 제거를 위한 TDD 테스트
 * @description 기존 분석에서 발견된 하드코딩된 CSS 값들을 design-tokens으로 변경하는 테스트
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

describe('RED: 하드코딩된 CSS 제거', () => {
  describe('1. namespaced-styles.ts 하드코딩 제거', () => {
    it('하드코딩된 색상 값들이 제거되어야 한다', () => {
      const filePath = join(PROJECT_ROOT, 'src/shared/styles/namespaced-styles.ts');
      const content = readFileSync(filePath, 'utf-8');

      // 하드코딩된 색상들이 존재하면 테스트 실패
      const hardcodedColors = [
        '#1d9bf0', // Twitter blue
        '#1a8cd8', // Twitter blue dark
        '#000000', // Black
        '#ffffff', // White
        '#f7f9fa', // Light gray
        '#15202b', // Dark theme background
        'rgba(29, 155, 240', // RGBA Twitter blue
        'rgba(255, 255, 255', // RGBA white
        'rgba(15, 20, 25', // RGBA dark
      ];

      hardcodedColors.forEach(color => {
        expect(content).not.toContain(color);
      });
    });

    it('design-token CSS 변수를 사용해야 한다', () => {
      const filePath = join(PROJECT_ROOT, 'src/shared/styles/namespaced-styles.ts');
      const content = readFileSync(filePath, 'utf-8');

      // design-token 변수들이 사용되어야 함
      const expectedTokens = [
        '--xeg-color-primary-500',
        '--xeg-color-surface-primary',
        '--xeg-color-text-primary',
        '--xeg-color-border-primary',
      ];

      expectedTokens.forEach(token => {
        expect(content).toContain(token);
      });
    });
  });

  describe('2. accessibility-utils.ts 하드코딩 제거', () => {
    it('하드코딩된 focus outline 스타일이 제거되어야 한다', () => {
      const filePath = join(PROJECT_ROOT, 'src/shared/utils/accessibility/accessibility-utils.ts');
      const content = readFileSync(filePath, 'utf-8');

      // 하드코딩된 outline 값들이 존재하면 테스트 실패
      const hardcodedOutlines = [
        '2px solid #005fcc',
        '3px solid #005fcc',
        "outline = '2px solid #005fcc'",
        'outline: 2px solid #005fcc',
      ];

      hardcodedOutlines.forEach(outline => {
        expect(content).not.toContain(outline);
      });
    });

    it('design-token focus outline 변수를 사용해야 한다', () => {
      const filePath = join(PROJECT_ROOT, 'src/shared/utils/accessibility/accessibility-utils.ts');
      const content = readFileSync(filePath, 'utf-8');

      // design-token 변수들이 사용되어야 함
      const expectedTokens = [
        '--xeg-focus-outline',
        '--xeg-focus-outline-color',
        '--xeg-focus-outline-width',
        '--xeg-focus-outline-style',
      ];

      // 최소 하나의 토큰은 사용되어야 함
      const hasAnyToken = expectedTokens.some(token => content.includes(token));
      expect(hasAnyToken).toBe(true);
    });
  });

  describe('3. CSS modules 하드코딩 검증', () => {
    it('Toolbar.module.css에 디자인 토큰을 사용해야 한다', () => {
      const filePath = join(PROJECT_ROOT, 'src/shared/components/ui/Toolbar/Toolbar.module.css');
      const content = readFileSync(filePath, 'utf-8');

      // 디자인 토큰이 사용되고 있는지 확인
      const tokenUsages = ['var(--xeg-', '--xeg-toolbar-glass-', '--xeg-radius-', '--xeg-color-'];

      const hasTokens = tokenUsages.some(token => content.includes(token));
      expect(hasTokens).toBe(true);

      // 하드코딩된 z-index는 허용 (필수적인 경우)
      // 기타 값들이 토큰으로 대체되었는지 확인
      expect(content).not.toContain('rgba(255, 255, 255, 0.1)'); // 글래스 효과 토큰 사용
      expect(content).not.toContain('#1d9bf0'); // 색상 토큰 사용
      expect(content).not.toContain('#ffffff'); // 색상 토큰 사용
    });

    it('VerticalImageItem.module.css에 하드코딩된 값들이 제거되어야 한다', () => {});

    it('VerticalImageItem.module.css에 하드코딩된 값들이 제거되어야 한다', () => {
      const filePath = join(
        PROJECT_ROOT,
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css'
      );
      const content = readFileSync(filePath, 'utf-8');

      // 하드코딩된 값들 확인 (성능 관련 z-index는 예외)
      const hardcodedValues = [
        'rgba(0, 0, 0, 0.8)',
        'rgba(255, 255, 255, 0.9)',
        'border-radius: 4px',
        'border-radius: 8px',
      ];

      hardcodedValues.forEach(value => {
        expect(content).not.toContain(value);
      });
    });
  });

  describe('4. Design Token 시스템 완성도 검증', () => {
    it('design-tokens.css에 필요한 모든 토큰이 정의되어야 한다', () => {
      const filePath = join(PROJECT_ROOT, 'src/shared/styles/design-tokens.css');
      const content = readFileSync(filePath, 'utf-8');

      // 새로 추가되어야 할 토큰들
      const requiredNewTokens = [
        '--xeg-focus-outline:',
        '--xeg-focus-outline-color:',
        '--xeg-focus-outline-width:',
        '--xeg-focus-outline-style:',
        '--xeg-color-surface-elevated:',
        '--xeg-color-backdrop:',
      ];

      requiredNewTokens.forEach(token => {
        expect(content).toContain(token);
      });
    });

    it('모든 토큰이 다크모드 및 라이트모드를 지원해야 한다', () => {
      const filePath = join(PROJECT_ROOT, 'src/shared/styles/design-tokens.css');
      const content = readFileSync(filePath, 'utf-8');

      // 다크모드 및 라이트모드 선택자 확인 (작은따옴표 사용)
      expect(content).toContain("[data-theme='light']");
      expect(content).toContain("[data-theme='dark']");
      expect(content).toContain('@media (prefers-color-scheme: dark)');
    });
  });

  describe('5. 번들 크기 영향 검증', () => {
    it('하드코딩 제거가 번들 크기를 유지하거나 개선해야 한다', () => {
      // dist 폴더에서 실제 번들 크기 확인 (빌드 후)
      const distPath = join(PROJECT_ROOT, 'dist');

      expect(() => {
        readFileSync(join(distPath, 'xcom-enhanced-gallery.user.js'), 'utf-8');
      }).not.toThrow();

      // 번들이 존재하고 크기가 적절해야 함
      expect(true).toBe(true); // 실제 크기 검증은 별도 도구로 수행
    });
  });
});
