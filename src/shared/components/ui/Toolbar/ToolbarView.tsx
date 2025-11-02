/**
 * @fileoverview Toolbar presentational component
 * @description Split from Toolbar container to isolate rendering logic.
 */

import type { JSXElement } from '../../../external/vendors';
import { getSolid } from '../../../external/vendors';
import { IconButton } from '../Button/IconButton';
import { ChevronLeft, ChevronRight, Download, FileZip, Settings, X } from '../Icon';
import { SettingsControlsLazy } from '../Settings/SettingsControlsLazy';
import styles from './Toolbar.module.css';
import type { ToolbarProps, FitMode } from './Toolbar.types';
import type { ToolbarState } from '../../../hooks/use-toolbar-state';
import type { ToolbarSettingsControllerResult } from '../../../hooks/toolbar/use-toolbar-settings-controller';

type ThemeOption = 'auto' | 'light' | 'dark';
type LanguageOption = 'auto' | 'ko' | 'en' | 'ja';

type ToolbarViewNavState = {
  readonly prevDisabled: boolean;
  readonly nextDisabled: boolean;
  readonly canDownloadAll: boolean;
  readonly downloadDisabled: boolean;
};

type FitModeLabel = {
  readonly label: string;
  readonly title: string;
};

type FitModeDefinition = {
  readonly mode: FitMode;
  readonly Icon: (props: { size?: number }) => JSXElement;
};

type ToolbarViewBaseProps = Omit<
  ToolbarProps,
  'onPrevious' | 'onNext' | 'onDownloadCurrent' | 'onDownloadAll' | 'onClose' | 'onOpenSettings'
>;

export interface ToolbarViewProps extends ToolbarViewBaseProps {
  readonly toolbarClass: () => string;
  readonly toolbarState: ToolbarState;
  readonly toolbarDataState: () => string;
  readonly navState: () => ToolbarViewNavState;
  readonly displayedIndex: () => number;
  readonly progressWidth: () => string;
  readonly fitModeOrder: ReadonlyArray<FitModeDefinition>;
  readonly fitModeLabels: Record<FitMode, FitModeLabel>;
  readonly handleFitModeClick: (mode: FitMode) => (event: MouseEvent) => void;
  readonly isFitDisabled: (mode: FitMode) => boolean;
  readonly onPreviousClick: (event: MouseEvent) => void;
  readonly onNextClick: (event: MouseEvent) => void;
  readonly onDownloadCurrent: (event: MouseEvent) => void;
  readonly onDownloadAll: (event: MouseEvent) => void;
  readonly onCloseClick: (event: MouseEvent) => void;
  readonly settingsController: ToolbarSettingsControllerResult;
  readonly showSettingsButton: boolean;
}

export function ToolbarView(props: ToolbarViewProps): JSXElement {
  const solid = getSolid();

  // Phase 87: props 직접 접근 (구조 분해 제거)
  const isToolbarDisabled = () => Boolean(props.disabled);
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
          >
            <ChevronLeft size={18} />
          </IconButton>

          <IconButton
            size='toolbar'
            aria-label='다음 미디어'
            title='다음 미디어 (→)'
            disabled={props.navState().nextDisabled}
            onClick={props.onNextClick}
            data-gallery-element='nav-next'
            data-disabled={props.navState().nextDisabled}
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
            data-loading={isDownloading()}
          >
            <Download size={18} />
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
              data-loading={isDownloading()}
            >
              <FileZip size={18} />
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
              <Settings size={18} />
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
            <X size={18} />
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
    </div>
  );
}
