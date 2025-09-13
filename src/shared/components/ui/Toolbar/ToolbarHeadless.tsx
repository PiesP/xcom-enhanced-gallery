import { getPreactHooks, type VNode } from '../../../external/vendors';

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
  readonly children: (state: ToolbarState, actions: ToolbarActions) => VNode;
}

export function ToolbarHeadless(props: ToolbarHeadlessProps): VNode {
  const { useMemo, useState } = getPreactHooks();

  const [currentFitMode, setCurrentFitMode] = useState<FitMode>('original');
  const [isDownloading, setDownloading] = useState<boolean>(!!props.isDownloading);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [mode, setMode] = useState<string>('default');

  const items = useMemo<readonly ToolbarItem[]>(() => {
    const disabledPrev = props.currentIndex <= 0;
    const disabledNext = props.currentIndex >= props.totalCount - 1;
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
        loading: isDownloading,
        ...(props.onDownloadCurrent ? { onAction: props.onDownloadCurrent } : {}),
      },
      {
        type: 'downloadAll',
        group: 'downloads',
        loading: isDownloading,
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
  }, [props.currentIndex, props.totalCount, isDownloading]);

  const state: ToolbarState = {
    items,
    currentMode: mode,
    needsHighContrast: highContrast,
    isDownloading,
    currentIndex: props.currentIndex,
    totalCount: props.totalCount,
    currentFitMode,
  };

  const actions: ToolbarActions = {
    setMode,
    setHighContrast,
    setFitMode: (m: FitMode) => setCurrentFitMode(m),
    setDownloading,
    updateItems: () => void 0,
  };

  return props.children(state, actions);
}

export default ToolbarHeadless;
