/**
 * Toolbar State Management Hook
 *
 * @description
 * 툴바 컴포넌트의 상태 관리를 위한 커스텀 훅입니다.
 * UI 상태와 비즈니스 로직을 분리하여 관리합니다.
 *
 * @features
 * - 다운로드 상태 관리
 * - 로딩 상태 관리
 * - 에러 상태 관리
 * - 활성 버튼 상태 관리
 * - 상태 변경 액션 제공
 *
 * @since 1.0.0
 * @module useToolbarState
 */

import { getSolidCore, getSolidStore } from '@shared/external/vendors';

/**
 * 툴바 상태 인터페이스
 */
export interface ToolbarState {
  /** 다운로드 진행 상태 */
  isDownloading: boolean;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 발생 상태 */
  hasError: boolean;
  /** 현재 핏 모드 */
  currentFitMode: string;
  /** 고대비 모드 필요 여부 */
  needsHighContrast: boolean;
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
 * 툴바 상태 타입 정의
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
 * 툴바 상태 관리 훅
 *
 * @description
 * 툴바 컴포넌트의 상태를 관리하는 커스텀 훅입니다.
 * UI 상태와 비즈니스 로직을 분리하여 관리합니다.
 *
 * @returns [상태, 액션] 튜플
 *
 * @example
 * ```typescript
 * const [toolbarState, toolbarActions] = useToolbarState();
 *
 * // 다운로드 시작
 * toolbarActions.setDownloading(true);
 *
 * // 상태 확인
 * if (toolbarState.isDownloading) {
 *   // 다운로드 중 UI 표시
 * }
 * ```
 */
export function useToolbarState(): [ToolbarState, ToolbarActions] {
  const { createSignal, onCleanup, batch } = getSolidCore();
  const { createStore } = getSolidStore();

  const [state, setState] = createStore<ToolbarState>(INITIAL_STATE);
  const [lastDownloadToggle, setLastDownloadToggle] = createSignal(0);
  const [downloadTimeoutId, setDownloadTimeoutId] = createSignal<number | null>(null);

  const clearDownloadTimeout = () => {
    const timeoutId = downloadTimeoutId();
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      setDownloadTimeoutId(null);
    }
  };

  const setDownloading = (downloading: boolean) => {
    const now = Date.now();

    if (downloading) {
      setLastDownloadToggle(now);
      clearDownloadTimeout();
      batch(() => {
        setState('isDownloading', true);
        setState('hasError', false);
      });
      return;
    }

    const timeSinceStart = now - lastDownloadToggle();
    const minDisplayTime = 300;

    const applyStop = () => setState('isDownloading', false);

    if (timeSinceStart < minDisplayTime) {
      clearDownloadTimeout();
      const timeoutId = window.setTimeout(applyStop, minDisplayTime - timeSinceStart);
      setDownloadTimeoutId(timeoutId);
    } else {
      applyStop();
    }
  };

  const setLoading = (loading: boolean) => {
    batch(() => {
      setState('isLoading', loading);
      if (loading) {
        setState('hasError', false);
      }
    });
  };

  const setError = (hasError: boolean) => {
    batch(() => {
      setState('hasError', hasError);
      if (hasError) {
        setState('isLoading', false);
        setState('isDownloading', false);
      }
    });
  };

  const setCurrentFitMode = (mode: string) => {
    setState('currentFitMode', mode);
  };

  const setNeedsHighContrast = (needsHighContrast: boolean) => {
    setState('needsHighContrast', needsHighContrast);
  };

  const resetState = () => {
    clearDownloadTimeout();
    setLastDownloadToggle(0);
    batch(() => {
      setState(INITIAL_STATE);
      setDownloadTimeoutId(null);
    });
  };

  onCleanup(() => {
    clearDownloadTimeout();
  });

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

export default useToolbarState;
