/**
 * @fileoverview 격리된 갤러리 전역 스타일 시스템 (v5.0.0)
 * @description 트위터 페이지에 영향을 주지 않는 격리된 스타일만 import
 * @version 5.0.0
 */

// 격리된 갤러리 스타일 (트위터 페이지에 영향 없음)
import '@shared/styles/isolated-gallery.css';

// 통합된 디자인 토큰 CSS 변수 (모든 글래스모피즘 스타일 포함)
import '@shared/styles/design-tokens.css';

// 디자인 토큰 - 애니메이션 시스템
import '@assets/styles/design-tokens.animation.css';

// 애니메이션 유틸리티 클래스
import '@assets/styles/animation-utilities.css';

// 브라우저 스타일 초기화 (갤러리 컨테이너 내부에만 적용)
import '@assets/styles/base/reset.css';
