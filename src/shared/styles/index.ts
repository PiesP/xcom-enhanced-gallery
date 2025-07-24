/**
 * @fileoverview 단순화된 스타일 시스템 엔트리포인트
 * @description Design System 제거로 단순화된 스타일 관리
 * @version 1.1.0
 */

// 디자인 토큰 (최우선 로드)
import '@shared/styles/design-tokens.css';

// 격리된 갤러리 스타일 (트위터 페이지에 영향 없음)
import '@shared/styles/isolated-gallery.css';

// 기본 리셋 및 글로벌 스타일
import '@assets/styles/base/reset.css';
import '@assets/styles/base/typography.css';

// 유틸리티 클래스들
import '@assets/styles/utilities/accessibility.css';
import '@assets/styles/utilities/responsive.css';

// 스타일 유틸리티 함수 export
export * from '@shared/utils/styles';

// 디자인 토큰 export
export { default as designTokens } from '@shared/styles/design-tokens.css';

// 테마 유틸리티 함수들 export
export {
  getXEGVariable,
  setGalleryTheme,
  isInsideGallery,
  STYLE_CONSTANTS,
  type Theme,
} from './theme-utils';
