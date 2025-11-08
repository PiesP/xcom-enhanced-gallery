/**
 * @fileoverview Toolbar Presentational Component (View)
 * @description Pure presentational component rendering complete toolbar UI
 *
 * @architecture
 * Split from ToolbarContainer to isolate rendering logic and improve testability.
 * All state and callbacks injected via props (container/presentational pattern).
 *
 * ## Layout Structure
 * - **Left Section**: Previous/Next navigation buttons
 * - **Center Section**: Media counter + progress bar (aria-live region)
 * - **Right Section**: Fit modes, downloads, settings, tweet, close buttons
 * - **Settings Panel**: Expandable theme/language controls (below toolbar)
 * - **Tweet Panel**: Expandable tweet text display with formatted links
 *
 * ## Key Features
 * - **No Local State**: All behavior via props from container (pure function)
 * - **Accessibility**: Full ARIA support (aria-live, aria-expanded, aria-label)
 * - **Responsive**: Sections collapse/expand based on toolbar state
 * - **Interactive Panels**: Settings and tweet panels mutually exclusive
 *
 * ## Rendering
 * - Navigation: Previous/Next buttons (disabled based on position)
 * - Counter: Displays (currentIndex + 1) / totalCount with live region updates
 * - Progress: Bar width = (currentIndex + 1) / totalCount * 100%
 * - Fit Modes: Maps over fitModeOrder array with icon mapping
 * - Downloads: Single always visible; bulk ZIP if totalCount > 1
 * - Settings: Only rendered if showSettingsButton true
 * - Tweet: Only rendered if tweetText provided; HTML or text fallback
 *
 * @performance
 * - **Fine-grain Reactivity**: Props not destructured (Solid.js optimization)
 * - **Lazy Rendering**: solid.Show for conditional sections (panels)
 * - **For Loops**: solid.For for fit mode buttons (efficient array rendering)
 * - **Memoized Callbacks**: All handlers pre-memoized from parent
 *
 * @dependencies
 * - Solid.js: getSolid(), Show, For, Switch, Match components
 * - Icons: ArrowSmallLeft, ArrowSmallRight, ArrowDownTray, ArrowDownOnSquareStack, Cog6Tooth, ArrowLeftOnRectangle, ChatBubbleLeftRight
 * - Components: IconButton (basic), SettingsControlsLazy (lazy loaded)
 * - Services: languageService for i18n strings
 * - Utils: formatTweetText, shortenUrl for tweet formatting
 * - Styling: Toolbar.module.css (CSS Modules with state selectors)
 *
 * @example
 * ```typescript
 * // Usage from ToolbarContainer
 * <ToolbarView
 *   currentIndex={currentIndex()}
 *   totalCount={totalCount()}
 *   toolbarClass={toolbarClass}
 *   toolbarState={toolbarState()}
 *   toolbarDataState={() => {
 *     if (downloading) return 'downloading';
 *     if (error) return 'error';
 *     return 'idle';
 *   }}
 *   navState={navState}
 *   displayedIndex={displayedIndex}
 *   progressWidth={progressWidth}
 *   fitModeOrder={FIT_MODE_ORDER}
 *   fitModeLabels={fitModeLabels}
 *   handleFitModeClick={handleFitModeClick}
 *   isFitDisabled={(mode) => disabled() || !onFitModeChange}
 *   onPreviousClick={onPreviousClick}
 *   onNextClick={onNextClick}
 *   onDownloadCurrent={onDownloadCurrent}
 *   onDownloadAll={onDownloadAll}
 *   onCloseClick={onCloseClick}
 *   settingsController={settingsController}
 *   showSettingsButton={!!onOpenSettings}
 *   isTweetPanelExpanded={isTweetPanelExpanded}
 *   toggleTweetPanelExpanded={toggleTweetPanelExpanded}
 *   tweetText={tweetContent()?.text}
 *   tweetTextHTML={tweetContent()?.html}
 * />
 * ```
 *
 * @notes
 * - Phase 87: Props accessed directly (no destructuring) for fine-grain Solid.js reactivity
 * - Settings/tweet panels managed by container (mutually exclusive)
 * - Tweet uses HTML rendering if available, falls back to formatted text nodes
 * - All strings Korean localization (TODO: integrate i18n service in Phase X)
 * - Data attributes (data-*) used for testing and CSS state selectors
 */

import type { JSXElement } from '../../../external/vendors';
import { getSolid } from '../../../external/vendors';
import { IconButton } from '../Button/IconButton';
import {
  ArrowSmallLeft,
  ArrowSmallRight,
  ArrowDownTray,
  ArrowDownOnSquareStack,
  Cog6Tooth,
  ArrowLeftOnRectangle,
  ChatBubbleLeftRight,
} from '../Icon';
import { SettingsControlsLazy } from '../Settings/SettingsControlsLazy';
import { formatTweetText, shortenUrl } from '@shared/utils/text-formatting';
import { languageService } from '@shared/services/language-service';
import styles from './Toolbar.module.css';
import type { ToolbarProps, FitMode } from './Toolbar.types';
import type { ToolbarState } from '../../../hooks/use-toolbar-state';
import type { ToolbarSettingsControllerResult } from '../../../hooks/toolbar/use-toolbar-settings-controller';

/** @type ThemeOption - Available theme options for settings controls */
type ThemeOption = 'auto' | 'light' | 'dark';

/** @type LanguageOption - Available language options for settings controls */
type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

/**
 * @type ToolbarViewNavState
 * @description Navigation state determining button disable states
 * @property prevDisabled - Previous button disabled
 * @property nextDisabled - Next button disabled
 * @property canDownloadAll - Bulk download button visibility
 * @property downloadDisabled - Download button disabled
 * @property anyActionDisabled - Derived flag indicating any primary action is disabled
 */
type ToolbarViewNavState = {
  readonly prevDisabled: boolean;
  readonly nextDisabled: boolean;
  readonly canDownloadAll: boolean;
  readonly downloadDisabled: boolean;
  readonly anyActionDisabled: boolean;
};

type TweetAnchorType = 'url' | 'mention' | 'hashtag' | 'cashtag';

function renderTweetAnchor(
  tokenAccessor: () => { content: string; href: string },
  anchorType: TweetAnchorType,
  displayOverride?: string
): JSXElement {
  const token = tokenAccessor();

  return (
    <a
      href={token.href}
      target='_blank'
      rel='noopener noreferrer'
      class={styles.tweetLink}
      data-token-type={anchorType}
      title={anchorType === 'url' ? token.href : token.content}
    >
      {displayOverride ?? token.content}
    </a>
  );
}

/**
 * @type FitModeLabel
 * @description Localized fit mode button label
 * @property label - Aria-label string
 * @property title - Tooltip title
 */
type FitModeLabel = {
  readonly label: string;
  readonly title: string;
};

/**
 * @type FitModeDefinition
 * @description Fit mode with icon component
 * @property mode - Fit mode identifier
 * @property Icon - Icon component factory
 */
type FitModeDefinition = {
  readonly mode: FitMode;
  readonly Icon: (props: { size?: number }) => JSXElement;
};

/**
 * @type ToolbarViewBaseProps
 * @description Base toolbar props excluding event callbacks
 */
type ToolbarViewBaseProps = Omit<
  ToolbarProps,
  'onPrevious' | 'onNext' | 'onDownloadCurrent' | 'onDownloadAll' | 'onClose' | 'onOpenSettings'
>;

/**
 * @interface ToolbarViewProps
 * @description Complete props for ToolbarView presentational component
 *
 * Extends base props with:
 * - Reactive prop functions (signals/memos for reactivity)
 * - Event handler callbacks (pre-memoized)
 * - State controllers and configuration
 *
 * @section Reactive Props
 * Properties that are functions returning dynamic values (Solid.js signals/memos)
 *
 * @section Handlers
 * Pre-memoized callback functions from ToolbarContainer
 */

export interface ToolbarViewProps extends ToolbarViewBaseProps {
  // Reactive Props: Solid.js signals/memos returning dynamic values
  /** @prop Reactive CSS class selector for root toolbar element */
  readonly toolbarClass: () => string;

  /** @prop Current toolbar state (downloading, error, highContrast, currentFitMode) */
  readonly toolbarState: ToolbarState;

  /** @prop Reactive data-state attribute: 'idle' | 'loading' | 'downloading' | 'error' */
  readonly toolbarDataState: () => string;

  /** @prop Reactive navigation button disable states */
  readonly navState: () => ToolbarViewNavState;

  /** @prop Reactive display index (0-based) for media counter */
  readonly displayedIndex: () => number;

  /** @prop Reactive progress bar width percentage (0-100%) */
  readonly progressWidth: () => string;

  /** @prop Ordered fit mode definitions for button rendering */
  readonly fitModeOrder: ReadonlyArray<FitModeDefinition>;

  /** @prop Fit mode localized labels (aria-label and title strings) */
  readonly fitModeLabels: Record<FitMode, FitModeLabel>;

  /** @prop Factory function returning click handler for specified fit mode */
  readonly handleFitModeClick: (mode: FitMode) => (event: MouseEvent) => void;

  /** @prop Check if fit mode button should be disabled */
  readonly isFitDisabled: (mode: FitMode) => boolean;

  // Event Handlers: Pre-memoized callbacks from ToolbarContainer
  /** @handler Memoized callback for previous navigation button click */
  readonly onPreviousClick: (event: MouseEvent) => void;

  /** @handler Memoized callback for next navigation button click */
  readonly onNextClick: (event: MouseEvent) => void;

  /** @handler Memoized callback for single file download button */
  readonly onDownloadCurrent: (event: MouseEvent) => void;

  /** @handler Memoized callback for bulk ZIP download button */
  readonly onDownloadAll: (event: MouseEvent) => void;

  /** @handler Memoized callback for close button click */
  readonly onCloseClick: (event: MouseEvent) => void;

  // State Controllers & Config
  /** @controller Settings panel controller (ref management, state, event handlers) */
  readonly settingsController: ToolbarSettingsControllerResult;

  /** @prop Whether to render the settings button (depends on onOpenSettings) */
  readonly showSettingsButton: boolean;

  /** @prop Reactive tweet panel expanded state */
  readonly isTweetPanelExpanded: () => boolean;

  /** @handler Toggle tweet panel expanded state */
  readonly toggleTweetPanelExpanded: () => void;

  /** @prop Plain text of tweet content (fallback if HTML not available) */
  readonly tweetText?: string | undefined;

  /** @prop Sanitized HTML of tweet content (preferred over tweetText) */
  readonly tweetTextHTML?: string | undefined;
}

/**
 * @function ToolbarView
 * @description Pure presentational component rendering complete toolbar UI
 * All behavior controlled via injected props from ToolbarContainer
 *
 * @param props - ToolbarViewProps containing all display data and callbacks
 * @returns JSXElement - Complete toolbar DOM structure with nested panels
 *
 * @renderingFlow
 * 1. Toolbar root element with ARIA attributes and data-* state selectors
 * 2. Toolbar content wrapper: 3 horizontal sections (left/center/right)
 * 3. Left section: navigation buttons (previous/next)
 * 4. Center section: media counter + progress bar (aria-live region)
 * 5. Right section: fit modes, downloads, settings, tweet, close buttons
 * 6. Settings panel: expandable SettingsControlsLazy (theme/language)
 * 7. Tweet panel: expandable tweet text with HTML or formatted text
 *
 * @accessibility
 * - Root element: role="toolbar", aria-label, aria-disabled, aria-describedby
 * - Counter: aria-live="polite" for announcement of media changes
 * - Buttons: aria-label for descriptive text, title for tooltips
 * - Settings/Tweet: aria-expanded to indicate expand state
 * - Expandable buttons: aria-controls pointing to target panels
 * - Keyboard navigation: managed by settingsController.handleToolbarKeyDown
 *
 * @reactivityPattern
 * - Phase 87: Props accessed directly (not destructured) for fine-grain reactivity
 * - Solid.js Show/For/Switch for conditional/list rendering
 * - createMemo values (toolbarClass, displayedIndex, etc) trigger updates
 * - Data attributes sync with reactive values via signals
 *
 * @performance
 * - No internal state (all via props)
 * - Lazy loading: SettingsControlsLazy only loaded when settings expanded
 * - Memoized callbacks prevent unnecessary event handler creation
 * - CSS Modules for scoped styling (no global pollution)
 */
export function ToolbarView(props: ToolbarViewProps): JSXElement {
  const solid = getSolid();

  /**
   * @memo isToolbarDisabled
   * Checked directly from props each time to enable fine-grain reactivity.
   * Prevents reactivity loss through state variables (Phase 87 pattern).
   */
  const isToolbarDisabled = () => Boolean(props.disabled);

  /**
   * @memo isDownloading
   * Track download state for loading spinner animation.
   * Updated via props from container when download operation progresses.
   */
  const isDownloading = () => Boolean(props.isDownloading);

  return (
    <div
      ref={props.settingsController.assignToolbarRef}
      class={props.toolbarClass()}
      role={props.role ?? 'toolbar'}
      aria-label={props['aria-label'] ?? '갤러리 도구모음'}
      aria-describedby={props['aria-describedby']}
      aria-disabled={isToolbarDisabled()}
      data-testid={props['data-testid']}
      data-gallery-element='toolbar'
      data-state={props.toolbarDataState()}
      data-disabled={isToolbarDisabled()}
      data-high-contrast={props.toolbarState.needsHighContrast}
      data-settings-expanded={props.settingsController.isSettingsExpanded()}
      data-tweet-panel-expanded={props.isTweetPanelExpanded()}
      data-focused-index={String(props.displayedIndex())}
      data-current-index={String(props.currentIndex)}
      tabIndex={props.tabIndex}
      onFocus={props.onFocus as ((event: FocusEvent) => void) | undefined}
      onBlur={props.onBlur as ((event: FocusEvent) => void) | undefined}
      onKeyDown={
        props.settingsController.handleToolbarKeyDown as unknown as
          | ((event: Event) => void)
          | undefined
      }
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
            disabled={props.navState().prevDisabled}
            onClick={props.onPreviousClick}
            data-gallery-element='nav-previous'
            data-disabled={props.navState().prevDisabled}
            data-action-disabled={props.navState().anyActionDisabled}
          >
            <ArrowSmallLeft size={18} />
          </IconButton>

          <IconButton
            size='toolbar'
            aria-label='다음 미디어'
            title='다음 미디어 (→)'
            disabled={props.navState().nextDisabled}
            onClick={props.onNextClick}
            data-gallery-element='nav-next'
            data-disabled={props.navState().nextDisabled}
            data-action-disabled={props.navState().anyActionDisabled}
          >
            <ArrowSmallRight size={18} />
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
              data-focused-index={String(props.displayedIndex())}
              data-current-index={String(props.currentIndex)}
            >
              <span class={styles.currentIndex}>{props.displayedIndex() + 1}</span>
              <span class={styles.separator}>/</span>
              <span class={styles.totalCount}>{props.totalCount}</span>
            </span>
            <div class={styles.progressBar}>
              <div class={styles.progressFill} style={{ width: props.progressWidth() }} />
            </div>
          </div>
        </div>

        <div
          class={`${styles.toolbarSection} ${styles.toolbarRight} xeg-row-center xeg-gap-sm`}
          data-gallery-element='actions-right'
        >
          {props.fitModeOrder.map(({ mode, Icon }) => {
            const label = props.fitModeLabels[mode];
            return (
              <IconButton
                size='toolbar'
                onClick={props.handleFitModeClick(mode)}
                disabled={props.isFitDisabled(mode)}
                aria-label={label.label}
                title={label.title}
                data-gallery-element={`fit-${mode}`}
                data-selected={props.toolbarState.currentFitMode === mode}
                data-disabled={props.isFitDisabled(mode)}
              >
                <Icon size={18} />
              </IconButton>
            );
          })}

          <IconButton
            size='toolbar'
            loading={isDownloading()}
            onClick={props.onDownloadCurrent}
            disabled={props.navState().downloadDisabled}
            aria-label='현재 파일 다운로드'
            title='현재 파일 다운로드 (Ctrl+D)'
            data-gallery-element='download-current'
            data-disabled={props.navState().downloadDisabled}
            data-action-disabled={props.navState().anyActionDisabled}
            data-loading={isDownloading()}
          >
            <ArrowDownTray size={18} />
          </IconButton>

          {props.navState().canDownloadAll && (
            <IconButton
              size='toolbar'
              onClick={props.onDownloadAll}
              disabled={props.navState().downloadDisabled}
              aria-label={`전체 ${props.totalCount}개 파일 ZIP 다운로드`}
              title={`전체 ${props.totalCount}개 파일 ZIP 다운로드`}
              data-gallery-element='download-all'
              data-disabled={props.navState().downloadDisabled}
              data-action-disabled={props.navState().anyActionDisabled}
              data-loading={isDownloading()}
            >
              <ArrowDownOnSquareStack size={18} />
            </IconButton>
          )}

          {props.showSettingsButton && (
            <IconButton
              ref={props.settingsController.assignSettingsButtonRef}
              id='settings-button'
              size='toolbar'
              aria-label='설정 열기'
              aria-expanded={props.settingsController.isSettingsExpanded() ? 'true' : 'false'}
              aria-controls='toolbar-settings-panel'
              title='설정'
              disabled={isToolbarDisabled()}
              onMouseDown={props.settingsController.handleSettingsMouseDown}
              onClick={props.settingsController.handleSettingsClick}
              data-gallery-element='settings'
              data-disabled={isToolbarDisabled()}
            >
              <Cog6Tooth size={18} />
            </IconButton>
          )}

          {props.tweetText && (
            <IconButton
              id='tweet-text-button'
              size='toolbar'
              aria-label={languageService.getString('toolbar.tweetText') || 'View tweet text'}
              aria-expanded={props.isTweetPanelExpanded() ? 'true' : 'false'}
              aria-controls='toolbar-tweet-panel'
              title={languageService.getString('toolbar.tweetText') || 'Tweet text'}
              disabled={isToolbarDisabled()}
              onClick={props.toggleTweetPanelExpanded}
              data-gallery-element='tweet-text'
              data-disabled={isToolbarDisabled()}
            >
              <ChatBubbleLeftRight size={18} />
            </IconButton>
          )}

          <IconButton
            size='toolbar'
            intent='danger'
            aria-label='갤러리 닫기'
            title='갤러리 닫기 (Esc)'
            disabled={isToolbarDisabled()}
            onClick={props.onCloseClick}
            data-gallery-element='close'
            data-disabled={isToolbarDisabled()}
          >
            <ArrowLeftOnRectangle size={18} />
          </IconButton>
        </div>
      </div>

      <div
        ref={props.settingsController.assignSettingsPanelRef}
        id='toolbar-settings-panel'
        class={styles.settingsPanel}
        data-expanded={props.settingsController.isSettingsExpanded()}
        onMouseDown={props.settingsController.handlePanelMouseDown}
        role='region'
        aria-label='설정 패널'
        aria-labelledby='settings-button'
        data-gallery-element='settings-panel'
        onClick={props.settingsController.handlePanelClick}
      >
        <solid.Show when={props.settingsController.isSettingsExpanded()}>
          <SettingsControlsLazy
            currentTheme={props.settingsController.currentTheme() as ThemeOption}
            currentLanguage={props.settingsController.currentLanguage() as LanguageOption}
            onThemeChange={props.settingsController.handleThemeChange}
            onLanguageChange={props.settingsController.handleLanguageChange}
            compact={true}
            data-testid='settings-controls'
          />
        </solid.Show>
      </div>

      <div
        id='toolbar-tweet-panel'
        class={styles.tweetPanel}
        data-expanded={props.isTweetPanelExpanded()}
        role='region'
        aria-label={languageService.getString('toolbar.tweetTextPanel') || 'Tweet text panel'}
        aria-labelledby='tweet-text-button'
        data-gallery-element='tweet-panel'
      >
        <solid.Show when={props.isTweetPanelExpanded() && props.tweetText}>
          <div class={styles.tweetPanelBody}>
            <div class={styles.tweetHeader}>
              <span class={styles.tweetLabel}>
                {languageService.getString('toolbar.tweetText') || 'Tweet text'}
              </span>
            </div>
            <div class={styles.tweetContent}>
              <solid.Show
                when={props.tweetTextHTML}
                fallback={
                  <solid.For each={formatTweetText(props.tweetText)}>
                    {token => (
                      <solid.Switch>
                        <solid.Match when={token.type === 'link' && token}>
                          {linkToken => {
                            return renderTweetAnchor(
                              linkToken,
                              'url',
                              shortenUrl(linkToken().content, 40)
                            );
                          }}
                        </solid.Match>
                        <solid.Match when={token.type === 'mention' && token}>
                          {mentionToken => renderTweetAnchor(mentionToken, 'mention')}
                        </solid.Match>
                        <solid.Match when={token.type === 'hashtag' && token}>
                          {hashtagToken => renderTweetAnchor(hashtagToken, 'hashtag')}
                        </solid.Match>
                        <solid.Match when={token.type === 'cashtag' && token}>
                          {cashtagToken => renderTweetAnchor(cashtagToken, 'cashtag')}
                        </solid.Match>
                        <solid.Match when={token.type === 'break'}>
                          <br />
                        </solid.Match>
                        <solid.Match when={token.type === 'text' && token}>
                          {textToken => <span>{textToken().content}</span>}
                        </solid.Match>
                      </solid.Switch>
                    )}
                  </solid.For>
                }
              >
                {/* Phase 2: Render sanitized HTML from DOM (already safe) */}
                {/* @ts-expect-error - innerHTML requires non-undefined, but Show ensures tweetTextHTML is truthy */}
                <div innerHTML={props.tweetTextHTML} />
              </solid.Show>
            </div>
          </div>
        </solid.Show>
      </div>
    </div>
  );
}
