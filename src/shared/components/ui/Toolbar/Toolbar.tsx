/**
 * @fileoverview Gallery Toolbar container
 * @description Coordinates toolbar state/services and delegates rendering to ToolbarView.
 */

import type { JSXElement } from '../../../external/vendors';
import { getSolid } from '../../../external/vendors';
import { useToolbarState } from '../../../hooks/use-toolbar-state';
import { getToolbarDataState, getToolbarClassName } from '../../../utils/toolbar-utils';
import { createClassName } from '@shared/utils/component-utils'; // Phase 284: 개별 함수 직접 import
import { ZoomIn, ArrowAutofitWidth, ArrowAutofitHeight, ArrowsMaximize } from '../Icon';
import type { ToolbarSettingsControllerResult } from '../../../hooks/toolbar/use-toolbar-settings-controller';
import { useToolbarSettingsController } from '../../../hooks/toolbar/use-toolbar-settings-controller';
import { ToolbarView } from './ToolbarView';
import type { ToolbarProps, FitMode } from './Toolbar.types';
import { safeEventPreventAll, safeEventPrevent } from '@shared/utils/event-utils';
import styles from './Toolbar.module.css';

const solid = getSolid();

const DEFAULT_TOOLBAR_PROPS = {
  isDownloading: false,
  disabled: false,
  className: '',
} as const;

const fitModeLabels = {
  original: {
    label: '원본 크기',
    title: '원본 크기 (1:1)',
  },
  fitWidth: {
    label: '가로에 맞춤',
    title: '가로에 맞추기',
  },
  fitHeight: {
    label: '세로에 맞춤',
    title: '세로에 맞추기',
  },
  fitContainer: {
    label: '창에 맞춤',
    title: '창에 맞추기',
  },
} as const satisfies Record<FitMode, { label: string; title: string }>;

const FIT_MODE_ORDER = [
  { mode: 'original' as const, Icon: ZoomIn },
  { mode: 'fitWidth' as const, Icon: ArrowAutofitWidth },
  { mode: 'fitHeight' as const, Icon: ArrowAutofitHeight },
  { mode: 'fitContainer' as const, Icon: ArrowsMaximize },
] as const;

const HIGH_CONTRAST_OFFSETS = [0.25, 0.5, 0.75] as const;

function ToolbarContainer(rawProps: ToolbarProps): JSXElement {
  const { mergeProps, createMemo, createEffect, on, createSignal } = solid;

  const props = mergeProps(DEFAULT_TOOLBAR_PROPS, rawProps);
  const [toolbarState, toolbarActions] = useToolbarState();

  // Local settings expanded state (component-owned for proper reactivity)
  const [isSettingsExpanded, setIsSettingsExpanded] = createSignal(false);
  const toggleSettingsExpanded = () => setIsSettingsExpanded(prev => !prev);

  const toolbarClass = createMemo(() =>
    createClassName(
      styles.toolbar,
      getToolbarClassName(toolbarState, styles.galleryToolbar || ''),
      props.className ?? ''
    )
  );

  const displayedIndex = createMemo((): number => {
    const total = props.totalCount;
    if (!(typeof total === 'number' && total > 0)) {
      return 0;
    }

    const focus = props.focusedIndex;
    if (typeof focus === 'number' && focus >= 0 && focus < total) {
      return focus;
    }

    const current = props.currentIndex;
    if (typeof current === 'number' && current >= 0 && current < total) {
      return current;
    }

    const clampedCurrent = Math.min(Math.max(Number(current) || 0, 0), total - 1);
    return clampedCurrent;
  });

  const progressWidth = createMemo((): string => {
    if (props.totalCount <= 0) {
      return '0%';
    }
    return `${((displayedIndex() + 1) / props.totalCount) * 100}%`;
  });

  createEffect(
    on(
      () => props.isDownloading,
      isDownloading => {
        toolbarActions.setDownloading(!!isDownloading);
      }
    )
  );

  const settingsController = useToolbarSettingsController({
    setNeedsHighContrast: toolbarActions.setHighContrast,
    isSettingsExpanded,
    setSettingsExpanded: setIsSettingsExpanded,
    toggleSettingsExpanded,
    highContrastOffsets: HIGH_CONTRAST_OFFSETS,
  });

  const enhancedSettingsController = {
    ...settingsController,
    handleSettingsClick: (event: MouseEvent) => {
      const wasExpanded = settingsController.isSettingsExpanded();
      settingsController.handleSettingsClick(event);
      if (!wasExpanded && settingsController.isSettingsExpanded()) {
        props.onOpenSettings?.();
      }
    },
  } satisfies ToolbarSettingsControllerResult;

  const toolbarDataState = createMemo(() => getToolbarDataState(toolbarState));

  const getFitHandler = (mode: FitMode): ToolbarProps['onFitOriginal'] => {
    switch (mode) {
      case 'fitWidth':
        return props.onFitWidth ?? undefined;
      case 'fitHeight':
        return props.onFitHeight ?? undefined;
      case 'fitContainer':
        return props.onFitContainer ?? undefined;
      default:
        return props.onFitOriginal ?? undefined;
    }
  };

  // Phase 87: 이벤트 핸들러 메모이제이션으로 불필요한 재생성 방지
  const handleFitModeClick = createMemo(() => {
    const disabled = props.disabled;
    return (mode: FitMode) => (event: MouseEvent) => {
      safeEventPreventAll(event);
      if (!disabled) {
        getFitHandler(mode)?.(event);
      }
    };
  });

  const isFitDisabled = (mode: FitMode): boolean => props.disabled || !getFitHandler(mode);

  // Phase 87: 개별 액션 핸들러 메모이제이션
  const onPreviousClick = createMemo(() => (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onPrevious?.();
  });

  const onNextClick = createMemo(() => (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onNext?.();
  });

  const onDownloadCurrent = createMemo(() => (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onDownloadCurrent?.();
  });

  const onDownloadAll = createMemo(() => (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onDownloadAll?.();
  });

  const onCloseClick = createMemo(() => (event: MouseEvent) => {
    safeEventPrevent(event);
    props.onClose?.();
  });

  const navState = createMemo(() => {
    const total = Math.max(0, props.totalCount ?? 0);
    const disabled = !!props.disabled;
    const isDownloading = !!props.isDownloading;

    return {
      prevDisabled: disabled || total <= 1,
      nextDisabled: disabled || total <= 1,
      canDownloadAll: total > 1,
      downloadDisabled: disabled || isDownloading,
    } as const;
  });

  const showSettingsButton = typeof props.onOpenSettings === 'function';

  const { createComponent } = solid;
  return createComponent(ToolbarView, {
    ...props,
    toolbarClass,
    toolbarState,
    toolbarDataState,
    navState,
    displayedIndex,
    progressWidth,
    fitModeOrder: FIT_MODE_ORDER,
    fitModeLabels,
    handleFitModeClick: handleFitModeClick(),
    isFitDisabled,
    onPreviousClick: onPreviousClick(),
    onNextClick: onNextClick(),
    onDownloadCurrent: onDownloadCurrent(),
    onDownloadAll: onDownloadAll(),
    onCloseClick: onCloseClick(),
    settingsController: enhancedSettingsController,
    showSettingsButton,
  });
}

export type { ToolbarProps, GalleryToolbarProps, FitMode } from './Toolbar.types';
export const Toolbar = ToolbarContainer;

export default ToolbarContainer;
