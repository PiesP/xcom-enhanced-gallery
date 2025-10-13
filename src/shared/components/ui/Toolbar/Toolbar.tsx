/**
 * @fileoverview Gallery Toolbar Component (Solid.js)
 * @description 고급 갤러리 툴바 UI - Solid.js 기반 구현
 */

import type { JSXElement } from '../../../external/vendors';
import { getSolid } from '../../../external/vendors';
import {
  useToolbarState,
  getToolbarDataState,
  getToolbarClassName,
} from '../../../hooks/use-toolbar-state';
import {
  getToolbarExpandableState,
  toggleSettingsExpanded,
  setSettingsExpanded,
} from '../../../state/signals/toolbar.signals';
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
import { SettingsControls } from '../Settings/SettingsControls';
import { ThemeService } from '../../../services/theme-service';
import { LanguageService } from '../../../services/language-service';
import type { ToolbarProps, FitMode } from './Toolbar.types';
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

const FIT_MODE_ORDER: ReadonlyArray<{
  readonly mode: FitMode;
  readonly Icon: (props: { size?: number }) => JSXElement;
}> = [
  { mode: 'original', Icon: ZoomIn },
  { mode: 'fitWidth', Icon: ArrowAutofitWidth },
  { mode: 'fitHeight', Icon: ArrowAutofitHeight },
  { mode: 'fitContainer', Icon: ArrowsMaximize },
];

const HIGH_CONTRAST_OFFSETS = [0.25, 0.5, 0.75] as const;

function ToolbarComponent(rawProps: ToolbarProps): JSXElement {
  const { mergeProps, createMemo, createEffect, onCleanup, on, createSignal } = solid;

  const props = mergeProps(DEFAULT_TOOLBAR_PROPS, rawProps);
  const [toolbarState, toolbarActions] = useToolbarState();

  // Services for settings
  const themeService = new ThemeService();
  const languageService = new LanguageService();

  // Settings state
  const [currentTheme, setCurrentTheme] = createSignal<'auto' | 'light' | 'dark'>('auto');
  const [currentLanguage, setCurrentLanguage] = createSignal<'auto' | 'ko' | 'en' | 'ja'>('auto');

  // Expandable panel state - track with createMemo to make it reactive
  const isSettingsExpanded = createMemo(() => getToolbarExpandableState().isSettingsExpanded);

  let toolbarRef: HTMLDivElement | undefined;
  let settingsPanelRef: HTMLDivElement | undefined;
  let settingsButtonRef: HTMLButtonElement | undefined;

  // Phase 48.5-48.9: 외부 클릭 감지 - 설정 패널이 확장되었을 때만 리스너 등록
  createEffect(() => {
    const expanded = isSettingsExpanded();

    if (expanded) {
      // Phase 48.9: Select 활성 상태 추적
      let isSelectActive = false;
      let selectChangeTimeout: number | undefined;

      const handleSelectFocus = () => {
        isSelectActive = true;
      };

      const handleSelectBlur = () => {
        // Blur 후 약간의 딜레이를 주어 change 이벤트가 완료되도록 함
        setTimeout(() => {
          isSelectActive = false;
        }, 100);
      };

      const handleSelectChange = () => {
        // Change 이벤트 발생 시 300ms 동안 외부 클릭 무시
        clearTimeout(selectChangeTimeout);
        isSelectActive = true;
        selectChangeTimeout = setTimeout(() => {
          isSelectActive = false;
        }, 300) as unknown as number;
      };

      const handleOutsideClick = (event: MouseEvent) => {
        const target = event.target as Node;

        // Phase 48.9: Select가 활성 상태면 외부 클릭 무시
        if (isSelectActive) {
          return;
        }

        // 설정 버튼이나 패널 내부 클릭은 무시
        if (settingsButtonRef?.contains(target) || settingsPanelRef?.contains(target)) {
          return;
        }

        // Phase 48.6: select 요소나 그 자식 클릭은 무시
        // (브라우저가 생성하는 드롭다운 옵션은 DOM 외부에 있을 수 있음)
        let currentNode = target as HTMLElement | null;
        while (currentNode) {
          if (currentNode.tagName === 'SELECT' || currentNode.tagName === 'OPTION') {
            return;
          }
          currentNode = currentNode.parentElement;
        }

        // 외부 클릭 시 패널 닫기
        setSettingsExpanded(false);
      };

      // Select 요소에 이벤트 리스너 등록
      const panel = settingsPanelRef;
      const selects = panel?.querySelectorAll('select') || [];
      selects.forEach(select => {
        select.addEventListener('focus', handleSelectFocus);
        select.addEventListener('blur', handleSelectBlur);
        select.addEventListener('change', handleSelectChange);
      });

      // bubble phase에서 이벤트 처리 (패널 내부의 stopPropagation이 먼저 작동하도록)
      document.addEventListener('mousedown', handleOutsideClick, false);

      onCleanup(() => {
        clearTimeout(selectChangeTimeout);
        document.removeEventListener('mousedown', handleOutsideClick, false);
        selects.forEach(select => {
          select.removeEventListener('focus', handleSelectFocus);
          select.removeEventListener('blur', handleSelectBlur);
          select.removeEventListener('change', handleSelectChange);
        });
      });
    }
  });

  const toolbarClass = createMemo(() =>
    ComponentStandards.createClassName(
      styles.toolbar,
      getToolbarClassName(toolbarState, styles.galleryToolbar || ''),
      props.className ?? ''
    )
  );

  const displayedIndex = createMemo(() => {
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

    // currentIndex가 범위를 벗어나더라도 0~total-1 범위로 클램프하여 반환
    const clampedCurrent = Math.min(Math.max(Number(current) || 0, 0), total - 1);
    return clampedCurrent;
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

  const evaluateHighContrast = ((): (() => void) => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return () => toolbarActions.setNeedsHighContrast(false);
    }

    if (typeof document.elementsFromPoint !== 'function') {
      return () => toolbarActions.setNeedsHighContrast(false);
    }

    return () => {
      if (!toolbarRef) {
        toolbarActions.setNeedsHighContrast(false);
        return;
      }

      const rect = toolbarRef.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        toolbarActions.setNeedsHighContrast(false);
        return;
      }

      const lightHits = HIGH_CONTRAST_OFFSETS.filter(offset => {
        const x = rect.left + rect.width * offset;
        const y = rect.top + rect.height * 0.5;
        return document.elementsFromPoint(x, y).some(element => {
          const bg = window.getComputedStyle(element).backgroundColor || '';
          return /(?:white|255)/i.test(bg);
        });
      }).length;

      toolbarActions.setNeedsHighContrast(lightHits >= 2);
    };
  })();

  createEffect(() => {
    if (typeof window === 'undefined') {
      toolbarActions.setNeedsHighContrast(false);
      return;
    }

    evaluateHighContrast();

    const detect = throttleScroll(() => {
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(evaluateHighContrast);
      } else {
        evaluateHighContrast();
      }
    });

    const manager = EventManager.getInstance();
    const listenerId = manager.addListener(window, 'scroll', detect as EventListener, {
      passive: true,
    });

    onCleanup(() => {
      manager.removeListener(listenerId);
    });
  });

  const createActionHandler = (action?: () => void) => (event: Event | MouseEvent) => {
    event.stopPropagation();
    action?.();
  };

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

  const handleFitModeClick = (mode: FitMode) => (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    (event as { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
    toolbarActions.setCurrentFitMode(mode);
    if (!props.disabled) {
      getFitHandler(mode)?.(event);
    }
  };

  const isFitDisabled = (mode: FitMode): boolean => props.disabled || !getFitHandler(mode);

  const navState = createMemo(() => {
    const total = Math.max(0, props.totalCount ?? 0);
    const clampedCurrent = Math.min(
      Math.max(Number(props.currentIndex ?? 0) || 0, 0),
      Math.max(total - 1, 0)
    );
    const disabled = !!props.disabled;
    const isDownloading = !!props.isDownloading;

    return {
      prevDisabled: disabled || clampedCurrent <= 0,
      nextDisabled: disabled || clampedCurrent >= total - 1,
      canDownloadAll: total > 1,
      downloadDisabled: disabled || isDownloading,
    } as const;
  });

  const onPreviousClick = createActionHandler(props.onPrevious);
  const onNextClick = createActionHandler(props.onNext);
  const onDownloadCurrent = createActionHandler(props.onDownloadCurrent);
  const onDownloadAll = createActionHandler(props.onDownloadAll);
  const onCloseClick = createActionHandler(props.onClose);

  const onSettingsClick = (event: MouseEvent) => {
    event.stopImmediatePropagation();
    const wasExpanded = isSettingsExpanded();

    // Phase 48.9: Toggle only - props.onOpenSettings는 제거 (이중 토글 방지)
    toggleSettingsExpanded();

    // Phase 47→48.7: Focus management 수정 - createEffect 대신 직접 DOM 조작
    if (!wasExpanded) {
      // 패널이 열릴 때만 포커스 이동 (한 번만 실행)
      setTimeout(() => {
        const panel = document.querySelector('[data-gallery-element="settings-panel"]');
        const firstControl = panel?.querySelector('select') as HTMLSelectElement;
        if (firstControl) {
          firstControl.focus();
        }
      }, 50);
    }
  };

  // Phase 47: Keyboard navigation - Escape 키 핸들러
  const handleToolbarKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isSettingsExpanded()) {
      event.preventDefault();
      event.stopPropagation();
      setSettingsExpanded(false);

      // Phase 47→48.7: 설정 버튼으로 포커스 복원 - createEffect 대신 직접 DOM 조작
      setTimeout(() => {
        const settingsButton = document.querySelector(
          '[data-gallery-element="settings"]'
        ) as HTMLButtonElement;
        if (settingsButton) {
          settingsButton.focus();
        }
      }, 50);
      return; // Escape 처리 완료
    }

    // Escape 외의 키는 무시 (기존 키보드 핸들링은 개별 버튼에서 처리)
  };

  const handleThemeChange = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    const theme = select.value as 'auto' | 'light' | 'dark';
    setCurrentTheme(theme);
    themeService.setTheme(theme);
  };

  const handleLanguageChange = (event: Event) => {
    const select = event.target as HTMLSelectElement;
    const language = select.value as 'auto' | 'ko' | 'en' | 'ja';
    setCurrentLanguage(language);
    languageService.setLanguage(language);
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
      onKeyDown={handleToolbarKeyDown as unknown as ((event: Event) => void) | undefined}
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
            disabled={navState().prevDisabled}
            onClick={onPreviousClick}
            data-gallery-element='nav-previous'
            data-disabled={navState().prevDisabled}
          >
            <ChevronLeft size={18} />
          </IconButton>

          <IconButton
            size='toolbar'
            aria-label='다음 미디어'
            title='다음 미디어 (→)'
            disabled={navState().nextDisabled}
            onClick={onNextClick}
            data-gallery-element='nav-next'
            data-disabled={navState().nextDisabled}
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
          {FIT_MODE_ORDER.map(({ mode, Icon }) => {
            const label = fitModeLabels[mode];
            return (
              <IconButton
                size='toolbar'
                onClick={handleFitModeClick(mode)}
                disabled={isFitDisabled(mode)}
                aria-label={label.label}
                title={label.title}
                data-gallery-element={`fit-${mode}`}
                data-selected={toolbarState.currentFitMode === mode}
                data-disabled={isFitDisabled(mode)}
              >
                <Icon size={18} />
              </IconButton>
            );
          })}

          <IconButton
            size='toolbar'
            loading={props.isDownloading}
            onClick={onDownloadCurrent}
            disabled={navState().downloadDisabled}
            aria-label='현재 파일 다운로드'
            title='현재 파일 다운로드 (Ctrl+D)'
            data-gallery-element='download-current'
            data-disabled={navState().downloadDisabled}
            data-loading={props.isDownloading}
          >
            <Download size={18} />
          </IconButton>

          {navState().canDownloadAll && (
            <IconButton
              size='toolbar'
              onClick={onDownloadAll}
              disabled={navState().downloadDisabled}
              aria-label={`전체 ${props.totalCount}개 파일 ZIP 다운로드`}
              title={`전체 ${props.totalCount}개 파일 ZIP 다운로드`}
              data-gallery-element='download-all'
              data-disabled={navState().downloadDisabled}
              data-loading={props.isDownloading}
            >
              <FileZip size={18} />
            </IconButton>
          )}

          {typeof props.onOpenSettings === 'function' && (
            <IconButton
              ref={element => {
                settingsButtonRef = element ?? undefined;
              }}
              id='settings-button'
              size='toolbar'
              aria-label='설정 열기'
              aria-expanded={isSettingsExpanded() ? 'true' : 'false'}
              aria-controls='toolbar-settings-panel'
              title='설정'
              disabled={props.disabled}
              onClick={onSettingsClick}
              data-gallery-element='settings'
              data-disabled={props.disabled}
            >
              <Settings size={18} />
            </IconButton>
          )}

          <IconButton
            size='toolbar'
            intent='danger'
            aria-label='갤러리 닫기'
            title='갤러리 닫기 (Esc)'
            disabled={props.disabled}
            onClick={onCloseClick}
            data-gallery-element='close'
            data-disabled={props.disabled}
          >
            <X size={18} />
          </IconButton>
        </div>
      </div>

      {/* Settings Panel */}
      <div
        ref={element => {
          settingsPanelRef = element ?? undefined;
        }}
        id='toolbar-settings-panel'
        class={styles.settingsPanel}
        data-expanded={isSettingsExpanded()}
        onMouseDown={e => {
          // Phase 48.5: 패널 내부 클릭은 전파하지 않음
          e.stopPropagation();
        }}
        role='region'
        aria-label='설정 패널'
        aria-labelledby='settings-button'
        data-gallery-element='settings-panel'
      >
        {/* Phase 48.8: Show로 감싸서 패널이 열렸을 때만 렌더링 */}
        <solid.Show when={isSettingsExpanded()}>
          <SettingsControls
            currentTheme={currentTheme()}
            currentLanguage={currentLanguage()}
            onThemeChange={handleThemeChange}
            onLanguageChange={handleLanguageChange}
            compact={true}
            data-testid='settings-controls'
          />
        </solid.Show>
      </div>
    </div>
  );
}

const ToolbarMemo = solid.memo<ToolbarProps>(ToolbarComponent);

Object.defineProperty(ToolbarMemo, 'displayName', {
  value: 'memo(ToolbarComponent)',
  configurable: true,
});

export type { ToolbarProps, GalleryToolbarProps, FitMode } from './Toolbar.types';
export const Toolbar = ToolbarMemo;

export default ToolbarMemo;
