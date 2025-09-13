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

import { getPreactHooks } from '../external/vendors';

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
  const { useState, useCallback, useRef, useEffect } = getPreactHooks();
  const [state, setState] = useState<ToolbarState>(INITIAL_STATE);

  // 다운로드 상태 변경 시간 추적
  const lastDownloadToggleRef = useRef(0);
  const downloadTimeoutRef = useRef<number | null>(null);

  // 다운로드 상태 설정 - 최소 표시 시간 적용
  const setDownloading = useCallback((downloading: boolean) => {
    const now = Date.now();

    if (downloading) {
      // 다운로드 시작
      lastDownloadToggleRef.current = now;
      setState((prev: ToolbarState) => ({
        ...prev,
        isDownloading: true,
        hasError: false,
      }));
    } else {
      // 다운로드 완료 - 최소 300ms 표시 시간 보장
      const timeSinceStart = now - lastDownloadToggleRef.current;
      const minDisplayTime = 300;

      if (timeSinceStart < minDisplayTime) {
        // 최소 표시 시간이 지나지 않았으면 지연 후 변경
        if (downloadTimeoutRef.current) {
          clearTimeout(downloadTimeoutRef.current);
        }
        downloadTimeoutRef.current = window.setTimeout(() => {
          setState((prev: ToolbarState) => ({
            ...prev,
            isDownloading: false,
          }));
        }, minDisplayTime - timeSinceStart);
      } else {
        // 충분한 시간이 지났으면 즉시 변경
        setState((prev: ToolbarState) => ({
          ...prev,
          isDownloading: false,
        }));
      }
    }
  }, []);

  // 로딩 상태 설정
  const setLoading = useCallback((loading: boolean) => {
    setState((prev: ToolbarState) => ({
      ...prev,
      isLoading: loading,
      // 로딩 시작 시 에러 상태 초기화
      hasError: loading ? false : prev.hasError,
    }));
  }, []);

  // 에러 상태 설정
  const setError = useCallback((hasError: boolean) => {
    setState((prev: ToolbarState) => ({
      ...prev,
      hasError,
      // 에러 발생 시 로딩/다운로드 상태 초기화
      isLoading: hasError ? false : prev.isLoading,
      isDownloading: hasError ? false : prev.isDownloading,
    }));
  }, []);

  // 핏 모드 설정
  const setCurrentFitMode = useCallback((mode: string) => {
    setState((prev: ToolbarState) => ({ ...prev, currentFitMode: mode }));
  }, []);

  // 고대비 모드 설정
  const setNeedsHighContrast = useCallback((needsHighContrast: boolean) => {
    setState((prev: ToolbarState) => ({ ...prev, needsHighContrast }));
  }, []);

  // 상태 초기화 및 cleanup
  const resetState = useCallback(() => {
    // 타이머 정리
    if (downloadTimeoutRef.current) {
      clearTimeout(downloadTimeoutRef.current);
      downloadTimeoutRef.current = null;
    }
    setState(INITIAL_STATE);
  }, []);

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
      }
    };
  }, []);

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
