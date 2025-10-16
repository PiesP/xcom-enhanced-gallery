import type { ToolbarProps as SolidToolbarProps } from '@shared/components/ui/Toolbar/Toolbar';

export type ToolbarMountProps = Pick<
  SolidToolbarProps,
  'currentIndex' | 'totalCount' | 'isDownloading'
>;

export type ErrorBoundaryResult = {
  toastCount: number;
  hasErrorToast: boolean;
};

export type ToolbarMountResult = {
  containerId: string;
};

export type KeyboardOverlayResult = {
  containerId: string;
};

export type ToolbarHeadlessResult = {
  items: Array<{ type: string; group: string; disabled: boolean; loading: boolean }>;
  downloadButtonsLoading: boolean;
  fitModeBefore: string;
  fitModeAfter: string;
};

// TODO Phase 49: Remove SettingsModalState after migrating E2E tests to Toolbar expandable panel
// export type SettingsModalState = {
//   closeCalls: number;
// };

export type GalleryAppSetupResult = {
  initialized: boolean;
  eventHandlersRegistered: boolean;
};

export type GalleryAppState = {
  isOpen: boolean;
  mediaCount: number;
  currentIndex: number;
};

export type GalleryEventsResult = {
  registeredEvents: string[];
  forbiddenEvents: string[];
  escapeWhenClosed: number;
  escapeWhenOpen: number;
  enterDelegated: number;
};

export type FocusTrackerHarnessResult = {
  initialized: boolean;
};

export type ViewportChangeResult = {
  visibleIndices: number[];
  appliedIndex: number | null;
};

// Phase 82.6: Focus Tracking Extended E2E API
// NOTE: E2E 이관 시도 실패 (Solid.js 반응성 트리거 실패)
// 하네스 API는 유지 (향후 page API 패턴 연구 후 활용)
export type FocusIndicatorPosition = {
  translateX: string;
  left: string;
  width: string;
};

// Phase 82.3: Keyboard & Performance E2E API
export type KeyboardSimulationOptions = {
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
};

export type PerformanceMetrics = {
  duration: number;
  startTime: number;
  endTime: number;
};

export type MemoryMetrics = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};

export type DebugInfo = {
  isOpen: boolean;
  currentIndex: number;
  mediaCount: number;
  checkGalleryOpenResult: boolean;
};

export interface XegHarness {
  errorBoundaryScenario(): Promise<ErrorBoundaryResult>;
  mountToolbar(props: ToolbarMountProps): Promise<ToolbarMountResult>;
  updateToolbar(props: Partial<ToolbarMountProps>): Promise<void>;
  disposeToolbar(): Promise<void>;
  evaluateToolbarHeadless(props: ToolbarMountProps): Promise<ToolbarHeadlessResult>;
  mountKeyboardOverlay(): Promise<KeyboardOverlayResult>;
  openKeyboardOverlay(): Promise<void>;
  closeKeyboardOverlay(): Promise<void>;
  disposeKeyboardOverlay(): Promise<void>;
  // TODO Phase 49: Restore settings panel testing with Toolbar expandable panel harness
  // mountSettingsModal(initialOpen?: boolean): Promise<{ containerId: string }>;
  // setSettingsModalOpen(isOpen: boolean): Promise<void>;
  // getSettingsModalState(): Promise<SettingsModalState>;
  // disposeSettingsModal(): Promise<void>;
  setupGalleryApp(): Promise<GalleryAppSetupResult>;
  triggerGalleryAppMediaClick(): Promise<void>;
  triggerGalleryAppClose(): Promise<void>;
  getGalleryAppState(): Promise<GalleryAppState>;
  disposeGalleryApp(): Promise<void>;
  evaluateGalleryEvents(): Promise<GalleryEventsResult>;
  // Phase 82.2: Focus Tracking E2E API
  setupFocusTracker(
    containerSelector: string,
    options?: { minimumVisibleRatio?: number }
  ): Promise<FocusTrackerHarnessResult>;
  simulateViewportScroll(
    containerSelector: string,
    scrollPosition: number,
    visibleIndices: number[]
  ): Promise<ViewportChangeResult>;
  getGlobalFocusedIndex(): Promise<number | null>;
  getElementFocusCount(selector: string): Promise<number>;
  disposeFocusTracker(): Promise<void>;
  // Phase 82.6: Focus Tracking Extended E2E API
  // NOTE: E2E 이관 시도 실패, API는 유지 (향후 활용)
  waitForFocusStable(timeout?: number): Promise<void>;
  getFocusIndicatorPosition(): Promise<FocusIndicatorPosition>;
  triggerFocusChange(index: number): Promise<void>;
  // Phase 82.3: Keyboard & Performance E2E API
  simulateKeyPress(key: string, options?: KeyboardSimulationOptions): Promise<void>;
  measureKeyboardPerformance(action: () => Promise<void>): Promise<PerformanceMetrics>;
  getMemoryUsage(): Promise<MemoryMetrics>;
  // Debug function
  getDebugInfo(): Promise<DebugInfo>;
}

declare global {
  interface Window {
    __XEG_HARNESS__?: XegHarness;
  }
}

export {};
