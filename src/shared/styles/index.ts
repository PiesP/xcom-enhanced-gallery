/**
 * @fileoverview 통합된 스타일 시스템 엔트리포인트 (v3.0.0)
 * @description StyleManager를 중심으로 한 스타일 관리 시스템
 * @version 3.0.0
 */

// 통합 스타일 매니저 (최우선)
export { default as StyleManager } from './style-service';

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

// StyleManager를 직접 사용하도록 권장 (v3.1.0)
// styleUtils 래퍼는 제거됨 - StyleManager를 직접 import하세요
// import { StyleManager } from '@shared/styles';

// 타입 export
export type {
  GlassmorphismIntensity,
  Theme,
  ComponentState,
  GlassmorphismConfig,
} from './style-service';
