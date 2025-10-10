import { getSolid, type JSXElement } from '../../../external/vendors';

type Accessor<T> = () => T;

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
  readonly items: Accessor<readonly ToolbarItem[]>;
  readonly currentMode: Accessor<string>;
  readonly needsHighContrast: Accessor<boolean>;
  readonly isDownloading: Accessor<boolean>;
  readonly currentIndex: Accessor<number>;
  readonly totalCount: Accessor<number>;
  readonly currentFitMode: Accessor<FitMode>;
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
  readonly children: (state: ToolbarState, actions: ToolbarActions) => JSXElement;
}

export function ToolbarHeadless(props: ToolbarHeadlessProps): JSXElement {
  const { createMemo, createSignal, createEffect } = getSolid();

  const [currentFitMode, setCurrentFitMode] = createSignal<FitMode>('original');
  const [isDownloading, setDownloading] = createSignal<boolean>(!!props.isDownloading);
  const [highContrast, setHighContrast] = createSignal<boolean>(false);
  const [mode, setMode] = createSignal<string>('default');

  const currentIndex = createMemo(() => props.currentIndex);
  const totalCount = createMemo(() => props.totalCount);

  createEffect(() => {
    setDownloading(!!props.isDownloading);
  });

  const items = createMemo<readonly ToolbarItem[]>(() => {
    const index = currentIndex();
    const total = totalCount();
    const downloading = isDownloading();
    const disabledPrev = index <= 0;
    const disabledNext = index >= total - 1;
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

  const state: ToolbarState = {
    items,
    currentMode: mode,
    needsHighContrast: highContrast,
    isDownloading,
    currentIndex,
    totalCount,
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
