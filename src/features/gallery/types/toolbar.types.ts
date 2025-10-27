/**
 * @fileoverview Toolbar Types
 * @version 2.0.0 - Phase 196: Gallery 기능 특화 타입으로 이동
 * @description Toolbar 관련 타입 정의 (Gallery 기능 중심)
 *
 * 이동 경로: src/shared/types/toolbar-types.ts → src/features/gallery/types/toolbar.types.ts
 * 이유: 갤러리 기능 특화 타입이므로 features 계층에 배치
 */

/**
 * 툴바 데이터 상태
 *
 * - 'idle': 유휴 상태 (아무 작업 없음)
 * - 'loading': 데이터 로딩 중
 * - 'downloading': 다운로드 진행 중
 * - 'error': 에러 발생 상태
 */
export type ToolbarDataState = 'idle' | 'loading' | 'downloading' | 'error';

/**
 * 이미지 적합 모드 (Fit Mode)
 *
 * 갤러리 뷰어에서 이미지를 컨테이너에 맞추는 방식을 정의합니다.
 *
 * - 'original': 원본 크기 유지
 * - 'fitWidth': 너비에 맞춤
 * - 'fitHeight': 높이에 맞춤
 * - 'fitContainer': 컨테이너에 가득 채우기
 *
 * @note 이 타입은 ui.types.ts의 ImageFitMode와 동일합니다.
 * @see {@link ui.types.ts} ImageFitMode
 */
export type FitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';

/**
 * 툴바 UI 상태 객체
 *
 * @description 갤러리 뷰어의 toolbar 컴포넌트가 관리하는 상태
 *
 * @example
 * ```typescript
 * const [state, setState] = createSignal<ToolbarState>({
 *   isDownloading: false,
 *   isLoading: false,
 *   hasError: false,
 *   currentFitMode: 'fitContainer',
 *   needsHighContrast: false,
 * });
 * ```
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
  /** 고대비 모드 필요 여부 (WCAG 접근성) */
  readonly needsHighContrast: boolean;
}

/**
 * 툴바 액션 인터페이스
 *
 * @description ToolbarState의 상태를 변경하는 액션들
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
