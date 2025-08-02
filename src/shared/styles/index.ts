/**
 * @fileoverview 통합된 스타일 시스템 엔트리포인트 (v3.0.0)
 * @description StyleManager를 중심으로 한 스타일 관리 시스템
 * @version 3.0.0
 */

// 통합 스타일 매니저 (최우선)
export { default as StyleManager } from './StyleManager';

// 디자인 토큰 (최우선 로드)
import '@shared/styles/design-tokens.css';

// 격리된 갤러리 스타일 (트위터 페이지에 영향 없음)
import '@shared/styles/isolated-gallery.css';

// 기본 리셋 스타일 (갤러리 컨테이너 내부에만 적용)
import '@assets/styles/base/reset.css';

// 필수 컴포넌트 애니메이션
import '@assets/styles/components/animations.css';

// 접근성 지원
import '@assets/styles/utilities/accessibility.css';

// 스타일 유틸리티 함수 export (레거시 호환성)
export * from '@shared/utils';

// 테마 유틸리티 함수들 export
export { getXEGVariable, setGalleryTheme } from './theme-utils';

// 네임스페이스된 스타일 시스템 (단순화됨)
export {
  initializeNamespacedStyles,
  cleanupNamespacedStyles,
  createNamespacedClass,
  createNamespacedSelector,
} from './namespaced-styles';

// 새로운 통합 API 편의 함수들
import StyleManager from './StyleManager';

export const styleUtils = {
  // 클래스 관리
  combine: (...classes: (string | undefined | false | null)[]) =>
    StyleManager.combineClasses(...classes),

  // 글래스모피즘
  applyGlass: (element: HTMLElement, intensity: 'light' | 'medium' | 'strong' | 'ultra') =>
    StyleManager.applyGlassmorphism(element, intensity),

  applyAccessibleGlass: (
    element: HTMLElement,
    intensity: 'light' | 'medium' | 'strong' | 'ultra'
  ) => StyleManager.applyAccessibleGlassmorphism(element, intensity),

  // 테마 관리
  setTheme: (element: HTMLElement, theme: 'light' | 'dark' | 'auto') =>
    StyleManager.setTheme(element, theme),

  // 토큰 관리
  setToken: (property: string, value: string, element?: HTMLElement) =>
    StyleManager.setTokenValue(property, value, element),

  getToken: (property: string, element?: HTMLElement) =>
    StyleManager.getTokenValue(property, element),

  setMultipleTokens: (variables: Record<string, string>, element?: HTMLElement) =>
    StyleManager.setMultipleTokens(variables, element),

  // 컴포넌트 상태
  updateState: (element: HTMLElement, state: Record<string, boolean>, prefix?: string) =>
    StyleManager.updateComponentState(element, state, prefix),

  // 유틸리티 클래스
  applyUtility: (element: HTMLElement, ...utilities: string[]) =>
    StyleManager.applyUtilityClass(element, ...utilities),

  removeUtility: (element: HTMLElement, ...utilities: string[]) =>
    StyleManager.removeUtilityClass(element, ...utilities),

  // 브라우저 지원 감지
  supportsGlass: () => StyleManager.supportsGlassmorphism(),
  isHighContrast: () => StyleManager.isHighContrastMode(),
  isReducedTransparency: () => StyleManager.isReducedTransparencyMode(),
};

// 타입 export
export type {
  GlassmorphismIntensity,
  Theme,
  ComponentState,
  GlassmorphismConfig,
} from './StyleManager';
