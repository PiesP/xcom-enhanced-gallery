/**
 * @fileoverview Toolbar Types - Shared UI State Types
 * @version 3.0.0 - Phase 219: Type System Consolidation
 * @description Toolbar 관련 UI 상태 타입 정의
 *
 * **중요: 타입 시스템 명확화 (Phase 219)**:
 * 이 파일의 ToolbarState는 "UI 상태" 타입입니다.
 *
 * 별도로 존재하는 "모드 상태"와 혼동하지 마세요:
 * - 이 파일 (toolbar.types.ts): ToolbarState = UI 상태
 *   구조: { isDownloading, isLoading, hasError, currentFitMode, needsHighContrast }
 *   목적: 컴포넌트의 시각적 상태 관리
 *
 * - @shared/state/signals/toolbar.signals.ts: ToolbarModeStateData = 모드 상태
 *   구조: { currentMode: 'gallery'|'settings'|'download', needsHighContrast }
 *   목적: 전역 모드 관리 (어느 패널을 보일지)
 *
 * **역사**:
 * - Phase 196: src/shared/types/toolbar-types.ts 생성
 * - Phase 197.1: @shared/types로 이동 (의존성 역행 해결)
 * - Phase 219: ToolbarModeState 분리 (네이밍 충돌 해결)
 *
 * **마이그레이션 경로**:
 * - @features/gallery/types에서 재-export (backward compatibility)
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
 * @note Toolbar 컴포넌트 및 UI 렌더링 전용
 * @note ui.types.ts의 ImageFitMode와 일관성 유지
 * @see ui.types.ts ImageFitMode
 */
export type FitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';

/**
 * 툴바 UI 상태 객체
 *
 * @description Toolbar 컴포넌트가 관리하는 UI/시각적 상태
 *
 * **⚠️ 중요**: 이것은 "UI 상태"입니다.
 * 전역 "모드 상태"와는 다릅니다.
 * @see @shared/state/signals/toolbar.signals.ts ToolbarModeStateData
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
