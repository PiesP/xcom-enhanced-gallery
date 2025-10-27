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

import { getSolid, getSolidStore } from '../external/vendors';
import { globalTimerManager } from '../utils/timer-management';
import type { ToolbarState, ToolbarActions } from '@shared/types/toolbar.types';

// Phase 2: 헬퍼 함수 분리 (toolbar-utils로 이동)
export {
  getToolbarDataState,
  getToolbarClassName,
  type ToolbarDataState,
} from '../utils/toolbar-utils';

// Phase 197.1: 타입을 @shared/types로 이동 (의존성 역행 해결)
export type { ToolbarState, ToolbarActions, FitMode } from '@shared/types/toolbar.types';

/**
 * 초기 상태 정의
 */
const INITIAL_STATE: ToolbarState = {
  isDownloading: false,
  isLoading: false,
  hasError: false,
  currentFitMode: 'original',
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
 * ```
 */
export function useToolbarState(): [ToolbarState, ToolbarActions] {
  const { onCleanup } = getSolid();
  const { createStore } = getSolidStore();

  const [state, setState] = createStore<ToolbarState>({ ...INITIAL_STATE });

  let lastDownloadToggle = 0;
  let downloadTimeoutRef: number | null = null;

  const clearDownloadTimeout = (): void => {
    if (downloadTimeoutRef !== null) {
      globalTimerManager.clearTimeout(downloadTimeoutRef);
      downloadTimeoutRef = null;
    }
  };

  const setDownloading = (downloading: boolean): void => {
    const now = Date.now();

    if (downloading) {
      lastDownloadToggle = now;
      clearDownloadTimeout();
      setState({
        isDownloading: true,
        hasError: false,
      });
      return;
    }

    const timeSinceStart = now - lastDownloadToggle;
    const minDisplayTime = 300;

    if (timeSinceStart < minDisplayTime) {
      clearDownloadTimeout();
      downloadTimeoutRef = globalTimerManager.setTimeout(() => {
        setState({ isDownloading: false });
        downloadTimeoutRef = null;
      }, minDisplayTime - timeSinceStart);
      return;
    }

    setState({ isDownloading: false });
  };

  const setLoading = (loading: boolean): void => {
    setState({
      isLoading: loading,
      // 로딩 시작 시 에러 상태 초기화
      hasError: loading ? false : state.hasError,
    });
  };

  // 에러 상태 설정
  const setError = (hasError: boolean): void => {
    setState({
      hasError,
      // 에러 발생 시 로딩/다운로드 상태 초기화
      isLoading: hasError ? false : state.isLoading,
      isDownloading: hasError ? false : state.isDownloading,
    });
  };

  // 핏 모드 설정
  const setHighContrast = (needsHighContrast: boolean): void => {
    setState({ needsHighContrast });
  };

  // 상태 초기화 및 cleanup
  const resetState = (): void => {
    clearDownloadTimeout();
    lastDownloadToggle = 0;
    setState(() => ({ ...INITIAL_STATE }));
  };

  // 컴포넌트 언마운트 시 cleanup
  onCleanup(() => {
    clearDownloadTimeout();
  });

  const actions: ToolbarActions = {
    setDownloading,
    setLoading,
    setError,
    setHighContrast,
    resetState,
  };

  return [state, actions];
}

export default useToolbarState;
