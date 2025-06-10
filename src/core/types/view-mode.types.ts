/**
 * Gallery View Modes - Core Types
 *
 * 갤러리 뷰 모드와 관련된 핵심 타입들을 정의합니다.
 * 이 타입들은 core 레이어에서 정의되어 shared와 features에서 사용됩니다.
 */

/** 갤러리 뷰 모드 타입 - 수직 갤러리만 지원 */
export const VIEW_MODES = ['verticalList'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

/**
 * ViewMode 유효성 검사 함수
 */
export function isValidViewMode(mode: string): mode is ViewMode {
  return VIEW_MODES.includes(mode as ViewMode);
}

/**
 * 기본 ViewMode 반환
 */
export function getDefaultViewMode(): ViewMode {
  return 'verticalList';
}

/**
 * ViewMode 변환 함수 (하위 호환성)
 */
export function normalizeViewMode(_mode: unknown): ViewMode {
  // 모든 모드를 수직 갤러리로 통일
  return 'verticalList';
}
