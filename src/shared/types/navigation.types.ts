/**
 * Navigation Types
 *
 * @description 갤러리 네비게이션 관련 공통 타입 정의
 * @version 2.0.0 - Phase 195: 위치 통합 (state/types → types/)
 */

/**
 * Navigation source type
 *
 * 네비게이션의 출처를 추적하여 자동 포커스와 수동 네비게이션을 구분
 */
export type NavigationSource = 'button' | 'keyboard' | 'scroll' | 'auto-focus';
