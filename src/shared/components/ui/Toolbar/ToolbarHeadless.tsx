import { getSolid } from '@shared/external/vendors';
const { createSignal, createMemo } = getSolid();
import type { JSX } from '@shared/external/vendors';

/**
 * @file ToolbarHeadless.solid.tsx
 * @description
 * Headless UI 패턴의 Toolbar 컴포넌트 (Solid.js 버전)
 *
 * 주요 기능:
 * - Render props 패턴으로 UI를 자식에게 위임
 * - 10개 toolbar items 관리 (navigation, fitModes, downloads, controls)
 * - 4개 내부 상태 관리 (fitMode, downloading, highContrast, mode)
 * - Props 기반 동적 item 생성 (disabled, loading, onAction)
 *
 * Solid 마이그레이션:
 * - useState → createSignal (×4)
 * - useMemo → createMemo
 * - Render props children → JSX function call
 * - Fine-grained reactivity (자동 의존성 추적)
 */

export type FitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';

export interface ToolbarItem {
  readonly type:
    | 'previous'
    | 'next'
    | 'fitOriginal'
    | 'fitWidth'
    | 'fitHeight'
    | 'fitContainer'
    | 'downloadCurrent'
    | 'downloadAll'
    | 'settings'
    | 'close'
    | (string & {});
  readonly group: 'navigation' | 'fitModes' | 'downloads' | 'controls' | (string & {});
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly onAction?: () => void;
}

export interface ToolbarState {
  readonly items: readonly ToolbarItem[];
  readonly currentMode: string;
  readonly needsHighContrast: boolean;
  readonly isDownloading: boolean;
  readonly currentIndex: number;
  readonly totalCount: number;
  readonly currentFitMode: FitMode;
}

export interface ToolbarActions {
  readonly setMode: (mode: string) => void;
  readonly setHighContrast: (value: boolean) => void;
  readonly setFitMode: (mode: FitMode) => void;
  readonly setDownloading: (value: boolean) => void;
  readonly updateItems: () => void;
}

export interface ToolbarHeadlessProps {
  readonly currentIndex: number;
  readonly totalCount: number;
  readonly isDownloading?: boolean;
  readonly onPrevious?: () => void;
  readonly onNext?: () => void;
  readonly onDownloadCurrent?: () => void;
  readonly onDownloadAll?: () => void;
  readonly onClose?: () => void;
  readonly onOpenSettings?: () => void;
  readonly onFitOriginal?: () => void;
  readonly onFitWidth?: () => void;
  readonly onFitHeight?: () => void;
  readonly onFitContainer?: () => void;
  readonly children: (state: ToolbarState, actions: ToolbarActions) => JSX.Element;
}

export function ToolbarHeadless(props: ToolbarHeadlessProps): JSX.Element {
  // Internal state management (Solid Signals)
  const [currentFitMode, setCurrentFitMode] = createSignal<FitMode>('original');
  const [isDownloading, setDownloading] = createSignal<boolean>(!!props.isDownloading);
  const [highContrast, setHighContrast] = createSignal<boolean>(false);
  const [mode, setMode] = createSignal<string>('default');

  // Computed items array (automatically tracks dependencies)
  const items = createMemo<readonly ToolbarItem[]>(() => {
    const disabledPrev = props.currentIndex <= 0;
    const disabledNext = props.currentIndex >= props.totalCount - 1;
    const downloading = isDownloading();

    return [
      {
        type: 'previous',
        group: 'navigation',
        disabled: disabledPrev,
        ...(props.onPrevious ? { onAction: props.onPrevious } : {}),
      },
      {
        type: 'next',
        group: 'navigation',
        disabled: disabledNext,
        ...(props.onNext ? { onAction: props.onNext } : {}),
      },
      {
        type: 'fitOriginal',
        group: 'fitModes',
        ...(props.onFitOriginal ? { onAction: props.onFitOriginal } : {}),
      },
      {
        type: 'fitWidth',
        group: 'fitModes',
        ...(props.onFitWidth ? { onAction: props.onFitWidth } : {}),
      },
      {
        type: 'fitHeight',
        group: 'fitModes',
        ...(props.onFitHeight ? { onAction: props.onFitHeight } : {}),
      },
      {
        type: 'fitContainer',
        group: 'fitModes',
        ...(props.onFitContainer ? { onAction: props.onFitContainer } : {}),
      },
      {
        type: 'downloadCurrent',
        group: 'downloads',
        loading: downloading,
        ...(props.onDownloadCurrent ? { onAction: props.onDownloadCurrent } : {}),
      },
      {
        type: 'downloadAll',
        group: 'downloads',
        loading: downloading,
        ...(props.onDownloadAll ? { onAction: props.onDownloadAll } : {}),
      },
      {
        type: 'settings',
        group: 'controls',
        disabled: !props.onOpenSettings,
        ...(props.onOpenSettings ? { onAction: props.onOpenSettings } : {}),
      },
      { type: 'close', group: 'controls', ...(props.onClose ? { onAction: props.onClose } : {}) },
    ];
  });

  // Computed state object
  const state = (): ToolbarState => ({
    items: items(),
    currentMode: mode(),
    needsHighContrast: highContrast(),
    isDownloading: isDownloading(),
    currentIndex: props.currentIndex,
    totalCount: props.totalCount,
    currentFitMode: currentFitMode(),
  });

  // Actions object
  const actions: ToolbarActions = {
    setMode,
    setHighContrast,
    setFitMode: (m: FitMode) => setCurrentFitMode(m),
    setDownloading,
    updateItems: () => void 0,
  };

  // Render props pattern: call children with state and actions
  return props.children(state(), actions);
}

export default ToolbarHeadless;
