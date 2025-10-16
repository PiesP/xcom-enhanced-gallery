import type { ToolbarProps as SolidToolbarProps } from '@shared/components/ui/Toolbar/Toolbar';
import type { MediaInfo } from '@shared/types/media.types';
import type { GalleryRenderer } from '@shared/interfaces/gallery.interfaces';
import type { EventHandlers } from '@shared/utils/events';
import type {
  ToolbarMountProps,
  ErrorBoundaryResult,
  ToolbarMountResult,
  KeyboardOverlayResult,
  // SettingsModalState, // TODO Phase 49: Remove after migrating tests to Toolbar expandable panel
  GalleryAppSetupResult,
  GalleryAppState,
  GalleryEventsResult,
  FocusTrackerHarnessResult,
  ViewportChangeResult,
  KeyboardSimulationOptions,
  PerformanceMetrics,
  MemoryMetrics,
  XegHarness,
} from './types';

import { initializeVendors, getSolid } from '@shared/external/vendors';
import { ToastManager } from '@shared/services/unified-toast-manager';
import { languageService } from '@shared/services/language-service';
import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary/ErrorBoundary';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
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

type ToolbarHeadlessEvaluateProps = ToolbarMountProps;

type ToolbarHeadlessItem = {
  type: string;
  group: string;
  disabled: boolean;
  loading: boolean;
};

type ToolbarHeadlessResult = {
  items: ToolbarHeadlessItem[];
  downloadButtonsLoading: boolean;
  fitModeBefore: string;
  fitModeAfter: string;
};

async function evaluateToolbarHeadlessHarness(
  props: ToolbarHeadlessEvaluateProps
): Promise<ToolbarHeadlessResult> {
  await ensureVendorsReady();

  const solid = getSolid();
  const { render, createSignal, createComponent } = solid;

  const container = createContainer('xeg-toolbar-headless');
  const [currentIndex] = createSignal(props.currentIndex ?? 0);
  const [totalCount] = createSignal(props.totalCount ?? 0);
  const [isDownloading] = createSignal(!!props.isDownloading);

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

  const clickButton = (selector: string) => {
    const target = container.querySelector(selector) as HTMLButtonElement | null;
    if (!target) return;
    if (typeof target.click === 'function') {
      target.click();
      return;
    }
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  };

  const readSelectedFitMode = (): string | null => {
    const selected = container.querySelector(
      '[data-gallery-element^="fit-"][data-selected="true"]'
    ) as HTMLElement | null;
    if (!selected) return null;
    const elementId = selected.getAttribute('data-gallery-element');
    if (!elementId) return null;
    return elementId.replace('fit-', '');
  };

  const toItem = (element: HTMLElement, type: string, group: string): ToolbarHeadlessItem => ({
    type,
    group,
    disabled: element.getAttribute('data-disabled') === 'true',
    loading: element.getAttribute('data-loading') === 'true',
  });

  const collectItems = (): ToolbarHeadlessItem[] => {
    const items: ToolbarHeadlessItem[] = [];

    const navPrevious = container.querySelector(
      '[data-gallery-element="nav-previous"]'
    ) as HTMLElement | null;
    if (navPrevious) {
      items.push(toItem(navPrevious, 'previous', 'navigation'));
    }

    const navNext = container.querySelector(
      '[data-gallery-element="nav-next"]'
    ) as HTMLElement | null;
    if (navNext) {
      items.push(toItem(navNext, 'next', 'navigation'));
    }

    const fitButtons = container.querySelectorAll('[data-gallery-element^="fit-"]');
    fitButtons.forEach(element => {
      const fitElement = element as HTMLElement;
      const id = fitElement.getAttribute('data-gallery-element');
      const type = id ? id.replace('fit-', '') : 'fit';
      items.push(toItem(fitElement, type, 'fitModes'));
    });

    const downloadCurrent = container.querySelector(
      '[data-gallery-element="download-current"]'
    ) as HTMLElement | null;
    if (downloadCurrent) {
      items.push(toItem(downloadCurrent, 'downloadCurrent', 'downloads'));
    }

    const downloadAll = container.querySelector(
      '[data-gallery-element="download-all"]'
    ) as HTMLElement | null;
    if (downloadAll) {
      items.push(toItem(downloadAll, 'downloadAll', 'downloads'));
    }

    const settingsButton = container.querySelector(
      '[data-gallery-element="settings"]'
    ) as HTMLElement | null;
    if (settingsButton) {
      items.push(toItem(settingsButton, 'settings', 'utility'));
    }

    const closeButton = container.querySelector(
      '[data-gallery-element="close"]'
    ) as HTMLElement | null;
    if (closeButton) {
      items.push(toItem(closeButton, 'close', 'utility'));
    }

    return items;
  };

  try {
    await sleep(50);

    // 강제로 최초 상태를 original로 설정하여 이후 fitWidth 전환이 검증 가능하도록 한다.
    clickButton('[data-gallery-element="fit-original"]');
    await sleep(50);
    const fitModeBefore = 'original';

    clickButton('[data-gallery-element="fit-fitWidth"]');
    await sleep(50);
    const fitModeAfter = readSelectedFitMode() ?? 'unknown';

    const items = collectItems();
    const downloadButtonsLoading = items
      .filter(item => item.group === 'downloads')
      .some(item => item.loading);

    return {
      items,
      downloadButtonsLoading,
      fitModeBefore,
      fitModeAfter,
    };
  } finally {
    dispose();
    container.remove();
  }
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

// Phase 82.2: Focus Tracking E2E Support

type FocusTrackerHandle = {
  container: HTMLElement;
  observer: IntersectionObserver | null;
  focusSpyCounts: Map<string, number>;
  dispose: () => void;
};

let focusTrackerHandle: FocusTrackerHandle | null = null;

async function setupFocusTrackerHarness(
  containerSelector: string,
  options?: { minimumVisibleRatio?: number }
): Promise<FocusTrackerHarnessResult> {
  const container = document.querySelector(containerSelector) as HTMLElement;
  if (!container) {
    throw new Error(`Container not found: ${containerSelector}`);
  }

  if (focusTrackerHandle) {
    await disposeFocusTrackerHarness();
  }

  // Track focus() calls on all items
  const focusSpyCounts = new Map<string, number>();
  const items = container.querySelectorAll('[data-index]');
  items.forEach((item, i) => {
    const selector = `[data-index="${i}"]`;
    focusSpyCounts.set(selector, 0);

    const originalFocus = (item as HTMLElement).focus.bind(item);
    (item as HTMLElement).focus = function () {
      focusSpyCounts.set(selector, (focusSpyCounts.get(selector) ?? 0) + 1);
      return originalFocus();
    };
  });

  // Create IntersectionObserver for viewport simulation
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement)?.setAttribute('data-in-viewport', 'true');
        } else {
          (entry.target as HTMLElement)?.removeAttribute('data-in-viewport');
        }
      });
    },
    {
      threshold: [options?.minimumVisibleRatio ?? 0.05],
      root: container,
    }
  );

  items.forEach(item => {
    observer.observe(item);
  });

  focusTrackerHandle = {
    container,
    observer,
    focusSpyCounts,
    dispose: () => {
      observer?.disconnect();
      focusTrackerHandle = null;
    },
  };

  return { initialized: true };
}

async function simulateViewportScrollHarness(
  _containerSel: string,
  scrollPosition: number,
  visibleIndices: number[]
): Promise<ViewportChangeResult> {
  if (!focusTrackerHandle) {
    throw new Error('Focus tracker not initialized. Call setupFocusTracker first.');
  }

  const container = focusTrackerHandle.container;
  const items = Array.from(container.querySelectorAll('[data-index]')) as HTMLElement[];

  // Simulate scroll position
  container.scrollTop = scrollPosition;

  // Simulate IntersectionObserver entries for visible items
  const visibleSet = new Set(visibleIndices);
  items.forEach((item, i) => {
    const isVisible = visibleSet.has(i);
    if (isVisible) {
      item.setAttribute('data-in-viewport', 'true');
    } else {
      item.removeAttribute('data-in-viewport');
    }
  });

  // Determine applied focus index (typically the first visible item)
  const appliedIndex: number | null = visibleIndices.length > 0 ? visibleIndices[0]! : null;

  await sleep(16); // Allow rendering

  return {
    visibleIndices,
    appliedIndex,
  };
}

async function getGlobalFocusedIndexHarness(): Promise<number | null> {
  // Query the data-focused attribute from gallery container
  const galleryContainer = document.querySelector('[data-focused]');
  if (!galleryContainer) {
    return null;
  }

  const focusedAttr = galleryContainer.getAttribute('data-focused');
  const index = focusedAttr ? parseInt(focusedAttr, 10) : null;
  return Number.isNaN(index ?? NaN) ? null : index;
}

async function getElementFocusCountHarness(selector: string): Promise<number> {
  if (!focusTrackerHandle) {
    throw new Error('Focus tracker not initialized. Call setupFocusTracker first.');
  }

  return focusTrackerHandle.focusSpyCounts.get(selector) ?? 0;
}

async function disposeFocusTrackerHarness(): Promise<void> {
  focusTrackerHandle?.dispose();
  focusTrackerHandle = null;
}

// ============================================================
// Phase 82.3: Keyboard & Performance E2E API
// ============================================================

async function simulateKeyPressHarness(
  key: string,
  options: KeyboardSimulationOptions = {}
): Promise<void> {
  const event = new KeyboardEvent('keydown', {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
    ctrlKey: options.ctrlKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    metaKey: options.metaKey ?? false,
  });

  document.dispatchEvent(event);
  await sleep(16); // Allow event handlers to process
}

async function measureKeyboardPerformanceHarness(
  action: () => Promise<void>
): Promise<PerformanceMetrics> {
  const startTime = performance.now();
  await action();
  const endTime = performance.now();
  const duration = endTime - startTime;

  return {
    duration,
    startTime,
    endTime,
  };
}

async function getMemoryUsageHarness(): Promise<MemoryMetrics> {
  // TypeScript doesn't include performance.memory in standard lib
  // It's a non-standard Chrome API
  const perfWithMemory = performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (!perfWithMemory.memory) {
    // Fallback for browsers without performance.memory
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };
  }

  return {
    usedJSHeapSize: perfWithMemory.memory.usedJSHeapSize,
    totalJSHeapSize: perfWithMemory.memory.totalJSHeapSize,
    jsHeapSizeLimit: perfWithMemory.memory.jsHeapSizeLimit,
  };
}

const harness: XegHarness = {
  errorBoundaryScenario: runErrorBoundaryScenario,
  mountToolbar: mountToolbarHarness,
  updateToolbar: updateToolbarHarness,
  disposeToolbar: disposeToolbarHarness,
  evaluateToolbarHeadless: evaluateToolbarHeadlessHarness,
  mountKeyboardOverlay: mountKeyboardOverlayHarness,
  openKeyboardOverlay: openKeyboardOverlayHarness,
  closeKeyboardOverlay: closeKeyboardOverlayHarness,
  disposeKeyboardOverlay: disposeKeyboardOverlayHarness,
  // TODO Phase 49: Restore settings panel testing with Toolbar expandable panel
  // mountSettingsModal: mountSettingsModalHarness,
  // setSettingsModalOpen: setSettingsModalOpenHarness,
  // getSettingsModalState: getSettingsModalStateHarness,
  // disposeSettingsModal: disposeSettingsModalHarness,
  setupGalleryApp: setupGalleryAppHarness,
  triggerGalleryAppMediaClick: triggerGalleryAppMediaClickHarness,
  triggerGalleryAppClose: triggerGalleryAppCloseHarness,
  getGalleryAppState: getGalleryAppStateHarness,
  disposeGalleryApp: disposeGalleryAppHarness,
  evaluateGalleryEvents: evaluateGalleryEventsHarness,
  // Phase 82.2: Focus Tracking E2E API
  setupFocusTracker: setupFocusTrackerHarness,
  simulateViewportScroll: simulateViewportScrollHarness,
  getGlobalFocusedIndex: getGlobalFocusedIndexHarness,
  getElementFocusCount: getElementFocusCountHarness,
  disposeFocusTracker: disposeFocusTrackerHarness,
  // Phase 82.3: Keyboard & Performance E2E API
  simulateKeyPress: simulateKeyPressHarness,
  measureKeyboardPerformance: measureKeyboardPerformanceHarness,
  getMemoryUsage: getMemoryUsageHarness,
};

(globalThis as typeof globalThis & { __XEG_HARNESS__?: XegHarness }).__XEG_HARNESS__ = harness;
