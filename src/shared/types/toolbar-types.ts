/**
 * @fileoverview Toolbar Types
 * @description Toolbar 관련 타입 정의 (순환 의존성 제거)
 *
 * Phase 2: toolbar-utils와 use-toolbar-state 간 순환 의존성 해결
 */

/**
 * 툴바 데이터 상태
 */
export type ToolbarDataState = 'idle' | 'loading' | 'downloading' | 'error';

/**
 * Fit Mode 타입 (contains FitMode from Toolbar.types)
 */
export type FitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';

/**
 * 툴바 UI 상태 객체
 */
export interface ToolbarState {
  /** 다운로드 진행 상태 */
  readonly isDownloading: boolean;
  /** 로딩 상태 */
  readonly isLoading: boolean;
  /** 에러 발생 상태 */
  readonly hasError: boolean;
  /** 현재 핏 모드 */
  readonly currentFitMode: FitMode;
  /** 고대비 모드 필요 여부 */
  readonly needsHighContrast: boolean;
}

/**
 * 툴바 액션 인터페이스
 */
export interface ToolbarActions {
  /** 다운로드 상태 설정 */
  setDownloading(value: boolean): void;
  /** 로딩 상태 설정 */
  setLoading(value: boolean): void;
  /** 에러 상태 설정 */
  setError(value: boolean): void;
  /** 핏 모드 설정 */
  setHighContrast(value: boolean): void;
  /** 상태 초기화 */
  resetState(): void;
}
