/**
 * @fileoverview 격리된 갤러리 전역 스타일 시스템 (v5.1.0)
 * @description 트위터 페이지에 영향을 주지 않는 격리된 스타일만 import
 * @version 5.1.0 - Phase 352: CSS @import 제거로 번들러 최적화
 * @see Phase 352: CSS import 체인 최적화 (네트워크 요청 감소, HMR 개선)
 */

// 디자인 토큰 (3단 계층) - CSS @import 대신 직접 import로 번들러 최적화
// Phase 352: design-tokens.css 중간 레이어 제거 → 직접 import
import '@shared/styles/design-tokens.primitive.css'; // 1단계: 기본 값 (색상, 크기)
import '@shared/styles/design-tokens.semantic.css'; // 2단계: 역할 기반 토큰
import '@shared/styles/design-tokens.component.css'; // 3단계: 컴포넌트별 토큰

// 디자인 토큰 - 애니메이션 시스템 (Duration/Easing/Delay CSS 변수)
import '@shared/styles/tokens/animation.css';

// 브라우저 스타일 초기화 (갤러리 컨테이너 내부에만 적용)
import '@shared/styles/base/reset.css';

// 유틸리티 클래스: 정렬/간격/크기 (경량, em/토큰 기반)
import '@shared/styles/utilities/layout.css';

// 유틸리티 클래스: @keyframes 정의 + 애니메이션 utility classes
import '@shared/styles/utilities/animations.css';

// 최신 CSS 기능 (OKLCH, Nesting, Relative colors)
import '@shared/styles/modern-features.css';

// 격리된 갤러리 스타일 (트위터 페이지에 영향 없음)
import '@shared/styles/isolated-gallery.css';
