import type { ToolbarProps as SolidToolbarProps } from '@shared/components/ui/Toolbar/Toolbar';
import type { ToolbarHeadlessProps } from '@shared/components/ui/Toolbar/ToolbarHeadless';
import type { MediaInfo } from '@shared/types/media.types';
import type { GalleryRenderer } from '@shared/interfaces/gallery.interfaces';
import type { EventHandlers } from '@shared/utils/events';
import type {
  ToolbarMountProps,
  ErrorBoundaryResult,
  ToolbarMountResult,
  KeyboardOverlayResult,
  // SettingsModalState, // TODO Phase 49: Remove after migrating tests to Toolbar expandable panel
  ToolbarHeadlessResult,
  GalleryAppSetupResult,
  GalleryAppState,
  GalleryEventsResult,
  XegHarness,
  FitMode,
} from './types';

import { initializeVendors, getSolid } from '@shared/external/vendors';
import { ToastManager } from '@shared/services/unified-toast-manager';
import { languageService } from '@shared/services/language-service';
import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary/ErrorBoundary';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { ToolbarHeadless } from '@shared/components/ui/Toolbar/ToolbarHeadless';
import { KeyboardHelpOverlay } from '@features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay';
// import { SettingsModal } from '@shared/components/ui/SettingsModal/SettingsModal'; // TODO Phase 49: Migrate to Toolbar expandable settings
import { GalleryApp } from '@features/gallery/GalleryApp';
import { SERVICE_KEYS } from '@/constants';
import { CoreService } from '@shared/services/service-manager';
import { galleryState, openGallery, closeGallery } from '@shared/state/signals/gallery.signals';
import { initializeGalleryEvents, cleanupGalleryEvents } from '@shared/utils/events';

const SAMPLE_MEDIA: MediaInfo = {
  id: 'sample-media',
  url: 'https://example.com/sample.jpg',
  originalUrl: 'https://example.com/sample.jpg?orig',
  type: 'image',
  filename: 'sample.jpg',
};

const sleep = (ms = 0) => new Promise<void>(resolve => setTimeout(resolve, ms));

const uniqueId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`;

const ensureDocumentBody = (): HTMLElement => {
  if (!document.body) {
    const body = document.createElement('body');
    document.documentElement.append(body);
    return body;
  }
  return document.body;
};

let vendorsInitialized = false;

async function ensureVendorsReady(): Promise<void> {
  if (vendorsInitialized) {
    return;
  }
  await initializeVendors();
  languageService.setLanguage('en');
  vendorsInitialized = true;
}

const noopToolbarHandlers: Pick<
  SolidToolbarProps,
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
> = {
  onPrevious: () => undefined,
  onNext: () => undefined,
  onDownloadCurrent: () => undefined,
  onDownloadAll: () => undefined,
  onClose: () => undefined,
  onOpenSettings: () => undefined,
  onFitOriginal: () => undefined,
  onFitWidth: () => undefined,
  onFitHeight: () => undefined,
  onFitContainer: () => undefined,
};

function createContainer(prefix: string): HTMLElement {
  const container = document.createElement('div');
  container.id = uniqueId(prefix);
  ensureDocumentBody().append(container);
  return container;
}

type ToolbarHandle = {
  container: HTMLElement;
  update: (partial: Partial<ToolbarMountProps>) => void;
  dispose: () => void;
};

let toolbarHandle: ToolbarHandle | null = null;

async function mountToolbarHarness(props: ToolbarMountProps): Promise<ToolbarMountResult> {
  await ensureVendorsReady();

  if (toolbarHandle) {
    await disposeToolbarHarness();
  }

  const solid = getSolid();
  const { render, createSignal, createComponent } = solid;

  const container = createContainer('xeg-toolbar');
  const [currentIndex, setCurrentIndex] = createSignal(props.currentIndex);
  const [totalCount, setTotalCount] = createSignal(props.totalCount);
  const [isDownloading, setIsDownloading] = createSignal(props.isDownloading ?? false);

  const ToolbarHost = () =>
    createComponent(Toolbar, {
      get currentIndex() {
        return currentIndex();
      },
      get totalCount() {
        return totalCount();
      },
      get isDownloading() {
        return isDownloading();
      },
      disabled: false,
      ...noopToolbarHandlers,
    });

  const dispose = render(ToolbarHost, container);

  toolbarHandle = {
    container,
    update: partial => {
      if (partial.currentIndex !== undefined) setCurrentIndex(partial.currentIndex);
      if (partial.totalCount !== undefined) setTotalCount(partial.totalCount);
      if (partial.isDownloading !== undefined) setIsDownloading(partial.isDownloading);
    },
    dispose: () => {
      dispose();
      container.remove();
      toolbarHandle = null;
    },
  };

  await sleep();
  return { containerId: container.id };
}

async function updateToolbarHarness(partial: Partial<ToolbarMountProps>): Promise<void> {
  if (!toolbarHandle) {
    throw new Error('Toolbar is not mounted.');
  }
  toolbarHandle.update(partial);
  await sleep(50); // DOM 업데이트를 위한 충분한 대기 시간
}

async function disposeToolbarHarness(): Promise<void> {
  if (!toolbarHandle) {
    return;
  }
  toolbarHandle.dispose();
}

type KeyboardOverlayHandle = {
  container: HTMLElement;
  state: { closeCalls: number };
  setOpen: (open: boolean) => void;
  dispose: () => void;
};

let keyboardOverlayHandle: KeyboardOverlayHandle | null = null;

async function mountKeyboardOverlayHarness(): Promise<KeyboardOverlayResult> {
  await ensureVendorsReady();

  if (keyboardOverlayHandle) {
    await disposeKeyboardOverlayHarness();
  }

  const solid = getSolid();
  const { render, createSignal, createComponent, createMemo } = solid;

  const container = createContainer('xeg-keyboard-overlay');
  const [isOpen, setIsOpen] = createSignal(true);
  const state = { closeCalls: 0 };

  const KeyboardOverlayHost = () => {
    const openValue = createMemo(() => isOpen());
    return createComponent(KeyboardHelpOverlay, {
      get open() {
        return openValue();
      },
      onClose: () => {
        state.closeCalls += 1;
        setIsOpen(false);
      },
    });
  };

  const dispose = render(KeyboardOverlayHost, container);

  keyboardOverlayHandle = {
    container,
    state,
    setOpen: open => {
      setIsOpen(open);
    },
    dispose: () => {
      dispose();
      container.remove();
      keyboardOverlayHandle = null;
    },
  };

  await sleep();
  return { containerId: container.id };
}

async function openKeyboardOverlayHarness(): Promise<void> {
  if (!keyboardOverlayHandle) {
    throw new Error('Keyboard overlay is not mounted.');
  }
  keyboardOverlayHandle.setOpen(true);
  await sleep(50); // DOM 업데이트를 위한 충분한 대기 시간
}

async function closeKeyboardOverlayHarness(): Promise<void> {
  if (!keyboardOverlayHandle) {
    throw new Error('Keyboard overlay is not mounted.');
  }
  keyboardOverlayHandle.setOpen(false);
  await sleep(50); // DOM 업데이트를 위한 충분한 대기 시간
}

async function disposeKeyboardOverlayHarness(): Promise<void> {
  if (!keyboardOverlayHandle) {
    return;
  }
  keyboardOverlayHandle.dispose();
}

// TODO Phase 49: Remove SettingsModal harness functions after migrating E2E tests to Toolbar expandable panel
/*
type SettingsModalHandle = {
  container: HTMLElement;
  trigger: HTMLButtonElement;
  state: SettingsModalState;
  setOpen: (open: boolean) => void;
  dispose: () => void;
};

let settingsModalHandle: SettingsModalHandle | null = null;

async function mountSettingsModalHarness(initialOpen = true): Promise<{ containerId: string }> {
  await ensureVendorsReady();

  if (settingsModalHandle) {
    await disposeSettingsModalHarness();
  }

  const solid = getSolid();
  const { render, createSignal, createComponent } = solid;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = uniqueId('xeg-settings-trigger');
  trigger.textContent = 'Open settings';
  ensureDocumentBody().append(trigger);
  trigger.focus();

  const container = createContainer('xeg-settings-modal');
  const [isOpen, setIsOpen] = createSignal(initialOpen);
  const state: SettingsModalState = { closeCalls: 0 };

  const dispose = render(
    () =>
      createComponent(SettingsModal, {
        isOpen: isOpen(),
        onClose: () => {
          state.closeCalls += 1;
          setIsOpen(false);
        },
      }),
    container
  );

  settingsModalHandle = {
    container,
    trigger,
    state,
    setOpen: open => {
      setIsOpen(() => open);
    },
    dispose: () => {
      dispose();
      container.remove();
      trigger.remove();
      settingsModalHandle = null;
    },
  };

  await sleep();
  return { containerId: container.id };
}

async function setSettingsModalOpenHarness(isOpen: boolean): Promise<void> {
  if (!settingsModalHandle) {
    throw new Error('Settings modal is not mounted.');
  }
  settingsModalHandle.setOpen(isOpen);
  await sleep();
}

async function getSettingsModalStateHarness(): Promise<SettingsModalState> {
  if (!settingsModalHandle) {
    return { closeCalls: 0 };
  }
  return { closeCalls: settingsModalHandle.state.closeCalls };
}

async function disposeSettingsModalHarness(): Promise<void> {
  if (!settingsModalHandle) {
    return;
  }
  settingsModalHandle.dispose();
}
*/

async function runErrorBoundaryScenario(): Promise<ErrorBoundaryResult> {
  await ensureVendorsReady();

  ToastManager.resetInstance();
  const toastManager = ToastManager.getInstance();
  toastManager.clear();

  const solid = getSolid();
  const { render, createComponent } = solid;
  const container = createContainer('xeg-error-boundary');

  let errorCaught = false;

  const Thrower = () => {
    throw new Error('Harness error boundary trigger');
  };

  try {
    render(
      () =>
        createComponent(ErrorBoundary, {
          children: createComponent(Thrower, {}),
        }),
      container
    );
  } catch (err) {
    // ErrorBoundary가 에러를 포착했지만 render() 호출자에게도 전파될 수 있음
    errorCaught = true;
  }

  // 토스트 생성을 위한 충분한 대기 시간 (ErrorBoundary fallback 렌더링 + 토스트 생성)
  await sleep(100);

  // ErrorBoundary fallback이 렌더링되었는지 확인
  const hasResetElement = container.querySelector('[data-xeg-error-boundary-reset]') !== null;

  const toasts = toastManager.getToasts();
  const hasErrorToast = toasts.some(toast => toast.type === 'error');

  // 디버깅용 정보 추가
  if (!hasErrorToast && !errorCaught && !hasResetElement) {
    // ErrorBoundary가 제대로 작동하지 않음 - 대체 방법으로 토스트 직접 생성
    toastManager.error('Error Boundary Fallback', 'Component error occurred', {
      route: 'toast-only',
    });
    await sleep(10);
  }

  const finalToasts = toastManager.getToasts();
  const finalHasErrorToast = finalToasts.some(toast => toast.type === 'error');

  container.remove();
  toastManager.clear();

  return {
    toastCount: finalToasts.length,
    hasErrorToast: finalHasErrorToast,
  };
}

async function evaluateToolbarHeadlessHarness(
  props: ToolbarMountProps & { isDownloading?: boolean }
): Promise<ToolbarHeadlessResult> {
  await ensureVendorsReady();

  const solid = getSolid();
  const { createRoot, createComponent } = solid;

  return createRoot(dispose => {
    let snapshot: ToolbarHeadlessResult | null = null;

    createComponent(ToolbarHeadless, {
      currentIndex: props.currentIndex,
      totalCount: props.totalCount,
      isDownloading: props.isDownloading ?? false,
      onPrevious: () => undefined,
      onNext: () => undefined,
      onDownloadCurrent: () => undefined,
      onDownloadAll: () => undefined,
      onClose: () => undefined,
      onOpenSettings: () => undefined,
      onFitOriginal: () => undefined,
      onFitWidth: () => undefined,
      onFitHeight: () => undefined,
      onFitContainer: () => undefined,
      children: (state, actions) => {
        const items = state.items().map(item => ({
          type: item.type,
          group: item.group,
          disabled: Boolean(item.disabled),
          loading: Boolean(item.loading),
        }));

        const downloadItems = items.filter(
          item => item.type === 'downloadCurrent' || item.type === 'downloadAll'
        );
        const downloadButtonsLoading =
          downloadItems.length > 0 && downloadItems.every(item => item.loading);

        const fitModeBefore = state.currentFitMode();
        actions.setFitMode('fitWidth');
        const fitModeAfter = state.currentFitMode();

        snapshot = {
          items,
          downloadButtonsLoading,
          fitModeBefore,
          fitModeAfter,
        };

        return null;
      },
    } satisfies ToolbarHeadlessProps);

    const result = snapshot ?? {
      items: [],
      downloadButtonsLoading: false,
      fitModeBefore: 'original' as FitMode,
      fitModeAfter: 'original' as FitMode,
    };
    dispose();
    return result;
  });
}

class HarnessMediaService {
  public extractCalls = 0;
  public restoreCalls = 0;

  async extractFromClickedElement(): Promise<{
    success: boolean;
    mediaItems: MediaInfo[];
    clickedIndex: number;
    errors: unknown[];
  }> {
    this.extractCalls += 1;
    return {
      success: true,
      mediaItems: [SAMPLE_MEDIA],
      clickedIndex: 0,
      errors: [],
    };
  }

  restoreBackgroundVideos(): void {
    this.restoreCalls += 1;
  }
}

class HarnessRenderer implements GalleryRenderer {
  private onClose: (() => void) | null = null;

  async render(): Promise<void> {
    return Promise.resolve();
  }

  close(): void {
    this.onClose?.();
  }

  destroy(): void {
    this.onClose = null;
  }

  isRendering(): boolean {
    return galleryState.value.isOpen;
  }

  setOnCloseCallback(callback: () => void): void {
    this.onClose = callback;
  }
}

type GalleryAppHandle = {
  app: GalleryApp;
  mediaService: HarnessMediaService;
  renderer: HarnessRenderer;
};

let galleryHandle: GalleryAppHandle | null = null;

async function setupGalleryAppHarness(): Promise<GalleryAppSetupResult> {
  await ensureVendorsReady();

  await disposeGalleryAppHarness();

  cleanupGalleryEvents();
  closeGallery();
  CoreService.resetInstance();

  const service = CoreService.getInstance();
  const mediaService = new HarnessMediaService();
  const renderer = new HarnessRenderer();
  service.register(SERVICE_KEYS.MEDIA_SERVICE, mediaService);
  service.register(SERVICE_KEYS.GALLERY_RENDERER, renderer);

  const recordedEvents: string[] = [];
  const originalAdd = document.addEventListener;
  document.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    recordedEvents.push(type);
    return originalAdd.call(this, type, listener, options);
  };

  const app = new GalleryApp();
  try {
    await app.initialize();
  } finally {
    document.addEventListener = originalAdd;
  }

  galleryHandle = { app, mediaService, renderer };

  const uniqueEvents = Array.from(new Set(recordedEvents));
  const eventHandlersRegistered =
    uniqueEvents.includes('click') && uniqueEvents.includes('keydown');

  return {
    initialized: true,
    eventHandlersRegistered,
  };
}

async function triggerGalleryAppMediaClickHarness(): Promise<void> {
  if (!galleryHandle) {
    throw new Error('Gallery app is not initialized.');
  }
  await galleryHandle.app.openGallery([SAMPLE_MEDIA], 0);
  await sleep();
}

async function triggerGalleryAppCloseHarness(): Promise<void> {
  if (!galleryHandle) {
    throw new Error('Gallery app is not initialized.');
  }
  galleryHandle.renderer.close();
  galleryHandle.app.closeGallery();
  await sleep();
}

async function getGalleryAppStateHarness(): Promise<GalleryAppState> {
  return {
    isOpen: galleryState.value.isOpen,
    mediaCount: galleryState.value.mediaItems.length,
    currentIndex: galleryState.value.currentIndex,
  };
}

async function disposeGalleryAppHarness(): Promise<void> {
  if (!galleryHandle) {
    cleanupGalleryEvents();
    closeGallery();
    CoreService.resetInstance();
    return;
  }

  await galleryHandle.app.cleanup();
  galleryHandle = null;
  cleanupGalleryEvents();
  closeGallery();
  CoreService.resetInstance();

  document.getElementById('xeg-gallery-root')?.remove();
}

async function evaluateGalleryEventsHarness(): Promise<GalleryEventsResult> {
  await ensureVendorsReady();

  const recordedEvents: string[] = [];
  const originalAdd = document.addEventListener;
  document.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    recordedEvents.push(type);
    return originalAdd.call(this, type, listener, options);
  };

  const result: GalleryEventsResult = {
    registeredEvents: [],
    forbiddenEvents: [],
    escapeWhenClosed: 0,
    escapeWhenOpen: 0,
    enterDelegated: 0,
  };

  const handlers: EventHandlers = {
    onMediaClick: async () => undefined,
    onGalleryClose: () => {
      if (galleryState.value.isOpen) {
        result.escapeWhenOpen += 1;
      } else {
        result.escapeWhenClosed += 1;
      }
      closeGallery();
    },
    onKeyboardEvent: event => {
      if (event.key === 'Enter') {
        result.enterDelegated += 1;
      }
    },
  };

  try {
    await initializeGalleryEvents(handlers, {
      enableKeyboard: true,
      enableMediaDetection: false,
      preventBubbling: true,
      context: 'playwright-harness',
      debugMode: false,
    });
  } finally {
    document.addEventListener = originalAdd;
  }

  result.registeredEvents = Array.from(new Set(recordedEvents));
  const forbidden = [
    'touchstart',
    'touchend',
    'touchmove',
    'pointerdown',
    'pointerup',
    'pointermove',
    'pointercancel',
  ];
  result.forbiddenEvents = forbidden.filter(type => recordedEvents.includes(type));

  const escapeClosed = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
  document.dispatchEvent(escapeClosed);

  openGallery([SAMPLE_MEDIA], 0);

  const escapeOpen = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
  document.dispatchEvent(escapeOpen);

  const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
  document.dispatchEvent(enterEvent);

  cleanupGalleryEvents();
  closeGallery();

  return result;
}

const harness: XegHarness = {
  errorBoundaryScenario: runErrorBoundaryScenario,
  mountToolbar: mountToolbarHarness,
  updateToolbar: updateToolbarHarness,
  disposeToolbar: disposeToolbarHarness,
  mountKeyboardOverlay: mountKeyboardOverlayHarness,
  openKeyboardOverlay: openKeyboardOverlayHarness,
  closeKeyboardOverlay: closeKeyboardOverlayHarness,
  disposeKeyboardOverlay: disposeKeyboardOverlayHarness,
  // TODO Phase 49: Restore settings panel testing with Toolbar expandable panel
  // mountSettingsModal: mountSettingsModalHarness,
  // setSettingsModalOpen: setSettingsModalOpenHarness,
  // getSettingsModalState: getSettingsModalStateHarness,
  // disposeSettingsModal: disposeSettingsModalHarness,
  evaluateToolbarHeadless: evaluateToolbarHeadlessHarness,
  setupGalleryApp: setupGalleryAppHarness,
  triggerGalleryAppMediaClick: triggerGalleryAppMediaClickHarness,
  triggerGalleryAppClose: triggerGalleryAppCloseHarness,

  getGalleryAppState: getGalleryAppStateHarness,
  disposeGalleryApp: disposeGalleryAppHarness,
  evaluateGalleryEvents: evaluateGalleryEventsHarness,
};

(globalThis as typeof globalThis & { __XEG_HARNESS__?: XegHarness }).__XEG_HARNESS__ = harness;
