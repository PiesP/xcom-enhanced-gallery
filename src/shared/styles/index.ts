/**
 * @fileoverview 단순화된 스타일 시스템 엔트리포인트 (v2.0.0)
 * @description 격리된 갤러리 스타일 및 필수 유틸리티만 제공
 * @version 2.0.0
 */

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

// 스타일 유틸리티 함수 export
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
