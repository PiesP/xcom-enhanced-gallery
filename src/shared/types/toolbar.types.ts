/**
 * @fileoverview Toolbar Types - Shared UI State Types
 * @version 2.0.0 - Phase 197.1: @shared/types로 이동
 * @description Toolbar 관련 UI 상태 타입 정의
 *
 * **역사**:
 * - Phase 196: src/shared/types/toolbar-types.ts 생성 → src/features/gallery/types/toolbar.types.ts로 이동
 * - Phase 197.1: 의존성 역행 해결을 위해 @shared/types로 복귀
 *
 * **이유**:
 * - ToolbarState, ToolbarActions는 UI 상태 타입으로 일반적
 * - @shared/utils/toolbar-utils.ts와 @shared/hooks/use-toolbar-state.ts가 의존
 * - @shared 계층이 의존해야 하므로 @shared/types에 위치가 맞음
 * - 미래: Toolbar 컴포넌트가 Gallery 외 다른 기능에서 재사용될 수 있음
 */

/**
 * 툴바 데이터 상태 (비즈니스 로직)
 *
 * @description 비즈니스 로직에서 toolbar 상태를 추적하는 상태 타입
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
 * @description 컨테이너 내 이미지 렌더링 방식을 정의
 *
 * - 'original': 원본 크기 유지
 * - 'fitWidth': 너비에 맞춤
 * - 'fitHeight': 높이에 맞춤
 * - 'fitContainer': 컨테이너에 가득 채우기
 *
 * @note ui.types.ts의 ImageFitMode와 동일
 * @see ui.types.ts ImageFitMode
 */
export type FitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';

/**
 * 툴바 UI 상태 객체
 *
 * @description 갤러리 뷰어/이미지 뷰어의 toolbar 컴포넌트가 관리하는 상태
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
 *
 * @example
 * ```typescript
 * const actions: ToolbarActions = {
 *   setDownloading: (value) => setState('isDownloading', value),
 *   setLoading: (value) => setState('isLoading', value),
 *   // ...
 * };
 * ```
 */
export interface ToolbarActions {
  /** 다운로드 상태 설정 */
  setDownloading(value: boolean): void;
  /** 로딩 상태 설정 */
  setLoading(value: boolean): void;
  /** 에러 상태 설정 */
  setError(value: boolean): void;
  /** 고대비 모드 설정 */
  setHighContrast(value: boolean): void;
  /** 상태 초기화 */
  resetState(): void;
}
