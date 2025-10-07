/**
 * @file createToolbarState.solid.ts
 * @description
 * Toolbar State Management Primitive (Solid.js 버전)
 *
 * Preact useToolbarState 훅을 Solid primitive로 마이그레이션
 *
 * 주요 기능:
 * - 다운로드/로딩/에러 상태 관리
 * - 핏 모드 관리 (fitWidth, fitHeight, fitContainer, original)
 * - 고대비 모드 관리
 * - 최소 다운로드 표시 시간 보장 (300ms)
 * - 자동 cleanup (onCleanup)
 *
 * Solid 마이그레이션:
 * - useState → createSignal (×5)
 * - useCallback → 일반 함수 (Solid에서 자동 메모이제이션)
 * - useRef → 일반 변수 (클로저)
 * - useEffect cleanup → onCleanup
 * - Fine-grained reactivity (자동 의존성 추적)
 */

import { createSignal, onCleanup } from 'solid-js';
import { globalTimerManager } from '../utils/timer-management';

/**
 * 툴바 상태 인터페이스
 */
export interface ToolbarState {
  /** 다운로드 진행 상태 */
  readonly isDownloading: boolean;
  /** 로딩 상태 */
  readonly isLoading: boolean;
  /** 에러 발생 상태 */
  readonly hasError: boolean;
  /** 현재 핏 모드 */
  readonly currentFitMode: string;
  /** 고대비 모드 필요 여부 */
  readonly needsHighContrast: boolean;
}

/**
 * 툴바 상태 액션 인터페이스
 */
export interface ToolbarActions {
  /** 다운로드 상태 설정 */
  setDownloading: (downloading: boolean) => void;
  /** 로딩 상태 설정 */
  setLoading: (loading: boolean) => void;
  /** 에러 상태 설정 */
  setError: (hasError: boolean) => void;
  /** 핏 모드 설정 */
  setCurrentFitMode: (mode: string) => void;
  /** 고대비 모드 설정 */
  setNeedsHighContrast: (needsHighContrast: boolean) => void;
  /** 상태 초기화 */
  resetState: () => void;
}

/**
 * 툴바 데이터 상태 타입 정의
 */
export type ToolbarDataState = 'idle' | 'loading' | 'downloading' | 'error';

/**
 * 초기 상태 정의
 */
const INITIAL_STATE: ToolbarState = {
  isDownloading: false,
  isLoading: false,
  hasError: false,
  currentFitMode: 'fitWidth',
  needsHighContrast: false,
} as const;

/**
 * 툴바 상태 관리 Primitive (Solid.js)
 *
 * @description
 * 툴바 컴포넌트의 상태를 관리하는 Solid primitive입니다.
 * UI 상태와 비즈니스 로직을 분리하여 관리합니다.
 *
 * @returns [상태 getter, 액션] 튜플
 *
 * @example
 * ```typescript
 * const [toolbarState, toolbarActions] = createToolbarState();
 *
 * // 다운로드 시작
 * toolbarActions.setDownloading(true);
 *
 * // 상태 확인 (reactive)
 * createEffect(() => {
 *   if (toolbarState().isDownloading) {
 *     // 다운로드 중 UI 표시
 *   }
 * });
 * ```
 */
export function createToolbarState(): [() => ToolbarState, ToolbarActions] {
  // Solid Signals (fine-grained reactivity)
  const [isDownloading, setIsDownloading] = createSignal(INITIAL_STATE.isDownloading);
  const [isLoading, setIsLoading] = createSignal(INITIAL_STATE.isLoading);
  const [hasError, setHasError] = createSignal(INITIAL_STATE.hasError);
  const [currentFitMode, setCurrentFitMode] = createSignal(INITIAL_STATE.currentFitMode);
  const [needsHighContrast, setNeedsHighContrast] = createSignal(INITIAL_STATE.needsHighContrast);

  // 다운로드 상태 변경 시간 추적 (클로저 변수)
  let lastDownloadToggle = 0;
  let downloadTimeout: number | null = null;

  // 다운로드 상태 설정 - 최소 표시 시간 적용
  const setDownloading = (downloading: boolean): void => {
    const now = Date.now();

    if (downloading) {
      // 다운로드 시작
      lastDownloadToggle = now;
      setIsDownloading(true);
      setHasError(false);
    } else {
      // 다운로드 완료 - 최소 300ms 표시 시간 보장
      const timeSinceStart = now - lastDownloadToggle;
      const minDisplayTime = 300;

      if (timeSinceStart < minDisplayTime) {
        // 최소 표시 시간이 지나지 않았으면 지연 후 변경
        if (downloadTimeout !== null) {
          globalTimerManager.clearTimeout(downloadTimeout);
        }
        downloadTimeout = globalTimerManager.setTimeout(() => {
          setIsDownloading(false);
        }, minDisplayTime - timeSinceStart);
      } else {
        // 충분한 시간이 지났으면 즉시 변경
        setIsDownloading(false);
      }
    }
  };

  // 로딩 상태 설정
  const setLoading = (loading: boolean): void => {
    setIsLoading(loading);
    // 로딩 시작 시 에러 상태 초기화
    if (loading) {
      setHasError(false);
    }
  };

  // 에러 상태 설정
  const setError = (error: boolean): void => {
    setHasError(error);
    // 에러 발생 시 로딩/다운로드 상태 초기화
    if (error) {
      setIsLoading(false);
      setIsDownloading(false);
    }
  };

  // 상태 초기화
  const resetState = (): void => {
    // 타이머 정리
    if (downloadTimeout !== null) {
      globalTimerManager.clearTimeout(downloadTimeout);
      downloadTimeout = null;
    }

    // 모든 상태 초기화
    setIsDownloading(INITIAL_STATE.isDownloading);
    setIsLoading(INITIAL_STATE.isLoading);
    setHasError(INITIAL_STATE.hasError);
    setCurrentFitMode(INITIAL_STATE.currentFitMode);
    setNeedsHighContrast(INITIAL_STATE.needsHighContrast);
  };

  // Cleanup: 컴포넌트 언마운트 시 타이머 정리
  onCleanup(() => {
    if (downloadTimeout !== null) {
      globalTimerManager.clearTimeout(downloadTimeout);
    }
  });

  // Computed state getter (reactive)
  const state = (): ToolbarState => ({
    isDownloading: isDownloading(),
    isLoading: isLoading(),
    hasError: hasError(),
    currentFitMode: currentFitMode(),
    needsHighContrast: needsHighContrast(),
  });

  // Actions object
  const actions: ToolbarActions = {
    setDownloading,
    setLoading,
    setError,
    setCurrentFitMode,
    setNeedsHighContrast,
    resetState,
  };

  return [state, actions];
}

/**
 * 툴바 데이터 상태 계산 유틸리티
 *
 * @description
 * 현재 툴바 상태를 기반으로 데이터 속성용 상태 문자열을 반환합니다.
 *
 * @param state - 툴바 상태 객체
 * @returns 데이터 상태 문자열
 */
export function getToolbarDataState(state: ToolbarState): ToolbarDataState {
  if (state.hasError) return 'error';
  if (state.isDownloading) return 'downloading';
  if (state.isLoading) return 'loading';
  return 'idle';
}

/**
 * 툴바 클래스명 생성 유틸리티
 *
 * @description
 * 상태에 따른 툴바 CSS 클래스명을 생성합니다.
 *
 * @param state - 툴바 상태 객체
 * @param baseClassName - 기본 클래스명
 * @param additionalClassNames - 추가 클래스명들
 * @returns 결합된 클래스명 문자열
 */
export function getToolbarClassName(
  state: ToolbarState,
  baseClassName: string,
  ...additionalClassNames: string[]
): string {
  const classNames = [baseClassName];

  if (state.needsHighContrast) {
    classNames.push('highContrast');
  }

  classNames.push(...additionalClassNames.filter(Boolean));

  return classNames.join(' ');
}

export default createToolbarState;
