/**
 * @fileoverview SolidJS 기반 갤러리 쉘
 * @description FRAME-ALT-001 Stage B - Gallery shell Solid 마이그레이션 1단계
 * Epic MEDIA-TYPE-ENHANCEMENT Phase 1-4: MediaItemFactory 통합
 */

import type { JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { getSolidCore } from '@shared/external/vendors';
import { GalleryContainer } from '@shared/components/isolation';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import {
  ToolbarWithSettings,
  type ToolbarSettingsRendererFactory,
} from '@shared/components/ui/ToolbarWithSettings/ToolbarWithSettings';
import { NavigationButton } from '@shared/components/ui/NavigationButton';
import { getMediaItemComponent } from '@/features/gallery/factories/MediaItemFactory';
import { galleryState, navigateToItem } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import type { ImageFitMode } from '@shared/types';
import { DEFAULT_SETTINGS } from '@/constants';
import { getSetting, setSetting } from '@shared/container/settings-access';
import { createSolidKeyboardHelpOverlayController } from './createSolidKeyboardHelpOverlayController';
import type { SolidSettingsPanelInstance } from '@/features/settings/solid/renderSolidSettingsPanel';
import { useGalleryScroll } from '@/features/gallery/hooks/useGalleryScroll';
import { useGalleryVisibleIndex } from '@/features/gallery/hooks/useVisibleIndex';
import {
  announcePolite,
  ensurePoliteLiveRegion,
} from '@/shared/utils/accessibility/live-region-manager';
import { bodyScrollManager } from '@shared/utils/scroll/body-scroll-manager';
import { scrollAnchorManager } from '@shared/utils/scroll/scroll-anchor-manager';
import { updateViewportForToolbar } from '@shared/utils/viewport/viewport-calculator';
import styles from './SolidGalleryShell.module.css';

export interface SolidGalleryShellOverrides {
  readonly toolbarVariant?: 'standard' | 'with-settings';
  readonly dataAttributes?: Record<string, string | undefined>;
  readonly useShadowDom?: boolean;
  readonly settingsRendererFactory?: ToolbarSettingsRendererFactory | null;
}

export interface SolidGalleryShellProps {
  readonly onClose: () => void;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onDownloadCurrent: () => void;
  readonly onDownloadAll: () => void;
  readonly uiOverrides?: SolidGalleryShellOverrides;
}

const FIT_SETTING_KEY = 'gallery.imageFitMode' as const;

const resolveInitialFitMode = (): ImageFitMode =>
  getSetting<ImageFitMode>(FIT_SETTING_KEY, DEFAULT_SETTINGS.gallery.imageFitMode);

const SolidGalleryShell = (props: SolidGalleryShellProps): JSX.Element => {
  const solid = getSolidCore();
  const { createSignal, createMemo, createEffect, onCleanup, batch } = solid;

  const overrides = {
    toolbarVariant: props.uiOverrides?.toolbarVariant ?? 'standard',
    dataAttributes: props.uiOverrides?.dataAttributes ?? { 'data-xeg-solid-shell': '' },
    useShadowDom: props.uiOverrides?.useShadowDom ?? true,
    settingsRendererFactory: props.uiOverrides?.settingsRendererFactory,
  } as const;

  const hostAttributes: Record<string, string | undefined> = {
    ...overrides.dataAttributes,
    'data-xeg-solid-shell': overrides.dataAttributes['data-xeg-solid-shell'] ?? '',
  };

  const useToolbarWithSettings = overrides.toolbarVariant === 'with-settings';

  let defaultSettingsRendererFactory: ToolbarSettingsRendererFactory | undefined;
  let settingsModulePromise: Promise<
    typeof import('@/features/settings/solid/renderSolidSettingsPanel')
  > | null = null;

  const loadSettingsModule = async () => {
    if (!settingsModulePromise) {
      settingsModulePromise = import('@/features/settings/solid/renderSolidSettingsPanel');
    }
    return settingsModulePromise;
  };

  const getToolbarSettingsRendererFactory = (): ToolbarSettingsRendererFactory => {
    if (overrides.settingsRendererFactory) {
      return overrides.settingsRendererFactory;
    }
    if (!defaultSettingsRendererFactory) {
      defaultSettingsRendererFactory = options => {
        let disposed = false;
        let instance: SolidSettingsPanelInstance | null = null;
        let instancePromise: Promise<SolidSettingsPanelInstance> | null = null;

        const ensureInstance = async (): Promise<SolidSettingsPanelInstance | null> => {
          if (disposed) {
            return null;
          }
          if (instance) {
            return instance;
          }
          if (!instancePromise) {
            instancePromise = loadSettingsModule().then(module =>
              module.renderSolidSettingsPanel({
                container: options.container,
                onClose: () => {
                  options.onClose();
                },
                position: options.position,
                testId: options.testId,
                defaultOpen: false,
              })
            );
          }
          instance = await instancePromise;
          return instance;
        };

        return {
          open: () => {
            void ensureInstance().then(inst => inst?.open());
          },
          close: () => {
            void ensureInstance().then(inst => inst?.close());
          },
          dispose: () => {
            disposed = true;
            if (instance) {
              try {
                instance.close();
              } catch {
                /* noop */
              }
              instance.dispose();
              instance = null;
            } else if (instancePromise) {
              void instancePromise.then(inst => {
                inst.dispose();
              });
            }
            instancePromise = null;
            try {
              options.container.replaceChildren();
            } catch {
              /* noop */
            }
          },
        };
      };
    }
    return defaultSettingsRendererFactory;
  };

  const helpOverlayController = createSolidKeyboardHelpOverlayController();

  const initialState = galleryState(); // Native SolidJS Accessor

  const [isOpen, setIsOpen] = createSignal(initialState.isOpen);
  const [isLoading, setIsLoading] = createSignal(initialState.isLoading);
  const [errorText, setErrorText] = createSignal<string | null>(initialState.error);
  const [mediaItems, setMediaItems] = createSignal<readonly MediaInfo[]>(initialState.mediaItems);
  const [currentIndex, setCurrentIndex] = createSignal(initialState.currentIndex);
  const [fitMode, setFitMode] = createSignal<ImageFitMode>(resolveInitialFitMode());
  const [settingsInstance, setSettingsInstance] = createSignal<SolidSettingsPanelInstance | null>(
    null
  );

  let shellRef: HTMLDivElement | undefined;
  let itemsContainerRef: HTMLDivElement | undefined;
  let settingsHost: HTMLDivElement | null = null;

  const totalCount = createMemo(() => mediaItems().length);

  const ensureSettingsModule = async (): Promise<SolidSettingsPanelInstance | null> => {
    if (useToolbarWithSettings) {
      return null;
    }

    const existing = settingsInstance();
    if (existing) {
      return existing;
    }

    if (typeof document === 'undefined' || !shellRef) {
      return null;
    }

    if (!settingsHost) {
      settingsHost = document.createElement('div');
      settingsHost.setAttribute('data-xeg-solid-settings-host', '');
      shellRef.appendChild(settingsHost);
    }

    const module = await loadSettingsModule();

    const instance = module.renderSolidSettingsPanel({
      container: settingsHost,
      onClose: () => {
        setSettingsInstance(null);
        if (settingsHost) {
          settingsHost.replaceChildren();
        }
      },
    });

    setSettingsInstance(instance);
    return instance;
  };

  const handleOpenSettings = async () => {
    const instance = await ensureSettingsModule();
    instance?.open();
  };

  const handleFitModeChange = (mode: ImageFitMode) => {
    setFitMode(mode);
    void setSetting(FIT_SETTING_KEY, mode);
  };

  // Native SolidJS signal 구독 - createEffect로 자동 추적
  createEffect(() => {
    const state = galleryState(); // Native SolidJS Accessor
    batch(() => {
      setIsOpen(state.isOpen);
      setIsLoading(state.isLoading);
      setErrorText(state.error);
      setMediaItems(state.mediaItems);
      setCurrentIndex(state.currentIndex);
    });

    if (!state.isOpen) {
      helpOverlayController.close();
    }
  });

  // Body scroll lock 관리 - 갤러리 열림/닫힘 시 스크롤 잠금/해제
  createEffect(() => {
    const state = galleryState(); // Native SolidJS Accessor
    if (state.isOpen) {
      bodyScrollManager.lock('gallery', 5);
      // 갤러리 열림 시 초기 뷰포트 계산 (툴바는 기본적으로 표시 상태)
      updateViewportForToolbar(true);
    } else {
      bodyScrollManager.unlock('gallery');
      // 스크롤 앵커 기반 위치 복원 (동적 콘텐츠 대응)
      scrollAnchorManager.restoreToAnchor();
    }
  });

  // onCleanup으로 정리 보장
  onCleanup(() => {
    bodyScrollManager.unlock('gallery');
  });

  createEffect(() => {
    const container = itemsContainerRef;
    if (!container) {
      return;
    }
    const activeIndex = currentIndex();
    const activeNode = container.querySelector(`[data-index="${activeIndex}"]`);
    if (activeNode instanceof HTMLElement && typeof activeNode.scrollIntoView === 'function') {
      try {
        activeNode.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch {
        activeNode.scrollIntoView({ block: 'center' });
      }
    }
  });

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const handleGlobalKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.contentEditable === 'true') {
          return;
        }
      }

      if (!isOpen()) {
        return;
      }

      const navigation = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      switch (event.key) {
        case 'Escape':
          navigation();
          if (helpOverlayController.isOpen()) {
            helpOverlayController.close();
            break;
          }
          props.onClose?.();
          break;
        case 'ArrowLeft':
          navigation();
          props.onPrevious?.();
          break;
        case 'ArrowRight':
          navigation();
          props.onNext?.();
          break;
        case '?':
          navigation();
          helpOverlayController.open();
          break;
        case '/':
          if (event.shiftKey) {
            navigation();
            helpOverlayController.open();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown, true);
    window.addEventListener('keydown', handleGlobalKeydown, true);

    onCleanup(() => {
      document.removeEventListener('keydown', handleGlobalKeydown, true);
      window.removeEventListener('keydown', handleGlobalKeydown, true);
    });
  }

  // Phase C (UX-001): 배경 스크롤 차단 전용
  // useGalleryScroll은 갤러리 외부(Twitter 배경) 스크롤만 차단
  // 갤러리 내부에서는 네이티브 스크롤 허용
  // 네비게이션은 키보드 이벤트로만 처리 (ArrowLeft/Right)
  // 수정: itemsContainerRef를 전달하여 실제 스크롤 가능 영역을 올바르게 인식
  useGalleryScroll({
    container: () => itemsContainerRef,
    onScroll: () => {
      // 배경 이벤트 감지용 - 실제로는 아무 동작도 하지 않음
      // blockTwitterScroll이 true이므로 배경 스크롤만 preventDefault됨
    },
    enabled: () => isOpen(),
    blockTwitterScroll: true,
  });

  // Phase 2-2 (AUTO-FOCUS-UPDATE): visibleIndex 추적
  // IntersectionObserver로 현재 화면에 가장 많이 보이는 아이템 추적
  // currentIndex와 독립적으로 동작 (자동 스크롤 미발생)
  const visibleIndexResult = useGalleryVisibleIndex(() => itemsContainerRef ?? null, totalCount(), {
    rafCoalesce: true,
  });
  const visibleIndex = createMemo(() => visibleIndexResult.visibleIndexAccessor());

  /**
   * Phase 2-3 (AUTO-FOCUS-UPDATE): Accessibility Enhancement - Screen Reader Announcements
   *
   * Automatically announces the currently visible item to screen readers via ARIA live region.
   *
   * @remarks
   * - Uses polite announcement (non-intrusive) to respect user workflow
   * - Announces format: "현재 화면에 표시된 아이템: X/Y" (1-indexed for user-friendliness)
   * - Suppresses announcement when gallery is closed or empty
   * - Handles initial render when visibleIndex is -1 (defaults to index 0)
   * - Deduplication is handled by live-region-manager (200ms window)
   *
   * @see {@link https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html} WCAG 2.1 Status Messages
   * @see live-region-manager for implementation details
   */
  ensurePoliteLiveRegion();

  createEffect(() => {
    const idx = visibleIndex();
    const total = totalCount();
    const open = isOpen();

    // Only announce if gallery is open and has items
    if (!open || total === 0) {
      return;
    }

    // Use default index 0 if visibleIndex is not yet initialized (-1)
    // This ensures accessibility announcement happens on initial render
    const effectiveIndex = idx < 0 ? 0 : idx;

    // Format: "현재 화면에 표시된 아이템: 1/3" (1-indexed for user-friendly display)
    const message = `현재 화면에 표시된 아이템: ${effectiveIndex + 1}/${total}`;
    announcePolite(message);
  });

  const handleItemSelection = (index: number) => {
    if (index === currentIndex()) {
      return;
    }
    navigateToItem(index);
  };

  const renderItems = createMemo(() =>
    mediaItems().map((media, index) => {
      const ComponentType = getMediaItemComponent(media);
      return (
        <Dynamic
          component={ComponentType}
          media={media}
          index={index}
          isActive={index === currentIndex()}
          isFocused={index === currentIndex()}
          isVisible={index === visibleIndex()}
          forceVisible={index === currentIndex()}
          fitMode={fitMode()}
          onClick={() => handleItemSelection(index)}
        />
      );
    })
  );

  onCleanup(() => {
    // Native SolidJS signal은 createEffect가 자동으로 정리하므로 unsubscribe 불필요
    helpOverlayController.dispose();
    const instance = settingsInstance();
    try {
      instance?.dispose();
    } catch {
      /* noop */
    }
    if (settingsHost?.parentNode) {
      settingsHost.parentNode.removeChild(settingsHost);
    }
  });

  const Show = solid.Show;

  // Navigation button disabled 상태 계산
  const isLeftDisabled = createMemo(() => currentIndex() === 0 || isLoading());
  const isRightDisabled = createMemo(() => currentIndex() >= totalCount() - 1 || isLoading());

  return (
    <GalleryContainer onClose={props.onClose} isOpen={isOpen()}>
      <Show when={isOpen()}>
        <div
          ref={node => {
            shellRef = node ?? undefined;
          }}
          class={styles.shell}
          {...hostAttributes}
          data-xeg-open='true'
          aria-hidden='false'
          style={{
            'pointer-events': 'auto',
          }}
        >
          {/* Left Navigation Button */}
          <NavigationButton
            direction='left'
            disabled={isLeftDisabled()}
            loading={isLoading()}
            onClick={props.onPrevious}
            aria-label='이전 미디어'
            data-testid='gallery-nav-left'
          />

          {/* Right Navigation Button */}
          <NavigationButton
            direction='right'
            disabled={isRightDisabled()}
            loading={isLoading()}
            onClick={props.onNext}
            aria-label='다음 미디어'
            data-testid='gallery-nav-right'
          />

          {useToolbarWithSettings ? (
            <ToolbarWithSettings
              currentIndex={currentIndex()}
              totalCount={totalCount()}
              isLoading={isLoading()}
              disabled={!isOpen()}
              onPrevious={props.onPrevious}
              onNext={props.onNext}
              onDownloadCurrent={props.onDownloadCurrent}
              onDownloadAll={props.onDownloadAll}
              onClose={props.onClose}
              currentFitMode={fitMode()}
              onFitOriginal={() => handleFitModeChange('original')}
              onFitWidth={() => handleFitModeChange('fitWidth')}
              onFitHeight={() => handleFitModeChange('fitHeight')}
              onFitContainer={() => handleFitModeChange('fitContainer')}
              settingsRendererFactory={
                overrides.settingsRendererFactory === undefined
                  ? getToolbarSettingsRendererFactory()
                  : (overrides.settingsRendererFactory ?? undefined)
              }
              aria-label='갤러리 도구모음'
            />
          ) : (
            <Toolbar
              currentIndex={currentIndex()}
              totalCount={totalCount()}
              isLoading={isLoading()}
              disabled={!isOpen()}
              onPrevious={props.onPrevious}
              onNext={props.onNext}
              onDownloadCurrent={props.onDownloadCurrent}
              onDownloadAll={props.onDownloadAll}
              onClose={props.onClose}
              currentFitMode={fitMode()}
              onFitOriginal={() => handleFitModeChange('original')}
              onFitWidth={() => handleFitModeChange('fitWidth')}
              onFitHeight={() => handleFitModeChange('fitHeight')}
              onFitContainer={() => handleFitModeChange('fitContainer')}
              onOpenSettings={handleOpenSettings}
              aria-label='갤러리 도구모음'
            />
          )}

          <div class={styles.contentArea} data-gallery-element='items-area'>
            <div
              ref={node => {
                itemsContainerRef = node ?? undefined;
              }}
              class={styles.itemsContainer}
              data-xeg-role='items-container'
              aria-live='polite'
            >
              {renderItems()}
            </div>
          </div>

          {errorText() ? (
            <div class={styles.statusBanner} data-variant='error' role='status'>
              {errorText()}
            </div>
          ) : null}
        </div>
      </Show>
    </GalleryContainer>
  );
};

export default SolidGalleryShell;
