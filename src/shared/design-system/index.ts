/**
 * @fileoverview 통합 디자인 시스템 진입점
 * @description 모든 디자인 토큰, 유틸리티, 상수를 중앙 집중식으로 관리
 * @version 1.0.0
 */

// 디자인 토큰 시스템
export * from './tokens/DesignTokens';

// 기존 디자인 시스템 (하위 호환성)
export * from './DesignSystem';

// CSS 변수 관리
export { CSSVariablesManager } from '../utils/styles/css-variables-manager';

// 디자인 시스템 유틸리티
export * from './utils/design-utils';

// 디자인 시스템 초기화
export { initializeDesignSystem } from './utils/design-system-initializer';

// 통합 디자인 시스템 매니저
export * from './DesignSystemManager';
