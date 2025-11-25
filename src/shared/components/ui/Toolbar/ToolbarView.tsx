import { IconButton } from '@shared/components/ui/Button/IconButton';
import {
  ArrowDownOnSquareStack,
  ArrowDownTray,
  ArrowLeftOnRectangle,
  ArrowSmallLeft,
  ArrowSmallRight,
  ChatBubbleLeftRight,
  Cog6Tooth,
} from '@shared/components/ui/Icon';
import { SettingsControlsLazy } from '@shared/components/ui/Settings/SettingsControlsLazy';
import type {
  FitMode,
  MaybeAccessor,
  ToolbarProps,
} from '@shared/components/ui/Toolbar/Toolbar.types';
import { getLanguageService } from '@shared/container/service-accessors';
import type { JSXElement } from '@shared/external/vendors';
import { getSolid } from '@shared/external/vendors';
import type { ToolbarSettingsControllerResult, ToolbarState } from '@shared/hooks';
import { safeEventPreventAll } from '@shared/utils/events/utils';
import { createClassName } from '@shared/utils/text/formatting';
import styles from './Toolbar.module.css';

const solid = getSolid();
const { Show, createMemo, createSignal, createEffect, lazy, Suspense } = solid;

const TweetTextPanelLazy = lazy(() => import('./TweetTextPanel'));

const resolveAccessorValue = <T,>(value: MaybeAccessor<T>): T =>
  typeof value === 'function' ? (value as () => T)() : value;

const resolveOptionalAccessorValue = <T,>(value?: MaybeAccessor<T>): T | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return resolveAccessorValue(value);
};

type ToolbarViewNavState = {
  readonly prevDisabled: boolean;
  readonly nextDisabled: boolean;
  readonly canDownloadAll: boolean;
  readonly downloadDisabled: boolean;
  readonly anyActionDisabled: boolean;
};

type FitModeDefinition = {
  readonly mode: FitMode;
  readonly Icon: (props: { size?: number }) => JSXElement;
};

type ToolbarViewBaseProps = Omit<
  ToolbarProps,
  | 'onPrevious'
  | 'onNext'
  | 'onDownloadCurrent'
  | 'onDownloadAll'
  | 'onClose'
  | 'onOpenSettings'
  | 'onFitOriginal'
  | 'onFitWidth'
  | 'onFitHeight'
  | 'onFitContainer'
>;

export interface ToolbarViewProps extends ToolbarViewBaseProps {
  readonly toolbarClass: () => string;
  readonly toolbarState: ToolbarState;
  readonly toolbarDataState: () => string;
  readonly navState: () => ToolbarViewNavState;
  readonly displayedIndex: () => number;
  readonly progressWidth: () => string;
  readonly fitModeOrder: ReadonlyArray<FitModeDefinition>;
  readonly fitModeLabels: Record<FitMode, { label: string; title: string }>;
  readonly activeFitMode: () => FitMode;
  readonly handleFitModeClick: (mode: FitMode) => (event: MouseEvent) => void;
  readonly isFitDisabled: (mode: FitMode) => boolean;
  readonly onPreviousClick: (event: MouseEvent) => void;
  readonly onNextClick: (event: MouseEvent) => void;
  readonly onDownloadCurrent: (event: MouseEvent) => void;
  readonly onDownloadAll: (event: MouseEvent) => void;
  readonly onCloseClick: (event: MouseEvent) => void;
  readonly settingsController: ToolbarSettingsControllerResult;
  readonly showSettingsButton: boolean;
  readonly isTweetPanelExpanded: () => boolean;
  readonly toggleTweetPanelExpanded: () => void;
}

const SCROLLABLE_SELECTOR = '[data-gallery-scrollable="true"]';
const SCROLL_LOCK_TOLERANCE = 1;

const findScrollableAncestor = (target: EventTarget | null): HTMLElement | null => {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  return target.closest<HTMLElement>(SCROLLABLE_SELECTOR);
};

const canConsumeWheelEvent = (element: HTMLElement, deltaY: number): boolean => {
  const overflow = element.scrollHeight - element.clientHeight;

  if (overflow <= SCROLL_LOCK_TOLERANCE) {
    return false;
  }

  if (deltaY < 0) {
    return element.scrollTop > SCROLL_LOCK_TOLERANCE;
  }

  if (deltaY > 0) {
    const maxScrollTop = overflow;
    return element.scrollTop < maxScrollTop - SCROLL_LOCK_TOLERANCE;
  }

  return true;
};

const shouldAllowWheelDefault = (event: WheelEvent): boolean => {
  const scrollable = findScrollableAncestor(event.target);
  if (!scrollable) {
    return false;
  }

  return canConsumeWheelEvent(scrollable, event.deltaY);
};

export function ToolbarView(props: ToolbarViewProps): JSXElement {
  const totalCount = createMemo(() => resolveAccessorValue(props.totalCount));
  const currentIndex = createMemo(() => resolveAccessorValue(props.currentIndex));
  const displayedIndex = createMemo(() => props.displayedIndex());
  const isToolbarDisabled = createMemo(() => Boolean(resolveOptionalAccessorValue(props.disabled)));
  const activeFitMode = createMemo(() => props.activeFitMode());
  const tweetText = createMemo(() => resolveOptionalAccessorValue(props.tweetText) ?? null);
  const tweetTextHTML = createMemo(() => resolveOptionalAccessorValue(props.tweetTextHTML) ?? null);
  const [toolbarElement, setToolbarElement] = createSignal<HTMLDivElement | null>(null);
  const [counterElement, setCounterElement] = createSignal<HTMLSpanElement | null>(null);

  // Phase 430: Wrap navState properties in createMemo for reactivity
  // This ensures button states update when props.navState() changes
  const prevDisabled = createMemo(() => props.navState().prevDisabled);
  const nextDisabled = createMemo(() => props.navState().nextDisabled);
  const downloadDisabled = createMemo(() => props.navState().downloadDisabled);
  const canDownloadAll = createMemo(() => props.navState().canDownloadAll);
  const anyActionDisabled = createMemo(() => props.navState().anyActionDisabled);

  const assignToolbarRef = (element: HTMLDivElement | null) => {
    setToolbarElement(element);
    props.settingsController.assignToolbarRef(element);
  };

  createEffect(() => {
    const element = toolbarElement();
    if (!element) {
      return;
    }
    element.dataset.currentIndex = String(currentIndex());
    element.dataset.focusedIndex = String(displayedIndex());
  });

  createEffect(() => {
    const element = counterElement();
    if (!element) {
      return;
    }
    element.dataset.currentIndex = String(currentIndex());
    element.dataset.focusedIndex = String(displayedIndex());
  });
  const hasTweetContent = () => Boolean(tweetTextHTML() ?? tweetText());
  const toolbarButtonClass = (...extra: Array<string | undefined>) =>
    createClassName(styles.toolbarButton, 'xeg-inline-center', ...extra);

  const preventScrollChaining = (event: WheelEvent) => {
    if (shouldAllowWheelDefault(event)) {
      return;
    }

    safeEventPreventAll(event);
  };

  return (
    <div
      ref={assignToolbarRef}
      class={props.toolbarClass()}
      role={props.role ?? 'toolbar'}
      aria-label={props['aria-label'] ?? '갤러리 도구모음'}
      aria-describedby={props['aria-describedby']}
      aria-disabled={isToolbarDisabled()}
      data-testid={props['data-testid']}
      data-gallery-element="toolbar"
      data-state={props.toolbarDataState()}
      data-disabled={isToolbarDisabled()}
      data-settings-expanded={props.settingsController.isSettingsExpanded()}
      data-tweet-panel-expanded={props.isTweetPanelExpanded()}
      data-focused-index={displayedIndex()}
      data-current-index={currentIndex()}
      tabIndex={props.tabIndex}
      onFocus={props.onFocus as ((event: FocusEvent) => void) | undefined}
      onBlur={props.onBlur as ((event: FocusEvent) => void) | undefined}
      onKeyDown={
        props.settingsController.handleToolbarKeyDown as unknown as
          | ((event: KeyboardEvent) => void)
          | undefined
      }
      onWheel={preventScrollChaining as unknown as (event: WheelEvent) => void}
    >
      <div class={`${styles.toolbarContent} xeg-row-center`} data-gallery-element="toolbar-content">
        <div class={styles.toolbarControls} data-gallery-element="toolbar-controls">
          <IconButton
            class={toolbarButtonClass()}
            size="toolbar"
            aria-label="이전 미디어"
            title="이전 미디어 (←)"
            disabled={prevDisabled()}
            onClick={props.onPreviousClick}
            data-gallery-element="nav-previous"
            data-disabled={prevDisabled()}
            data-action-disabled={anyActionDisabled()}
          >
            <ArrowSmallLeft size={18} />
          </IconButton>

          <IconButton
            class={toolbarButtonClass()}
            size="toolbar"
            aria-label="다음 미디어"
            title="다음 미디어 (→)"
            disabled={nextDisabled()}
            onClick={props.onNextClick}
            data-gallery-element="nav-next"
            data-disabled={nextDisabled()}
            data-action-disabled={anyActionDisabled()}
          >
            <ArrowSmallRight size={18} />
          </IconButton>

          <div class={styles.counterBlock} data-gallery-element="counter-section">
            <div class={createClassName(styles.mediaCounterWrapper, 'xeg-inline-center')}>
              <span
                ref={element => {
                  setCounterElement(element);
                }}
                class={createClassName(styles.mediaCounter, 'xeg-inline-center')}
                aria-live="polite"
                data-gallery-element="counter"
                data-focused-index={displayedIndex()}
                data-current-index={currentIndex()}
              >
                <span class={styles.currentIndex}>{displayedIndex() + 1}</span>
                <span class={styles.separator}>/</span>
                <span class={styles.totalCount}>{totalCount()}</span>
              </span>
              <div class={styles.progressBar}>
                <div class={styles.progressFill} style={{ width: props.progressWidth() }} />
              </div>
            </div>
          </div>

          {props.fitModeOrder.map(({ mode, Icon }) => {
            const label = props.fitModeLabels[mode];
            return (
              <IconButton
                class={toolbarButtonClass(styles.fitButton)}
                size="toolbar"
                onClick={props.handleFitModeClick(mode)}
                disabled={props.isFitDisabled(mode)}
                aria-label={label.label}
                title={label.title}
                data-gallery-element={`fit-${mode}`}
                data-selected={activeFitMode() === mode}
                data-disabled={props.isFitDisabled(mode)}
              >
                <Icon size={18} />
              </IconButton>
            );
          })}

          <IconButton
            class={toolbarButtonClass(styles.downloadButton, styles.downloadCurrent)}
            size="toolbar"
            onClick={props.onDownloadCurrent}
            disabled={downloadDisabled()}
            aria-label="현재 파일 다운로드"
            title="현재 파일 다운로드 (Ctrl+D)"
            data-gallery-element="download-current"
            data-disabled={downloadDisabled()}
            data-action-disabled={anyActionDisabled()}
          >
            <ArrowDownTray size={18} />
          </IconButton>

          {canDownloadAll() && (
            <IconButton
              class={toolbarButtonClass(styles.downloadButton, styles.downloadAll)}
              size="toolbar"
              onClick={props.onDownloadAll}
              disabled={downloadDisabled()}
              aria-label={`전체 ${totalCount()}개 파일 ZIP 다운로드`}
              title={`전체 ${totalCount()}개 파일 ZIP 다운로드`}
              data-gallery-element="download-all"
              data-disabled={downloadDisabled()}
              data-action-disabled={anyActionDisabled()}
            >
              <ArrowDownOnSquareStack size={18} />
            </IconButton>
          )}

          {props.showSettingsButton && (
            <IconButton
              ref={props.settingsController.assignSettingsButtonRef}
              id="settings-button"
              class={toolbarButtonClass()}
              size="toolbar"
              aria-label="설정 열기"
              aria-expanded={props.settingsController.isSettingsExpanded() ? 'true' : 'false'}
              aria-controls="toolbar-settings-panel"
              title="설정"
              disabled={isToolbarDisabled()}
              onMouseDown={props.settingsController.handleSettingsMouseDown}
              onClick={props.settingsController.handleSettingsClick}
              data-gallery-element="settings"
              data-disabled={isToolbarDisabled()}
            >
              <Cog6Tooth size={18} />
            </IconButton>
          )}

          {hasTweetContent() && (
            <IconButton
              id="tweet-text-button"
              class={toolbarButtonClass()}
              size="toolbar"
              aria-label={getLanguageService().translate('toolbar.tweetText') || 'View tweet text'}
              aria-expanded={props.isTweetPanelExpanded() ? 'true' : 'false'}
              aria-controls="toolbar-tweet-panel"
              title={getLanguageService().translate('toolbar.tweetText') || 'Tweet text'}
              disabled={isToolbarDisabled()}
              onClick={props.toggleTweetPanelExpanded}
              data-gallery-element="tweet-text"
              data-disabled={isToolbarDisabled()}
            >
              <ChatBubbleLeftRight size={18} />
            </IconButton>
          )}

          <IconButton
            class={toolbarButtonClass(styles.closeButton)}
            size="toolbar"
            intent="danger"
            aria-label="갤러리 닫기"
            title="갤러리 닫기 (Esc)"
            disabled={isToolbarDisabled()}
            onClick={props.onCloseClick}
            data-gallery-element="close"
            data-disabled={isToolbarDisabled()}
          >
            <ArrowLeftOnRectangle size={18} />
          </IconButton>
        </div>
      </div>

      <div
        ref={props.settingsController.assignSettingsPanelRef}
        id="toolbar-settings-panel"
        class={styles.settingsPanel}
        data-expanded={props.settingsController.isSettingsExpanded()}
        data-gallery-scrollable="true"
        onMouseDown={props.settingsController.handlePanelMouseDown}
        role="region"
        aria-label="설정 패널"
        aria-labelledby="settings-button"
        data-gallery-element="settings-panel"
        onClick={props.settingsController.handlePanelClick}
        onWheel={preventScrollChaining as unknown as (event: WheelEvent) => void}
      >
        <Show when={props.settingsController.isSettingsExpanded()}>
          <SettingsControlsLazy
            currentTheme={props.settingsController.currentTheme}
            currentLanguage={props.settingsController.currentLanguage}
            onThemeChange={props.settingsController.handleThemeChange}
            onLanguageChange={props.settingsController.handleLanguageChange}
            compact
            data-testid="settings-controls"
          />
        </Show>
      </div>

      <div
        id="toolbar-tweet-panel"
        class={styles.tweetPanel}
        data-expanded={props.isTweetPanelExpanded()}
        role="region"
        aria-label={getLanguageService().translate('toolbar.tweetTextPanel') || 'Tweet text panel'}
        aria-labelledby="tweet-text-button"
        data-gallery-element="tweet-panel"
        onWheel={preventScrollChaining as unknown as (event: WheelEvent) => void}
      >
        <Show when={props.isTweetPanelExpanded() && hasTweetContent()}>
          <Suspense fallback={<div class={styles.tweetPanelLoading}>Loading...</div>}>
            <TweetTextPanelLazy
              tweetText={tweetText() ?? undefined}
              tweetTextHTML={tweetTextHTML() ?? undefined}
            />
          </Suspense>
        </Show>
      </div>
    </div>
  );
}
