export type FitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';
import type { ToolbarProps as SolidToolbarProps } from '@shared/components/ui/Toolbar/Toolbar';
import type { FitMode, ToolbarItem } from '@shared/components/ui/Toolbar/ToolbarHeadless';

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

// TODO Phase 49: Remove SettingsModalState after migrating E2E tests to Toolbar expandable panel
// export type SettingsModalState = {
//   closeCalls: number;
// };

export type ToolbarHeadlessResult = {
  items: Array<{
    type: ToolbarItem['type'];
    group: ToolbarItem['group'];
    disabled: boolean;
    loading: boolean;
  }>;
  downloadButtonsLoading: boolean;
  fitModeBefore: FitMode;
  fitModeAfter: FitMode;
};

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

export interface XegHarness {
  errorBoundaryScenario(): Promise<ErrorBoundaryResult>;
  mountToolbar(props: ToolbarMountProps): Promise<ToolbarMountResult>;
  updateToolbar(props: Partial<ToolbarMountProps>): Promise<void>;
  disposeToolbar(): Promise<void>;
  mountKeyboardOverlay(): Promise<KeyboardOverlayResult>;
  openKeyboardOverlay(): Promise<void>;
  closeKeyboardOverlay(): Promise<void>;
  disposeKeyboardOverlay(): Promise<void>;
  // TODO Phase 49: Restore settings panel testing with Toolbar expandable panel harness
  // mountSettingsModal(initialOpen?: boolean): Promise<{ containerId: string }>;
  // setSettingsModalOpen(isOpen: boolean): Promise<void>;
  // getSettingsModalState(): Promise<SettingsModalState>;
  // disposeSettingsModal(): Promise<void>;
  evaluateToolbarHeadless(
    props: ToolbarMountProps & { isDownloading?: boolean }
  ): Promise<ToolbarHeadlessResult>;
  setupGalleryApp(): Promise<GalleryAppSetupResult>;
  triggerGalleryAppMediaClick(): Promise<void>;
  triggerGalleryAppClose(): Promise<void>;
  getGalleryAppState(): Promise<GalleryAppState>;
  disposeGalleryApp(): Promise<void>;
  evaluateGalleryEvents(): Promise<GalleryEventsResult>;
}

declare global {
  interface Window {
    __XEG_HARNESS__?: XegHarness;
  }
}

export {};
