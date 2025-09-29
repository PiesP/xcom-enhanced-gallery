/**
 * @fileoverview Gallery Toolbar Component
 * @version 7.0.0 - SolidJS Stage D Migration
 *
 * Visibility model: hover/CSS variables only (no timers/animations).
 * See docs/CODING_GUIDELINES.md → "Toolbar 가시성 가이드라인 (Hover/CSS 변수)".
 */

import type { JSX } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import type { ViewMode, ImageFitMode } from '@shared/types';
import {
  useToolbarState,
  getToolbarDataState,
  getToolbarClassName,
} from '@shared/hooks/useToolbarState';
import { throttleScroll } from '@shared/utils';
import { ComponentStandards } from '../StandardProps';
import styles from './Toolbar.module.css';
import { ToolbarButton } from '../ToolbarButton/ToolbarButton';
import { MediaCounter } from '../MediaCounter/MediaCounter';

export interface ToolbarProps {
  currentIndex: number;
  totalCount: number;
  isDownloading?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  currentViewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onPrevious: () => void;
  onNext: () => void;
  onDownloadCurrent: () => void;
  onDownloadAll: () => void;
  onClose: () => void;
  onOpenSettings?: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: JSX.AriaRole;
  tabIndex?: number;
  currentFitMode?: ImageFitMode;
  onFitOriginal?: (event?: Event) => void;
  onFitWidth?: (event?: Event) => void;
  onFitHeight?: (event?: Event) => void;
  onFitContainer?: (event?: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

export type GalleryToolbarProps = ToolbarProps;

export const Toolbar = (props: ToolbarProps): JSX.Element => {
  const { createEffect, createMemo, onCleanup } = getSolidCore();

  const [toolbarState, toolbarActions] = useToolbarState();

  let toolbarElement: HTMLDivElement | null = null;
  let focusableCache: HTMLElement[] = [];

  const setToolbarRef = (element: HTMLDivElement | null) => {
    toolbarElement = element;
    if (!element) {
      focusableCache = [];
    }
  };

  const collectFocusables = (): HTMLElement[] => {
    if (!toolbarElement) {
      focusableCache = [];
      return focusableCache;
    }

    const selectors = [
      '[data-gallery-element="nav-previous"]',
      '[data-gallery-element="nav-next"]',
      '[data-gallery-element="fit-original"]',
      '[data-gallery-element="fit-width"]',
      '[data-gallery-element="fit-height"]',
      '[data-gallery-element="fit-container"]',
      '[data-gallery-element="download-current"]',
      '[data-gallery-element="download-all"]',
      '[data-gallery-element="settings"]',
      '[data-gallery-element="close"]',
    ];

    const nodes: HTMLElement[] = [];
    for (const selector of selectors) {
      const node = toolbarElement.querySelector(selector) as HTMLElement | null;
      if (node && !node.hasAttribute('disabled') && node.getAttribute('aria-disabled') !== 'true') {
        nodes.push(node);
      }
    }
    focusableCache = nodes;
    return focusableCache;
  };

  const moveFocus = (index: number) => {
    const list = focusableCache.length ? focusableCache : collectFocusables();
    if (!list.length) return;
    const clamped = Math.max(0, Math.min(index, list.length - 1));
    const target = list[clamped];
    try {
      target?.focus?.();
    } catch {
      /* focus failure ignored */
    }
  };

  const findCurrentIndex = (): number => {
    const list = focusableCache.length ? focusableCache : collectFocusables();
    if (!list.length) return -1;
    const active =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
    return active ? list.indexOf(active) : -1;
  };

  const internalKeyDown = (event: KeyboardEvent) => {
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(key)) return;
    const list = collectFocusables();
    if (!list.length) return;
    const currentIdx = findCurrentIndex();
    if (key === 'Escape') {
      props.onClose?.();
      return;
    }
    event.preventDefault();
    if (key === 'Home') {
      moveFocus(0);
      return;
    }
    if (key === 'End') {
      moveFocus(list.length - 1);
      return;
    }
    if (key === 'ArrowRight') {
      const next = currentIdx < 0 ? 0 : (currentIdx + 1) % list.length;
      moveFocus(next);
      return;
    }
    if (key === 'ArrowLeft') {
      const prev = currentIdx < 0 ? list.length - 1 : (currentIdx - 1 + list.length) % list.length;
      moveFocus(prev);
    }
  };

  const handleButtonClick = (event: Event, action?: () => void) => {
    event.stopPropagation();
    action?.();
  };

  const handleFitMode = (event: Event, mode: string, action?: () => void) => {
    event.preventDefault();
    event.stopPropagation();
    if (
      typeof (event as Event & { stopImmediatePropagation?: () => void })
        .stopImmediatePropagation === 'function'
    ) {
      (event as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation();
    }
    toolbarActions.setCurrentFitMode(mode);
    if (action && !props.disabled) {
      action();
    }
  };

  const toolbarClass = createMemo(() =>
    ComponentStandards.createClassName(
      styles.toolbar,
      getToolbarClassName(toolbarState, styles.galleryToolbar || ''),
      props.className ?? ''
    )
  );

  const resolvedTabIndex = createMemo(() =>
    typeof props.tabIndex === 'number' ? props.tabIndex : 0
  );

  const ariaLabel = createMemo(() => props['aria-label'] ?? '갤러리 도구모음');

  const dataState = createMemo(() => getToolbarDataState(toolbarState));

  const restProps = createMemo(() => {
    const keysToExclude = new Set([
      'currentIndex',
      'totalCount',
      'isDownloading',
      'isLoading',
      'disabled',
      'className',
      'onPrevious',
      'onNext',
      'onDownloadCurrent',
      'onDownloadAll',
      'onClose',
      'onOpenSettings',
      'currentFitMode',
      'onFitOriginal',
      'onFitWidth',
      'onFitHeight',
      'onFitContainer',
      'data-testid',
      'aria-label',
      'aria-describedby',
      'role',
      'tabIndex',
      'onFocus',
      'onBlur',
      'onKeyDown',
      'position',
      'currentViewMode',
      'onViewModeChange',
    ]);

    const extracted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (!keysToExclude.has(key)) {
        extracted[key] = value;
      }
    }
    return extracted;
  });

  const canGoNext = createMemo(() => props.currentIndex < props.totalCount - 1);
  const canGoPrevious = createMemo(() => props.currentIndex > 0);
  const effectiveFitMode = createMemo(
    () => (props.currentFitMode as string | undefined) ?? toolbarState.currentFitMode
  );

  createEffect(() => {
    toolbarActions.setDownloading(props.isDownloading ?? false);
  });

  createEffect(() => {
    toolbarActions.setLoading(props.isLoading ?? false);
  });

  createEffect(() => {
    const canDetect =
      typeof document !== 'undefined' &&
      typeof (document as unknown as { elementsFromPoint?: unknown }).elementsFromPoint ===
        'function' &&
      typeof window !== 'undefined' &&
      typeof window.getComputedStyle === 'function';

    if (!canDetect) {
      return;
    }

    const detectBackgroundBrightness = () => {
      try {
        if (!toolbarElement) return;
        const rect = toolbarElement.getBoundingClientRect();
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
            document as unknown as { elementsFromPoint(x: number, y: number): Element[] }
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
          if (hasLight) lightBackgroundCount++;
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

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('scroll', throttledDetect, { passive: true });
    }

    onCleanup(() => {
      try {
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
          window.removeEventListener('scroll', throttledDetect);
        }
      } catch {
        /* noop */
      }
    });
  });

  onCleanup(() => {
    focusableCache = [];
    toolbarElement = null;
  });

  type ToolbarKeyboardEvent = KeyboardEvent & {
    readonly currentTarget: HTMLDivElement;
    readonly target: EventTarget & Element;
  };

  const handleRootKeyDown = (event: ToolbarKeyboardEvent) => {
    internalKeyDown(event);
    props.onKeyDown?.(event);
  };

  const defaultToolbarRole: JSX.AriaRole = 'toolbar';

  return (
    <div
      ref={setToolbarRef}
      class={toolbarClass()}
      role={props.role ?? defaultToolbarRole}
      aria-label={ariaLabel()}
      aria-describedby={props['aria-describedby']}
      aria-disabled={props.disabled ? 'true' : 'false'}
      data-testid={props['data-testid']}
      data-gallery-element='toolbar'
      data-state={dataState()}
      data-disabled={props.disabled ? 'true' : undefined}
      data-high-contrast={toolbarState.needsHighContrast ? 'true' : undefined}
      tabIndex={resolvedTabIndex()}
      onFocus={props.onFocus as JSX.EventHandlerUnion<HTMLDivElement, FocusEvent>}
      onBlur={props.onBlur as JSX.EventHandlerUnion<HTMLDivElement, FocusEvent>}
      onKeyDown={handleRootKeyDown}
      {...(restProps() as Record<string, unknown>)}
    >
      <div class={styles.toolbarContent} data-gallery-element='toolbar-content'>
        <div
          class={`${styles.toolbarSection} ${styles.toolbarLeft} toolbarLeft`}
          data-gallery-element='navigation-left'
          data-toolbar-group='navigation'
          data-group-first='true'
        >
          <ToolbarButton
            aria-label='이전 미디어'
            title='이전 미디어 (←)'
            disabled={Boolean(props.disabled || !canGoPrevious())}
            onClick={event => handleButtonClick(event, props.onPrevious)}
            data-gallery-element='nav-previous'
            icon='ChevronLeft'
          />
          <ToolbarButton
            aria-label='다음 미디어'
            title='다음 미디어 (→)'
            disabled={Boolean(props.disabled || !canGoNext())}
            onClick={event => handleButtonClick(event, props.onNext)}
            data-gallery-element='nav-next'
            icon='ChevronRight'
          />
        </div>
        <div
          class={`${styles.toolbarSection} ${styles.toolbarCenter}`}
          data-gallery-element='counter-section'
          data-toolbar-group='counter'
          data-group-first='true'
        >
          <MediaCounter
            current={props.currentIndex + 1}
            total={props.totalCount}
            showProgress
            layout='stacked'
          />
        </div>
        <div
          class={`${styles.toolbarSection} ${styles.toolbarRight}`}
          data-gallery-element='actions-right'
          data-toolbar-group='actions'
          data-group-first='true'
        >
          <ToolbarButton
            onClick={event => handleFitMode(event, 'original', props.onFitOriginal)}
            disabled={Boolean(props.disabled || !props.onFitOriginal)}
            aria-label='원본 크기'
            title='원본 크기 (1:1)'
            data-gallery-element='fit-original'
            selected={effectiveFitMode() === 'original'}
            icon='ZoomIn'
          />
          <ToolbarButton
            onClick={event => handleFitMode(event, 'fitWidth', props.onFitWidth)}
            disabled={Boolean(props.disabled || !props.onFitWidth)}
            aria-label='가로에 맞춤'
            title='가로에 맞추기'
            data-gallery-element='fit-width'
            selected={effectiveFitMode() === 'fitWidth'}
            icon='ArrowAutofitWidth'
          />
          <ToolbarButton
            onClick={event => handleFitMode(event, 'fitHeight', props.onFitHeight)}
            disabled={Boolean(props.disabled || !props.onFitHeight)}
            aria-label='세로에 맞춤'
            title='세로에 맞추기'
            data-gallery-element='fit-height'
            selected={effectiveFitMode() === 'fitHeight'}
            icon='ArrowAutofitHeight'
          />
          <ToolbarButton
            onClick={event => handleFitMode(event, 'fitContainer', props.onFitContainer)}
            disabled={Boolean(props.disabled || !props.onFitContainer)}
            aria-label='창에 맞춤'
            title='창에 맞추기'
            data-gallery-element='fit-container'
            selected={effectiveFitMode() === 'fitContainer'}
            icon='ArrowsMaximize'
          />
          <ToolbarButton
            loading={Boolean(props.isDownloading)}
            onClick={event => handleButtonClick(event, props.onDownloadCurrent)}
            disabled={Boolean(props.disabled || props.isDownloading || props.isLoading)}
            aria-label='현재 파일 다운로드'
            title='현재 파일 다운로드 (Ctrl+D)'
            data-gallery-element='download-current'
            icon='Download'
          />
          {props.totalCount > 1 ? (
            <ToolbarButton
              onClick={event => handleButtonClick(event, props.onDownloadAll)}
              disabled={Boolean(props.disabled || props.isDownloading || props.isLoading)}
              aria-label={`전체 ${props.totalCount}개 파일 ZIP 다운로드`}
              title={`전체 ${props.totalCount}개 파일 ZIP 다운로드`}
              data-gallery-element='download-all'
              icon='FileZip'
            />
          ) : null}
          {props.onOpenSettings ? (
            <ToolbarButton
              aria-label='설정 열기'
              title='설정'
              disabled={Boolean(props.disabled)}
              onClick={event => handleButtonClick(event, props.onOpenSettings)}
              data-gallery-element='settings'
              icon='Settings'
            />
          ) : null}
          <ToolbarButton
            intent='danger'
            aria-label='갤러리 닫기'
            title='갤러리 닫기 (Esc)'
            disabled={Boolean(props.disabled)}
            onClick={event => handleButtonClick(event, props.onClose)}
            data-gallery-element='close'
            icon='Close'
          />
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
