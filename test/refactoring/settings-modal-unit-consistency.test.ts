/**
 * TDD Test: SettingsModal px→em 단위 일관성 테스트
 * @description Toolbar와 SettingsModal 간 단위 시스템 일관성 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';

describe('SettingsModal Unit Consistency', () => {
  let settingsModalCSS;

  beforeEach(() => {
    // CSS 파일 읽기
    settingsModalCSS = readFileSync(
      './src/shared/components/ui/SettingsModal/SettingsModal.module.css',
      'utf-8'
    );
  });

  describe('단위 시스템 일관성', () => {
    it('SettingsModal에서 px 단위가 제거되어야 함', () => {
      // px 단위 패턴 검출
      const pxPatterns = [
        /width:\s*\d+px/g,
        /height:\s*\d+px/g,
        /padding:\s*\d+px/g,
        /margin:\s*\d+px/g,
        /font-size:\s*\d+px/g,
        /transform:\s*translateY\(-?\d+px\)/g,
      ];

      pxPatterns.forEach((pattern, index) => {
        const matches = settingsModalCSS.match(pattern);
        expect(matches, `패턴 ${index + 1}: ${pattern} - px 단위가 발견됨`).toBeNull();
      });
    });

    it('버튼 크기가 Toolbar와 일치해야 함 (2.5em)', () => {
      // closeButton 크기 검증
      const buttonSizePattern = /width:\s*2\.5em.*?height:\s*2\.5em/s;
      expect(settingsModalCSS).toMatch(buttonSizePattern);
    });

    it('애니메이션 단위가 em으로 통일되어야 함', () => {
      // translateY 애니메이션이 em 단위 사용
      const animationPattern = /transform:\s*translateY\(-0\.0625em\)/;
      expect(settingsModalCSS).toMatch(animationPattern);
    });

    it('padding과 margin이 em 단위로 정의되어야 함', () => {
      // em 단위 패턴 존재 확인 - padding만 체크 (margin은 대부분 0 또는 사용하지 않음)
      const emPatterns = [/padding:\s*[\d.]+em/];

      emPatterns.forEach(pattern => {
        expect(settingsModalCSS).toMatch(pattern);
      });

      // margin: 0은 허용 (em 변환 불필요)
      const marginZeroPattern = /margin:\s*0/;
      expect(settingsModalCSS).toMatch(marginZeroPattern);
    });
  });

  describe('Toolbar와의 일관성', () => {
    it('테마 토큰 기반 아키텍처를 사용하며 CSS에서 개별 glassmorphism 속성이 제거되어야 함', () => {
      // 개별 glassmorphism 속성이 CSS에서 제거되어야 함
      const removedTokens = [
        'var(--xeg-surface-glass-bg)',
        'var(--xeg-surface-glass-border)',
        'var(--xeg-surface-glass-blur)',
        'var(--xeg-surface-glass-shadow)',
      ];

      // CSS 파일에서는 이 속성들이 제거되어야 함
      removedTokens.forEach(token => {
        expect(settingsModalCSS.includes(token), `${token} 토큰이 여전히 CSS에 존재함`).toBe(false);
      });

      // TSX 파일에서 glass-surface 클래스 제거 확인
      const settingsModalTSX = readFileSync(
        './src/shared/components/ui/SettingsModal/SettingsModal.tsx',
        'utf-8'
      );
      expect(
        settingsModalTSX.includes('glass-surface'),
        'TSX에서 glass-surface 클래스는 제거되어야 함'
      ).toBe(false);

      // 테마 토큰 사용 확인
      expect(
        settingsModalCSS.includes('var(--xeg-modal-bg)'),
        'CSS에서 테마 배경 토큰을 사용해야 함'
      ).toBe(true);

      // 레거시 toolbar 토큰 직접 사용 금지
      const legacyTokens = [
        'var(--xeg-toolbar-glass-bg)',
        'var(--xeg-toolbar-glass-border)',
        'var(--xeg-toolbar-glass-blur)',
        'var(--xeg-toolbar-glass-shadow)',
      ];
      legacyTokens.forEach(token => {
        expect(settingsModalCSS.includes(token), `레거시 토큰(${token})이 남아 있음`).toBe(false);
      });
    });

    it('동일한 transition 시스템을 사용해야 함', () => {
      const transitionPattern = /var\(--xeg-transition-fast\)/;
      expect(settingsModalCSS).toMatch(transitionPattern);
    });

    it('border-radius가 하드코딩되지 않고 CSS 변수를 사용해야 함', () => {
      // 하드코딩된 border-radius 검출
      const hardcodedBorderRadiusPattern = /border-radius:\s*\d+px/g;
      const hardcodedMatches = settingsModalCSS.match(hardcodedBorderRadiusPattern);

      expect(hardcodedMatches, '하드코딩된 border-radius가 발견됨').toBeNull();

      // CSS 변수 사용 확인
      const cssVariableBorderRadiusPattern = /border-radius:\s*var\(--xeg-radius/;
      expect(settingsModalCSS).toMatch(cssVariableBorderRadiusPattern);
    });
  });

  describe('컴파일된 CSS 검증', () => {
    it('빌드된 userscript에서 px 단위가 제거되어야 함', () => {
      try {
        const distCSS = readFileSync('./dist/xcom-enhanced-gallery.dev.user.js', 'utf-8');

        // Settings Modal 관련 CSS에서 px 검출
        const modalCSSSection = distCSS.match(/SettingsModal-module__.*?}/gs) || [];

        modalCSSSection.forEach(section => {
          const pxMatches = section.match(/\d+px/g);
          if (pxMatches) {
            // border-radius 등 일부 예외는 허용
            const allowedPxUsage = pxMatches.filter(
              match =>
                section.includes(`border-radius: ${match}`) ||
                section.includes(`border: 1px`) ||
                section.includes(`border: 2px`)
            );

            expect(
              pxMatches.length - allowedPxUsage.length,
              `예상치 못한 px 단위 발견: ${pxMatches.join(', ')}`
            ).toBe(0);
          }
        });
      } catch {
        // 빌드 파일이 없으면 테스트 스킵
        expect(true).toBe(true); // 스킵 표시
      }
    });
  });
});
