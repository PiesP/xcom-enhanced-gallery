/**
 * @fileoverview 통합된 스타일 시스템 엔트리포인트 (v3.0.0)
 * @description StyleManager를 중심으로 한 스타일 관리 시스템
 * @version 3.0.0
 */

// 통합 스타일 매니저 (최우선)
export { default as StyleManager } from './style-service';

// CSS 사이드이펙트 로드는 globals.ts에서 단일 진입으로 관리합니다.
// 중복 로드를 방지하기 위해 본 파일에서는 CSS를 import하지 않습니다.

// 스타일 유틸리티 함수 re-export는 금지 (배럴 위생 규칙)

// 테마 유틸리티 함수들 export
export { getXEGVariable, setGalleryTheme } from './theme-utils';

// 네임스페이스된 스타일 시스템 (단순화됨)
export {
  initializeNamespacedStyles,
  cleanupNamespacedStyles,
  createNamespacedClass,
  createNamespacedSelector,
} from './namespaced-styles';

// StyleManager를 직접 사용하도록 권장 (v3.1.0)
// styleUtils 래퍼는 제거됨 - StyleManager를 직접 import하세요
// import { StyleManager } from '@shared/styles';

// 타입 export
export type {
  GlassmorphismIntensity,
  // Theme은 theme-service에서 import하도록 변경
  ComponentState,
  GlassmorphismConfig,
} from './style-service';
