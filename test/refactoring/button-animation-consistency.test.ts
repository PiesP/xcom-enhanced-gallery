/**
 * TDD Red Test: Button Component Animation System Consistency
 * @description Button 컴포넌트의 애니메이션과 전환 효과를 공통 디자인 토큰과 통합하는 테스트
 */
import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';

// 공통 경로 상수
const DESIGN_TOKENS_PATH = 'src/shared/styles/design-tokens.css';
const BUTTON_CSS_PATH = 'src/shared/components/ui/Button/Button.module.css';
const TOOLBAR_CSS_PATH = 'src/shared/components/ui/Toolbar/Toolbar.module.css';

describe('Button Animation System Consistency', () => {
  setupGlobalTestIsolation();

  function read(path) {
    return readFileSync(path, 'utf-8');
  }

  describe('Animation Duplication Removal', () => {
    it('Button.module.css에서 중복 spin 키프레임이 제거되어야 함', () => {
      const buttonCSS = read(BUTTON_CSS_PATH);

      // spin 키프레임이 더 이상 존재하지 않아야 함
      expect(
        buttonCSS.includes('@keyframes spin'),
        'Button에서 중복 spin 키프레임이 아직 존재함'
      ).toBe(false);
    });

    it('Toolbar.module.css에서 중복 spin 키프레임이 제거되어야 함', () => {
      const toolbarCSS = read(TOOLBAR_CSS_PATH);

      // spin 키프레임이 더 이상 존재하지 않아야 함
      expect(
        toolbarCSS.includes('@keyframes spin'),
        'Toolbar에서 중복 spin 키프레임이 아직 존재함'
      ).toBe(false);
    });

    it('하드코딩된 transition 지속시간이 제거되어야 함', () => {
      const buttonCSS = read(BUTTON_CSS_PATH);
      const toolbarCSS = read(TOOLBAR_CSS_PATH);

      // 하드코딩된 transition 시간 체크
      const buttonHasHardcoded = /transition:[^;]*\d+(\.\d+)?s/.test(buttonCSS);
      const toolbarHasHardcoded = /transition:[^;]*\d+(\.\d+)?s/.test(toolbarCSS);

      expect(buttonHasHardcoded, 'Button에서 하드코딩된 transition 지속시간이 아직 존재함').toBe(
        false
      );

      expect(toolbarHasHardcoded, 'Toolbar에서 하드코딩된 transition 지속시간이 아직 존재함').toBe(
        false
      );
    });

    it('CSS 변수 기반 transition 매개변수를 사용해야 함', () => {
      const buttonCSS = read(BUTTON_CSS_PATH);
      const toolbarCSS = read(TOOLBAR_CSS_PATH);

      // CSS 변수 사용 확인
      const buttonUsesVariables =
        buttonCSS.includes('var(--xeg-transition-') || buttonCSS.includes('var(--xeg-duration-');
      const toolbarUsesVariables =
        toolbarCSS.includes('var(--xeg-transition-') || toolbarCSS.includes('var(--xeg-duration-');

      expect(
        buttonUsesVariables,
        'Button이 CSS 변수 기반 transition 매개변수를 사용하지 않음'
      ).toBe(true);

      expect(
        toolbarUsesVariables,
        'Toolbar가 CSS 변수 기반 transition 매개변수를 사용하지 않음'
      ).toBe(true);
    });
  });

  describe('Shared Animation System Integration', () => {
    it('공통 spin 애니메이션이 design-tokens.css에 정의되어야 함', () => {
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // 공통 spin 애니메이션 키프레임 확인
      const hasSpinAnimation = tokensCSS.includes('@keyframes xeg-spin');

      expect(hasSpinAnimation, '공통 spin 애니메이션이 design-tokens.css에 정의되지 않음').toBe(
        true
      );
    });

    it('Button과 Toolbar가 공통 spin 애니메이션을 사용해야 함', () => {
      const buttonCSS = read(BUTTON_CSS_PATH);
      const toolbarCSS = read(TOOLBAR_CSS_PATH);

      // 공통 애니메이션 사용 확인
      const buttonUsesCommon = buttonCSS.includes('xeg-spin');
      const toolbarUsesCommon = toolbarCSS.includes('xeg-spin');

      expect(buttonUsesCommon, 'Button이 공통 spin 애니메이션을 사용하지 않음').toBe(true);

      expect(toolbarUsesCommon, 'Toolbar가 공통 spin 애니메이션을 사용하지 않음').toBe(true);
    });

    it('공통 transition 변수가 design-tokens.css에 정의되어야 함', () => {
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // 필수 transition 변수들 확인
      const hasTransitionVariables =
        tokensCSS.includes('--xeg-transition-fast') &&
        tokensCSS.includes('--xeg-transition-normal') &&
        tokensCSS.includes('--xeg-transition-slow');

      expect(
        hasTransitionVariables,
        '필수 transition 변수들이 design-tokens.css에 정의되지 않음'
      ).toBe(true);
    });
  });

  describe('Focus Ring System Consistency', () => {
    it('Button focus ring이 공통 시스템을 사용해야 함', () => {
      const buttonCSS = read(BUTTON_CSS_PATH);
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // focus ring 변수 사용 확인
      const buttonUsesFocusVariables =
        buttonCSS.includes('var(--xeg-focus-ring)') ||
        buttonCSS.includes('var(--xeg-focus-ring-offset)');

      const hasFocusVariables =
        tokensCSS.includes('--xeg-focus-ring') && tokensCSS.includes('--xeg-focus-ring-offset');

      expect(buttonUsesFocusVariables, 'Button이 공통 focus ring 변수를 사용하지 않음').toBe(true);

      expect(hasFocusVariables, 'focus ring 변수들이 design-tokens.css에 정의되지 않음').toBe(true);
    });

    it('Toolbar 버튼들도 동일한 focus ring 시스템을 사용해야 함', () => {
      const toolbarCSS = read(TOOLBAR_CSS_PATH);

      // focus ring 일관성 확인
      const toolbarUsesFocusVariables =
        toolbarCSS.includes('var(--xeg-focus-ring)') ||
        toolbarCSS.includes('var(--xeg-focus-ring-offset)') ||
        toolbarCSS.includes(':focus-visible');

      expect(
        toolbarUsesFocusVariables,
        'Toolbar 버튼들이 공통 focus ring 시스템을 사용하지 않음'
      ).toBe(true);
    });
  });

  describe('Animation Performance and Accessibility', () => {
    it('모든 애니메이션이 GPU 가속을 사용해야 함', () => {
      const buttonCSS = read(BUTTON_CSS_PATH);
      const toolbarCSS = read(TOOLBAR_CSS_PATH);
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // GPU 가속 속성 확인 (transform, opacity 기반)
      const hasGPUProperties =
        (buttonCSS.includes('transform:') || buttonCSS.includes('opacity:')) &&
        (toolbarCSS.includes('transform:') || toolbarCSS.includes('opacity:')) &&
        (tokensCSS.includes('transform:') || tokensCSS.includes('opacity:'));

      expect(hasGPUProperties, '모든 컴포넌트가 GPU 가속 속성을 사용하지 않음').toBe(true);
    });

    it('prefers-reduced-motion 지원이 모든 컴포넌트에 적용되어야 함', () => {
      const buttonCSS = read(BUTTON_CSS_PATH);
      const toolbarCSS = read(TOOLBAR_CSS_PATH);

      // reduced-motion 지원 확인
      const buttonSupportsReducedMotion = buttonCSS.includes('prefers-reduced-motion');
      const toolbarSupportsReducedMotion = toolbarCSS.includes('prefers-reduced-motion');

      expect(buttonSupportsReducedMotion, 'Button이 prefers-reduced-motion을 지원하지 않음').toBe(
        true
      );

      expect(toolbarSupportsReducedMotion, 'Toolbar가 prefers-reduced-motion을 지원하지 않음').toBe(
        true
      );
    });
  });

  describe('Cross-Component Animation Consistency', () => {
    it('Button, Toolbar, Toast가 일관된 애니메이션 패턴을 사용해야 함', () => {
      const buttonCSS = read(BUTTON_CSS_PATH);
      const toolbarCSS = read(TOOLBAR_CSS_PATH);
      const tokensCSS = read(DESIGN_TOKENS_PATH);

      // 공통 애니메이션 패턴 사용 확인
      const commonPattern = /var\(--xeg-(duration|transition|easing)-[a-z]+\)/;

      const buttonUsesPattern = commonPattern.test(buttonCSS);
      const toolbarUsesPattern = commonPattern.test(toolbarCSS);
      const hasCommonTokens = commonPattern.test(tokensCSS);

      expect(
        buttonUsesPattern && toolbarUsesPattern && hasCommonTokens,
        '모든 컴포넌트가 일관된 애니메이션 패턴을 사용하지 않음'
      ).toBe(true);
    });

    it('Button 변형들(primary, secondary, ghost)이 동일한 전환 시스템을 사용해야 함', () => {
      const buttonCSS = read(BUTTON_CSS_PATH);

      // 모든 버튼 변형에서 일관된 transition 사용 확인
      const primarySection = buttonCSS.substring(
        buttonCSS.indexOf('.primary'),
        buttonCSS.indexOf('.secondary')
      );
      const secondarySection = buttonCSS.substring(
        buttonCSS.indexOf('.secondary'),
        buttonCSS.indexOf('.ghost')
      );
      const ghostSection = buttonCSS.substring(
        buttonCSS.indexOf('.ghost'),
        buttonCSS.indexOf('/* Button Sizes */')
      );

      // 하드코딩된 transition이 없어야 함
      const noHardcodedTransitions =
        !/transition:[^;]*\d+(\.\d+)?s/.test(primarySection) &&
        !/transition:[^;]*\d+(\.\d+)?s/.test(secondarySection) &&
        !/transition:[^;]*\d+(\.\d+)?s/.test(ghostSection);

      expect(noHardcodedTransitions, 'Button 변형들에 하드코딩된 transition이 여전히 존재함').toBe(
        true
      );
    });
  });
});
