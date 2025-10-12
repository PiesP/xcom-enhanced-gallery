/**
 * @fileoverview Gallery Toolbar Component (Solid.js)
 * @description 고급 갤러리 툴바 UI - Solid.js 기반 구현
 */

import type { JSXElement } from '../../../external/vendors';
import { getSolid } from '../../../external/vendors';
import type { ViewMode } from '../../../types';
import {
  useToolbarState,
  getToolbarDataState,
  getToolbarClassName,
} from '../../../hooks/use-toolbar-state';
import { throttleScroll } from '../../../utils/performance/performance-utils';
import { EventManager } from '../../../services/event-manager';
import { ComponentStandards } from '../StandardProps';
import { IconButton } from '../Button/IconButton';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileZip,
  Settings,
  X,
  ZoomIn,
  ArrowAutofitWidth,
  ArrowAutofitHeight,
  ArrowsMaximize,
} from '../Icon';
import styles from './Toolbar.module.css';

const solid = getSolid();

const DEFAULT_TOOLBAR_PROPS = {
  isDownloading: false,
  disabled: false,
  className: '',
} as const;

// 통합된 Toolbar Props - 구체적인 타입 정의
export interface ToolbarProps {
  /** 현재 인덱스 */
  currentIndex: number;
  /** 포커스된 인덱스 (옵션) */
  focusedIndex?: number | null;
  /** 전체 개수 */
  totalCount: number;
  /** 다운로드 진행 상태 */
  isDownloading?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 현재 뷰 모드 */
  currentViewMode?: ViewMode;
  /** 뷰 모드 변경 콜백 */
  onViewModeChange?: (mode: ViewMode) => void;
  /** 이전 버튼 콜백 */
  onPrevious: () => void;
  /** 다음 버튼 콜백 */
  onNext: () => void;
  /** 현재 항목 다운로드 콜백 */
  onDownloadCurrent: () => void;
  /** 전체 다운로드 콜백 */
  onDownloadAll: () => void;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 설정 열기 콜백 */
  onOpenSettings?: () => void;
  /** 툴바 위치 */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** 추가 클래스명 */
  className?: string;
  /** 테스트 ID */
  'data-testid'?: string;
  /** 접근성 레이블 */
  'aria-label'?: string;
  /** ARIA 속성들 */
  'aria-describedby'?: string;
  /** 접근성 역할 */
  role?: 'toolbar';
  /** 탭 인덱스 */
  tabIndex?: number;
  /** ImageFitCallbacks 지원 */
  onFitOriginal?: (event?: Event) => void;
  onFitWidth?: (event?: Event) => void;
  onFitHeight?: (event?: Event) => void;
  onFitContainer?: (event?: Event) => void;
  // 표준 이벤트 핸들러들
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

// 호환성을 위한 별칭
export type GalleryToolbarProps = ToolbarProps;

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
} as const;

type FitMode = keyof typeof fitModeLabels;

type FitModeHandlerMap = Record<FitMode, ToolbarProps['onFitOriginal']>;

const FIT_MODE_ICONS: Record<FitMode, (props: { size?: number }) => JSXElement> = {
  original: ZoomIn,
  fitWidth: ArrowAutofitWidth,
  fitHeight: ArrowAutofitHeight,
  fitContainer: ArrowsMaximize,
};

function ToolbarComponent(rawProps: ToolbarProps): JSXElement {
  const { mergeProps, createMemo, createEffect, onCleanup, Show, on } = solid;

  const props = mergeProps(DEFAULT_TOOLBAR_PROPS, rawProps);
  const [toolbarState, toolbarActions] = useToolbarState();

  let toolbarRef: HTMLDivElement | undefined;

  const toolbarClass = createMemo(() =>
    ComponentStandards.createClassName(
      styles.toolbar,
      getToolbarClassName(toolbarState, styles.galleryToolbar || ''),
      props.className ?? ''
    )
  );

  const displayedIndex = createMemo(() => {
    const focus = props.focusedIndex;
    const current = props.currentIndex;

    // focusedIndex가 유효하고 currentIndex와 일치하거나 근접한 경우에만 사용
    if (typeof focus === 'number' && focus >= 0 && focus < props.totalCount) {
      // currentIndex와 동일하거나 매우 근접한 경우 focusedIndex 사용
      const diff = Math.abs(focus - current);
      if (diff <= 1) {
        return focus;
      }
    }

    // 그 외의 경우 currentIndex를 우선 사용 (더 신뢰할 수 있는 값)
    return current;
  });

  const progressWidth = createMemo(() => {
    if (props.totalCount <= 0) {
      return '0%';
    }
    return `${((displayedIndex() + 1) / props.totalCount) * 100}%`;
  });

  // props.isDownloading 변경 시에만 effect 실행 (on helper로 최적화)
  createEffect(
    on(
      () => props.isDownloading,
      isDownloading => {
        toolbarActions.setDownloading(!!isDownloading);
      }
    )
  );

  createEffect(() => {
    const canDetect =
      typeof document !== 'undefined' &&
      typeof (document as unknown as { elementsFromPoint?: unknown }).elementsFromPoint ===
        'function' &&
      typeof window !== 'undefined' &&
      typeof window.getComputedStyle === 'function';

    if (!canDetect) {
      toolbarActions.setNeedsHighContrast(false);
      return;
    }

    const detectBackgroundBrightness = (): void => {
      try {
        if (!toolbarRef) {
          return;
        }

        const rect = toolbarRef.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) {
          toolbarActions.setNeedsHighContrast(false);
          return;
        }

        const samplePoints = [
          { x: rect.left + rect.width * 0.25, y: rect.top + rect.height / 2 },
          { x: rect.left + rect.width * 0.5, y: rect.top + rect.height / 2 },
          { x: rect.left + rect.width * 0.75, y: rect.top + rect.height / 2 },
        ];

        let lightBackgroundCount = 0;

        samplePoints.forEach(point => {
          const elementsBelow = (
            document as unknown as {
              elementsFromPoint: (x: number, y: number) => Element[];
            }
          ).elementsFromPoint(point.x, point.y);

          const hasLight = elementsBelow.some((el: Element) => {
            const computedStyles = window.getComputedStyle(el);
            const bgColor = computedStyles.backgroundColor || '';
            return (
              bgColor.includes('rgb(255') ||
              bgColor.includes('white') ||
              bgColor.includes('rgba(255')
            );
          });

          if (hasLight) {
            lightBackgroundCount += 1;
          }
        });

        toolbarActions.setNeedsHighContrast(lightBackgroundCount >= 2);
      } catch {
        toolbarActions.setNeedsHighContrast(false);
      }
    };

    detectBackgroundBrightness();

    const throttledDetect = throttleScroll(() => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(detectBackgroundBrightness);
      } else {
        detectBackgroundBrightness();
      }
    });

    const listenerId = EventManager.getInstance().addListener(
      window,
      'scroll',
      throttledDetect as unknown as EventListener,
      { passive: true }
    );

    onCleanup(() => {
      EventManager.getInstance().removeListener(listenerId);
    });
  });

  const handleButtonClick = (event: Event | MouseEvent, action?: () => void): void => {
    event.stopPropagation();
    if (!action) {
      return;
    }
    action();
  };

  const handleFitMode = (event: Event, mode: FitMode, action?: (() => void) | null): void => {
    event.preventDefault();
    event.stopPropagation();
    if (
      typeof (event as { stopImmediatePropagation?: () => void }).stopImmediatePropagation ===
      'function'
    ) {
      (event as { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
    }

    toolbarActions.setCurrentFitMode(mode);

    if (action && !props.disabled) {
      action();
    }
  };

  const renderFitButton = (mode: FitMode, handler?: (() => void) | null): JSXElement => {
    const Icon = FIT_MODE_ICONS[mode];
    return (
      <IconButton
        size='toolbar'
        onClick={event => handleFitMode(event, mode, handler ?? undefined)}
        disabled={props.disabled || !handler}
        aria-label={fitModeLabels[mode].label}
        title={fitModeLabels[mode].title}
        data-gallery-element={`fit-${mode}`}
        data-selected={toolbarState.currentFitMode === mode}
        data-disabled={props.disabled || !handler}
      >
        <Icon size={18} />
      </IconButton>
    );
  };

  const fitModeHandlers: FitModeHandlerMap = {
    original: props.onFitOriginal ?? undefined,
    fitWidth: props.onFitWidth ?? undefined,
    fitHeight: props.onFitHeight ?? undefined,
    fitContainer: props.onFitContainer ?? undefined,
  };

  return (
    <div
      ref={element => {
        toolbarRef = element ?? undefined;
      }}
      class={toolbarClass()}
      role={props.role ?? 'toolbar'}
      aria-label={props['aria-label'] ?? '갤러리 도구모음'}
      aria-describedby={props['aria-describedby']}
      aria-disabled={props.disabled}
      data-testid={props['data-testid']}
      data-gallery-element='toolbar'
      data-state={getToolbarDataState(toolbarState)}
      data-disabled={props.disabled}
      data-high-contrast={toolbarState.needsHighContrast}
      data-focused-index={String(displayedIndex())}
      data-current-index={String(props.currentIndex)}
      tabIndex={props.tabIndex}
      onFocus={props.onFocus as ((event: FocusEvent) => void) | undefined}
      onBlur={props.onBlur as ((event: FocusEvent) => void) | undefined}
      onKeyDown={props.onKeyDown as ((event: KeyboardEvent) => void) | undefined}
    >
      <div
        class={`${styles.toolbarContent} xeg-center-between xeg-gap-md`}
        data-gallery-element='toolbar-content'
      >
        <div
          class={`${styles.toolbarSection} ${styles.toolbarLeft} toolbarLeft xeg-row-center xeg-gap-sm`}
          data-gallery-element='navigation-left'
        >
          <IconButton
            size='toolbar'
            aria-label='이전 미디어'
            title='이전 미디어 (←)'
            disabled={props.disabled || props.currentIndex <= 0}
            onClick={event => handleButtonClick(event, props.onPrevious)}
            data-gallery-element='nav-previous'
            data-disabled={props.disabled || props.currentIndex <= 0}
          >
            <ChevronLeft size={18} />
          </IconButton>

          <IconButton
            size='toolbar'
            aria-label='다음 미디어'
            title='다음 미디어 (→)'
            disabled={props.disabled || props.currentIndex >= props.totalCount - 1}
            onClick={event => handleButtonClick(event, props.onNext)}
            data-gallery-element='nav-next'
            data-disabled={props.disabled || props.currentIndex >= props.totalCount - 1}
          >
            <ChevronRight size={18} />
          </IconButton>
        </div>

        <div
          class={`${styles.toolbarSection} ${styles.toolbarCenter} xeg-row-center`}
          data-gallery-element='counter-section'
        >
          <div class={styles.mediaCounterWrapper}>
            <span
              class={styles.mediaCounter}
              aria-live='polite'
              data-gallery-element='counter'
              data-focused-index={String(displayedIndex())}
              data-current-index={String(props.currentIndex)}
            >
              <span class={styles.currentIndex}>{displayedIndex() + 1}</span>
              <span class={styles.separator}>/</span>
              <span class={styles.totalCount}>{props.totalCount}</span>
            </span>
            <div class={styles.progressBar}>
              <div class={styles.progressFill} style={{ width: progressWidth() }} />
            </div>
          </div>
        </div>

        <div
          class={`${styles.toolbarSection} ${styles.toolbarRight} xeg-row-center xeg-gap-sm`}
          data-gallery-element='actions-right'
        >
          {renderFitButton('original', fitModeHandlers.original)}
          {renderFitButton('fitWidth', fitModeHandlers.fitWidth)}
          {renderFitButton('fitHeight', fitModeHandlers.fitHeight)}
          {renderFitButton('fitContainer', fitModeHandlers.fitContainer)}

          <IconButton
            size='toolbar'
            loading={props.isDownloading}
            onClick={event => handleButtonClick(event, props.onDownloadCurrent)}
            disabled={props.disabled || !!props.isDownloading}
            aria-label='현재 파일 다운로드'
            title='현재 파일 다운로드 (Ctrl+D)'
            data-gallery-element='download-current'
            data-disabled={props.disabled || !!props.isDownloading}
            data-loading={props.isDownloading}
          >
            <Download size={18} />
          </IconButton>

          <Show when={props.totalCount > 1}>
            <IconButton
              size='toolbar'
              onClick={event => handleButtonClick(event, props.onDownloadAll)}
              disabled={props.disabled || !!props.isDownloading}
              aria-label={`전체 ${props.totalCount}개 파일 ZIP 다운로드`}
              title={`전체 ${props.totalCount}개 파일 ZIP 다운로드`}
              data-gallery-element='download-all'
              data-disabled={props.disabled || !!props.isDownloading}
              data-loading={props.isDownloading}
            >
              <FileZip size={18} />
            </IconButton>
          </Show>

          <Show when={typeof props.onOpenSettings === 'function'}>
            <IconButton
              size='toolbar'
              aria-label='설정 열기'
              title='설정'
              disabled={props.disabled}
              onClick={event => handleButtonClick(event, props.onOpenSettings ?? undefined)}
              onMouseDown={event => handleButtonClick(event, props.onOpenSettings ?? undefined)}
              data-gallery-element='settings'
              data-disabled={props.disabled}
            >
              <Settings size={18} />
            </IconButton>
          </Show>

          <IconButton
            size='toolbar'
            intent='danger'
            aria-label='갤러리 닫기'
            title='갤러리 닫기 (Esc)'
            disabled={props.disabled}
            onClick={event => handleButtonClick(event, props.onClose)}
            data-gallery-element='close'
            data-disabled={props.disabled}
          >
            <X size={18} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

const ToolbarMemo = solid.memo<ToolbarProps>(ToolbarComponent);

Object.defineProperty(ToolbarMemo, 'displayName', {
  value: 'memo(ToolbarComponent)',
  configurable: true,
});

export const Toolbar = ToolbarMemo;

export default ToolbarMemo;
