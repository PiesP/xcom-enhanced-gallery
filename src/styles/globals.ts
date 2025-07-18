/**
 * @fileoverview 격리된 갤러리 전역 스타일 시스템 (v5.0.0)
 * @description 트위터 페이지에 영향을 주지 않는 격리된 스타일만 import
 * @version 5.0.0
 */

// 격리된 갤러리 스타일 (트위터 페이지에 영향 없음)
import '@shared/styles/isolated-gallery.css';

// 디자인 토큰 CSS 변수 (필요시에만)
import '@shared/styles/design-tokens.css';

// 브라우저 스타일 초기화 (갤러리 컨테이너 내부에만 적용)
import '@assets/styles/base/reset.css';
