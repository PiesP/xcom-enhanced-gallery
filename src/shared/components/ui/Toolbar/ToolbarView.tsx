import { IconButton } from '@shared/components/ui/Button/IconButton';
import type { LucideIconName } from '@shared/components/ui/Icon/lucide/icon-nodes';
import { LucideIcon } from '@shared/components/ui/Icon/lucide/lucide-icons';
import { SettingsControls } from '@shared/components/ui/Settings/SettingsControls';
import type { FitMode, MaybeAccessor } from '@shared/components/ui/Toolbar/Toolbar.types';
import type { JSXElement } from '@shared/external/vendors';
import type { ToolbarSettingsControllerResult } from '@shared/hooks/toolbar/use-toolbar-settings-controller';
import { useTranslation } from '@shared/hooks/use-translation';
import { EventManager } from '@shared/services/event-manager';
import type { ToolbarState } from '@shared/types/toolbar.types';
import { safeEventPreventAll } from '@shared/utils/events/utils';
import { shouldAllowWheelDefault as shouldAllowWheelDefaultBase } from '@shared/utils/events/wheel-scroll-guard';
import { resolve, resolveOptional } from '@shared/utils/solid/accessor-utils';
import { cx } from '@shared/utils/text/formatting';
import { createEffect, createMemo, createSignal, onCleanup, Show } from 'solid-js';
import styles from './Toolbar.module.css';
import { TweetTextPanel } from './TweetTextPanel';

type ToolbarViewNavState = {
  readonly prevDisabled: boolean;
  readonly nextDisabled: boolean;
  readonly canDownloadAll: boolean;
  readonly downloadDisabled: boolean;
  readonly anyActionDisabled: boolean;
};

type FitModeDefinition = {
  readonly mode: FitMode;
  readonly iconName: LucideIconName;
};

interface ToolbarViewProps {
  /** Current media index */
  readonly currentIndex: MaybeAccessor<number>;
  /** Focused media index for keyboard navigation */
  readonly focusedIndex?: MaybeAccessor<number | null>;
  /** Total number of media items */
  readonly totalCount: MaybeAccessor<number>;
  /** Whether a download is in progress */
  readonly isDownloading?: MaybeAccessor<boolean | undefined>;
  /** Whether toolbar is disabled */
  readonly disabled?: MaybeAccessor<boolean | undefined>;
  /** Current fit mode */
  readonly currentFitMode?: MaybeAccessor<FitMode | undefined>;
  /** Tweet text content */
  readonly tweetText?: MaybeAccessor<string | null | undefined>;
  /** Tweet HTML content */
  readonly tweetTextHTML?: MaybeAccessor<string | null | undefined>;
  /** Tweet URL */
  readonly tweetUrl?: MaybeAccessor<string | null | undefined>;
  /** ARIA label */
  readonly 'aria-label'?: string | undefined;
  /** ARIA describedby */
  readonly 'aria-describedby'?: string | undefined;
  /** ARIA role */
  readonly role?: 'toolbar' | undefined;
  /** Tab index */
  readonly tabIndex?: number | undefined;
  /** Test ID */
  readonly 'data-testid'?: string | undefined;
  /** Toolbar class name generator */
  readonly toolbarClass: () => string;
  /** Toolbar state */
  readonly toolbarState: ToolbarState;
  /** Toolbar data state generator */
  readonly toolbarDataState: () => string;
  /** Navigation state generator */
  readonly navState: () => ToolbarViewNavState;
  /** Displayed index generator */
  readonly displayedIndex: () => number;
  /** Progress width generator */
  readonly progressWidth: () => string;
  /** Fit mode order */
  readonly fitModeOrder: ReadonlyArray<FitModeDefinition>;
  /** Fit mode labels */
  readonly fitModeLabels: MaybeAccessor<Record<FitMode, { label: string; title: string }>>;
  /** Active fit mode generator */
  readonly activeFitMode: () => FitMode;
  /** Fit mode click handler factory */
  readonly handleFitModeClick: (mode: FitMode) => (event: MouseEvent) => void;
  /** Fit mode disabled checker */
  readonly isFitDisabled: (mode: FitMode) => boolean;
  /** Previous click handler */
  readonly onPreviousClick: (event: MouseEvent) => void;
  /** Next click handler */
  readonly onNextClick: (event: MouseEvent) => void;
  /** Download current handler */
  readonly onDownloadCurrent: (event: MouseEvent) => void;
  /** Download all handler */
  readonly onDownloadAll: (event: MouseEvent) => void;
  /** Close click handler */
  readonly onCloseClick: (event: MouseEvent) => void;
  /** Settings controller */
  readonly settingsController: ToolbarSettingsControllerResult;
  /** Whether to show settings button */
  readonly showSettingsButton: boolean;
  /** Tweet panel expanded state */
  readonly isTweetPanelExpanded: () => boolean;
  /** Toggle tweet panel */
  readonly toggleTweetPanelExpanded: () => void;
  /** Focus event handler */
  readonly onFocus?: ((event: FocusEvent) => void) | undefined;
  /** Blur event handler */
  readonly onBlur?: ((event: FocusEvent) => void) | undefined;
}

const SCROLLABLE_SELECTOR = '[data-gallery-scrollable="true"]';
const SCROLL_LOCK_TOLERANCE = 1;

const shouldAllowWheelDefault = (event: WheelEvent): boolean => {
  return shouldAllowWheelDefaultBase(event, {
    scrollableSelector: SCROLLABLE_SELECTOR,
    tolerance: SCROLL_LOCK_TOLERANCE,
  });
};

export function ToolbarView(props: ToolbarViewProps): JSXElement {
  // Resolved values (via createMemo for reactivity)
  const totalCount = () => resolve(props.totalCount);
  const currentIndex = () => resolve(props.currentIndex);
  const isToolbarDisabled = () => !!resolveOptional(props.disabled);
  const activeFitMode = () => props.activeFitMode();
  const tweetText = () => resolveOptional(props.tweetText) ?? null;
  const tweetTextHTML = () => resolveOptional(props.tweetTextHTML) ?? null;
  const tweetUrl = () => resolveOptional(props.tweetUrl) ?? null;

  // Element refs
  const [toolbarElement, setToolbarElement] = createSignal<HTMLDivElement | null>(null);
  const [counterElement, setCounterElement] = createSignal<HTMLSpanElement | null>(null);
  const [settingsPanelEl, setSettingsPanelEl] = createSignal<HTMLDivElement | null>(null);
  const [tweetPanelEl, setTweetPanelEl] = createSignal<HTMLDivElement | null>(null);
  const translate = useTranslation();

  // Memos for derived state
  const nav = createMemo(() => props.navState());
  const fitModeLabels = createMemo(() => resolve(props.fitModeLabels));

  const assignToolbarRef = (element: HTMLDivElement | null) => {
    setToolbarElement(element);
    props.settingsController.assignToolbarRef(element);
  };

  const assignSettingsPanelRef = (element: HTMLDivElement | null) => {
    setSettingsPanelEl(element);
    props.settingsController.assignSettingsPanelRef(element);
  };

  createEffect(() => {
    const toolbar = toolbarElement();
    const counter = counterElement();
    if (!toolbar && !counter) return;

    const current = String(currentIndex());
    const focused = String(props.displayedIndex());

    if (toolbar) {
      toolbar.dataset.currentIndex = current;
      toolbar.dataset.focusedIndex = focused;
    }
    if (counter) {
      counter.dataset.currentIndex = current;
      counter.dataset.focusedIndex = focused;
    }
  });
  const hasTweetContent = () => !!(tweetTextHTML() ?? tweetText() ?? tweetUrl());

  const toolbarButtonClass = (...extra: (string | undefined)[]) =>
    cx(styles.toolbarButton, 'xeg-inline-center', ...extra);

  const toolbarStateClass = () => {
    switch (props.toolbarDataState()) {
      case 'loading':
        return styles.stateLoading;
      case 'downloading':
        return styles.stateDownloading;
      case 'error':
        return styles.stateError;
      default:
        return styles.stateIdle;
    }
  };

  /**
   * Handle wheel events within toolbar panels.
   * - If inside a scrollable element (e.g., tweet text): consume scroll internally, stop propagation
   * - Otherwise: let event propagate to gallery (which may hide toolbar on scroll)
   */
  const handlePanelWheel = (event: WheelEvent) => {
    if (!shouldAllowWheelDefault(event)) return;
    event.stopPropagation();
  };

  /**
   * Prevent scroll chaining from toolbar buttons/controls.
   */
  const preventScrollChaining = (event: WheelEvent) => {
    if (shouldAllowWheelDefault(event)) {
      event.stopPropagation();
      return;
    }
    safeEventPreventAll(event);
  };

  const registerWheelListener = (
    getElement: () => HTMLElement | null,
    handler: (event: WheelEvent) => void,
    options: { readonly passive: boolean; readonly context: string }
  ) => {
    createEffect(() => {
      const element = getElement();
      if (!element) return;

      const controller = new AbortController();
      const eventManager = EventManager.getInstance();
      const listener: EventListener = (event) => handler(event as WheelEvent);

      eventManager.addEventListener(element, 'wheel', listener, {
        passive: options.passive,
        signal: controller.signal,
        context: options.context,
      });

      onCleanup(() => controller.abort());
    });
  };

  // Register wheel event listeners with explicit passive configuration.
  // - passive: false when we may call preventDefault()
  // - passive: true for tweet panel so boundaries can propagate to the gallery
  registerWheelListener(toolbarElement, preventScrollChaining, {
    passive: false,
    context: 'toolbar:wheel:prevent-scroll-chaining',
  });
  registerWheelListener(settingsPanelEl, preventScrollChaining, {
    passive: false,
    context: 'toolbar:wheel:prevent-scroll-chaining:settings-panel',
  });
  registerWheelListener(tweetPanelEl, handlePanelWheel, {
    passive: true,
    context: 'toolbar:wheel:panel',
  });

  return (
    <div
      ref={assignToolbarRef}
      class={cx(
        props.toolbarClass(),
        toolbarStateClass(),
        props.settingsController.isSettingsExpanded() ? styles.settingsExpanded : undefined,
        props.isTweetPanelExpanded() ? styles.tweetPanelExpanded : undefined
      )}
      role={props.role ?? 'toolbar'}
      aria-label={props['aria-label'] ?? 'Gallery Toolbar'}
      aria-describedby={props['aria-describedby']}
      aria-disabled={isToolbarDisabled()}
      data-testid={__DEV__ ? props['data-testid'] : undefined}
      data-gallery-element="toolbar"
      tabIndex={props.tabIndex}
      onFocus={props.onFocus as ((event: FocusEvent) => void) | undefined}
      onBlur={props.onBlur as ((event: FocusEvent) => void) | undefined}
      onKeyDown={(event) => props.settingsController.handleToolbarKeyDown(event)}
    >
      <div class={cx(styles.toolbarContent, 'xeg-row-center')}>
        <div class={styles.toolbarControls}>
          <IconButton
            class={toolbarButtonClass()}
            size="toolbar"
            aria-label={translate('tb.prev')}
            title={translate('tb.prev')}
            disabled={nav().prevDisabled}
            onClick={props.onPreviousClick}
          >
            <LucideIcon name="chevron-left" size={18} />
          </IconButton>

          <IconButton
            class={toolbarButtonClass()}
            size="toolbar"
            aria-label={translate('tb.next')}
            title={translate('tb.next')}
            disabled={nav().nextDisabled}
            onClick={props.onNextClick}
          >
            <LucideIcon name="chevron-right" size={18} />
          </IconButton>

          <div class={styles.counterBlock}>
            <div class={cx(styles.mediaCounterWrapper, 'xeg-inline-center')}>
              <span
                ref={(element) => {
                  setCounterElement(element);
                }}
                class={cx(styles.mediaCounter, 'xeg-inline-center')}
                aria-live="polite"
              >
                <span class={styles.currentIndex}>{props.displayedIndex() + 1}</span>
                <span class={styles.separator}>/</span>
                <span class={styles.totalCount}>{totalCount()}</span>
              </span>
              <div class={styles.progressBar}>
                <div class={styles.progressFill} style={{ width: props.progressWidth() }} />
              </div>
            </div>
          </div>

          {props.fitModeOrder.map(({ mode, iconName }) => {
            const label = fitModeLabels()[mode];
            return (
              <IconButton
                class={toolbarButtonClass(styles.fitButton)}
                size="toolbar"
                onClick={props.handleFitModeClick(mode)}
                disabled={props.isFitDisabled(mode)}
                aria-label={label.label}
                title={label.title}
                aria-pressed={activeFitMode() === mode}
              >
                <LucideIcon name={iconName} size={18} />
              </IconButton>
            );
          })}

          <IconButton
            class={toolbarButtonClass(styles.downloadButton, styles.downloadCurrent)}
            size="toolbar"
            onClick={props.onDownloadCurrent}
            disabled={nav().downloadDisabled}
            aria-label={translate('tb.dl')}
            title={translate('tb.dl')}
          >
            <LucideIcon name="download" size={18} />
          </IconButton>

          {nav().canDownloadAll && (
            <IconButton
              class={toolbarButtonClass(styles.downloadButton, styles.downloadAll)}
              size="toolbar"
              onClick={props.onDownloadAll}
              disabled={nav().downloadDisabled}
              aria-label={translate('tb.dlAllCt', { count: totalCount() })}
              title={translate('tb.dlAllCt', { count: totalCount() })}
            >
              <LucideIcon name="folder-down" size={18} />
            </IconButton>
          )}

          {props.showSettingsButton && (
            <IconButton
              ref={props.settingsController.assignSettingsButtonRef}
              id="settings-button"
              class={toolbarButtonClass()}
              size="toolbar"
              aria-label={translate('tb.setOpen')}
              aria-expanded={props.settingsController.isSettingsExpanded() ? 'true' : 'false'}
              aria-controls="toolbar-settings-panel"
              title={translate('tb.setOpen')}
              disabled={isToolbarDisabled()}
              onMouseDown={props.settingsController.handleSettingsMouseDown}
              onClick={props.settingsController.handleSettingsClick}
            >
              <LucideIcon name="settings-2" size={18} />
            </IconButton>
          )}

          {hasTweetContent() && (
            <IconButton
              id="tweet-text-button"
              class={toolbarButtonClass()}
              size="toolbar"
              aria-label={translate('tb.twTxt')}
              aria-expanded={props.isTweetPanelExpanded() ? 'true' : 'false'}
              aria-controls="toolbar-tweet-panel"
              title={translate('tb.twTxt')}
              disabled={isToolbarDisabled()}
              onClick={props.toggleTweetPanelExpanded}
            >
              <LucideIcon name="messages-square" size={18} />
            </IconButton>
          )}

          <IconButton
            class={toolbarButtonClass(styles.closeButton)}
            size="toolbar"
            aria-label={translate('tb.cls')}
            title={translate('tb.cls')}
            disabled={isToolbarDisabled()}
            onClick={props.onCloseClick}
          >
            <LucideIcon name="x" size={18} />
          </IconButton>
        </div>
      </div>

      <div
        ref={assignSettingsPanelRef}
        id="toolbar-settings-panel"
        class={cx(
          styles.settingsPanel,
          props.settingsController.isSettingsExpanded() ? styles.panelExpanded : undefined
        )}
        data-gallery-scrollable="true"
        onMouseDown={props.settingsController.handlePanelMouseDown}
        role="region"
        aria-label="Settings Panel"
        aria-labelledby="settings-button"
        data-gallery-element="settings-panel"
        onClick={props.settingsController.handlePanelClick}
      >
        <Show when={props.settingsController.isSettingsExpanded()}>
          <SettingsControls
            currentTheme={props.settingsController.currentTheme}
            currentLanguage={props.settingsController.currentLanguage}
            onThemeChange={props.settingsController.handleThemeChange}
            onLanguageChange={props.settingsController.handleLanguageChange}
            compact
            data-testid={__DEV__ ? 'settings-controls' : undefined}
          />
        </Show>
      </div>

      <div
        ref={setTweetPanelEl}
        id="toolbar-tweet-panel"
        class={cx(
          styles.tweetPanel,
          props.isTweetPanelExpanded() ? styles.panelExpanded : undefined
        )}
        role="region"
        aria-label={translate('tb.twPanel')}
        aria-labelledby="tweet-text-button"
        data-gallery-element="tweet-panel"
      >
        <Show when={props.isTweetPanelExpanded() && hasTweetContent()}>
          <TweetTextPanel
            tweetText={tweetText() ?? undefined}
            tweetTextHTML={tweetTextHTML() ?? undefined}
            tweetUrl={tweetUrl() ?? undefined}
          />
        </Show>
      </div>
    </div>
  );
}
