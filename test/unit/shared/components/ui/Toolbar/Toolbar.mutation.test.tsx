/**
 * @file Toolbar helper functions mutation tests
 * @description Tests targeting survived mutants in clampIndex, resolveDisplayedIndex, calculateProgressWidth, computeNavigationState
 * Lines: 46, 70, 74, 94, 118, 224, 231, 235, 264, 302
 */

import { SERVICE_KEYS } from '@/constants/service-keys';
import { Toolbar } from '@shared/components/ui/Toolbar/Toolbar';
import { CoreServiceRegistry } from '@shared/container/core-service-registry';
import { LanguageService } from '@shared/services/language-service';
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@shared/hooks', () => ({
  useToolbarState: () => {
    return [{ isDownloading: false }, { setDownloading: vi.fn() }];
  },
  useToolbarSettingsController: (options: { isSettingsExpanded: () => boolean; toggleSettingsExpanded: () => void }) => {
    return {
      handleSettingsClick: vi.fn(() => {
        options.toggleSettingsExpanded();
      }),
      assignToolbarRef: vi.fn(),
      assignSettingsPanelRef: vi.fn(),
      assignSettingsButtonRef: vi.fn(),
      isSettingsExpanded: options.isSettingsExpanded,
      currentTheme: () => 'auto',
      currentLanguage: () => 'en',
    };
  },
}));

vi.mock('@shared/utils/toolbar-utils', () => ({
  getToolbarDataState: () => 'idle',
  getToolbarClassName: () => 'mock-toolbar-class',
}));

// Mock ToolbarView with state inspection
vi.mock('@shared/components/ui/Toolbar/ToolbarView', () => ({
  ToolbarView: (props: {
    navState: () => { prevDisabled: boolean; nextDisabled: boolean; canDownloadAll: boolean; downloadDisabled: boolean; anyActionDisabled: boolean };
    displayedIndex: () => number;
    progressWidth: () => string;
    showSettingsButton: boolean;
    handleFitModeClick: (mode: string) => (event: MouseEvent) => void;
    isFitDisabled: (mode: string) => boolean;
    activeFitMode: () => string;
    fitModeOrder: readonly { mode: string; Icon: unknown }[];
    onCloseClick: (event: MouseEvent) => void;
    onDownloadCurrent: (event: MouseEvent) => void;
    settingsController: { handleSettingsClick: () => void };
  }) => {
    return (
      <div data-testid="toolbar-view">
        <button
          onClick={(e) => props.handleFitModeClick('fitWidth')(e as unknown as MouseEvent)}
          data-testid="fit-width-btn"
        />
        <button
          onClick={(e) => props.handleFitModeClick('original')(e as unknown as MouseEvent)}
          data-testid="fit-original-btn"
        />
        <button
          onClick={(e) => props.onCloseClick(e as unknown as MouseEvent)}
          data-testid="close-btn"
        />
        <button
          onClick={(e) => props.onDownloadCurrent(e as unknown as MouseEvent)}
          data-testid="download-current-btn"
        />
        <div data-testid="state-dump">
          {JSON.stringify({
            navState: props.navState(),
            displayedIndex: props.displayedIndex(),
            progressWidth: props.progressWidth(),
            showSettingsButton: props.showSettingsButton,
            activeFitMode: props.activeFitMode(),
            isFitOriginalDisabled: props.isFitDisabled('original'),
            isFitWidthDisabled: props.isFitDisabled('fitWidth'),
          })}
        </div>
      </div>
    );
  },
}));

describe('Toolbar helper function mutation tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const languageService = LanguageService.getInstance();
    vi.spyOn(languageService, 'translate').mockImplementation((key: unknown) => key as string);
    CoreServiceRegistry.register(SERVICE_KEYS.LANGUAGE, languageService);
  });

  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    currentIndex: 0,
    totalCount: 5,
    onClose: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onDownloadCurrent: vi.fn(),
    onDownloadAll: vi.fn(),
    onFitOriginal: vi.fn(),
    onFitWidth: vi.fn(),
    onFitHeight: vi.fn(),
    onFitContainer: vi.fn(),
    onOpenSettings: vi.fn(),
    currentFitMode: 'original' as const,
    isDownloading: false,
  };

  const getState = () => {
    const dump = screen.getByTestId('state-dump');
    return JSON.parse(dump.textContent || '{}');
  };

  describe('clampIndex mutation tests (line 46)', () => {
    it('should return 0 for non-finite index values', () => {
      // Line 46: ConditionalExpression replacement "false"
      // Tests !Number.isFinite(index)
      render(() => <Toolbar {...defaultProps} currentIndex={Infinity} totalCount={5} />);
      expect(getState().displayedIndex).toBe(0);
      cleanup();

      render(() => <Toolbar {...defaultProps} currentIndex={-Infinity} totalCount={5} />);
      expect(getState().displayedIndex).toBe(0);
      cleanup();

      render(() => <Toolbar {...defaultProps} currentIndex={Number.NaN} totalCount={5} />);
      expect(getState().displayedIndex).toBe(0);
    });

    it('should return 0 when total is exactly 0', () => {
      // Line 46: EqualityOperator replacement "total < 0"
      // Tests total <= 0 boundary
      render(() => <Toolbar {...defaultProps} currentIndex={2} totalCount={0} />);
      expect(getState().displayedIndex).toBe(0);
    });

    it('should return 0 when total is negative', () => {
      // Line 46: EqualityOperator mutation
      render(() => <Toolbar {...defaultProps} currentIndex={2} totalCount={-5} />);
      expect(getState().displayedIndex).toBe(0);
    });

    it('should correctly clamp index when total is exactly 1', () => {
      // Boundary case: total = 1
      render(() => <Toolbar {...defaultProps} currentIndex={5} totalCount={1} />);
      expect(getState().displayedIndex).toBe(0); // clamped to total - 1 = 0
    });
  });

  describe('resolveDisplayedIndex mutation tests (line 70, 74)', () => {
    it('should return 0 when total is exactly 0', () => {
      // Line 70: ConditionalExpression replacement "false", EqualityOperator "total < 0"
      render(() => <Toolbar {...defaultProps} currentIndex={3} totalCount={0} />);
      expect(getState().displayedIndex).toBe(0);
    });

    it('should use focusedIndex when it equals 0 (boundary)', () => {
      // Line 74: EqualityOperator "focusedIndex > 0"
      // focusedIndex === 0 should still be valid
      render(() => <Toolbar {...defaultProps} currentIndex={3} focusedIndex={0} totalCount={5} />);
      expect(getState().displayedIndex).toBe(0); // focusedIndex, not currentIndex
    });

    it('should use focusedIndex when it equals total - 1 (boundary)', () => {
      // Line 74: EqualityOperator "focusedIndex <= total"
      // focusedIndex < total is the condition
      render(() => <Toolbar {...defaultProps} currentIndex={0} focusedIndex={4} totalCount={5} />);
      expect(getState().displayedIndex).toBe(4); // focusedIndex at boundary
    });

    it('should fallback to currentIndex when focusedIndex equals total', () => {
      // focusedIndex >= total should fallback to currentIndex
      render(() => <Toolbar {...defaultProps} currentIndex={2} focusedIndex={5} totalCount={5} />);
      expect(getState().displayedIndex).toBe(2); // currentIndex fallback
    });

    it('should fallback when focusedIndex is exactly -1', () => {
      // Boundary: focusedIndex < 0
      render(() => <Toolbar {...defaultProps} currentIndex={2} focusedIndex={-1} totalCount={5} />);
      expect(getState().displayedIndex).toBe(2);
    });
  });

  describe('calculateProgressWidth mutation tests', () => {
    it('should return 0% for empty gallery', () => {
      render(() => <Toolbar {...defaultProps} currentIndex={0} totalCount={0} />);
      expect(getState().progressWidth).toBe('0%');
    });

    it('should calculate correct percentage for single item', () => {
      render(() => <Toolbar {...defaultProps} currentIndex={0} totalCount={1} />);
      expect(getState().progressWidth).toBe('100%');
    });

    it('should calculate correct percentage for first item in multi-item gallery', () => {
      render(() => <Toolbar {...defaultProps} currentIndex={0} totalCount={5} />);
      expect(getState().progressWidth).toBe('20%'); // (0+1)/5 * 100
    });

    it('should calculate correct percentage for last item', () => {
      render(() => <Toolbar {...defaultProps} currentIndex={4} totalCount={5} />);
      expect(getState().progressWidth).toBe('100%'); // (4+1)/5 * 100
    });
  });

  describe('computeNavigationState mutation tests (line 94)', () => {
    it('should set hasItems false when total is exactly 0', () => {
      // Line 94: ConditionalExpression "true", EqualityOperator "total >= 0"
      render(() => <Toolbar {...defaultProps} totalCount={0} />);
      const navState = getState().navState;

      // When hasItems is false, navigation should be disabled
      expect(navState.prevDisabled).toBe(true);
      expect(navState.nextDisabled).toBe(true);
      expect(navState.downloadDisabled).toBe(true);
      expect(navState.canDownloadAll).toBe(false);
    });

    it('should set canNavigate false when total is exactly 1', () => {
      render(() => <Toolbar {...defaultProps} totalCount={1} />);
      const navState = getState().navState;

      // Single item: hasItems true but canNavigate false
      expect(navState.prevDisabled).toBe(true);
      expect(navState.nextDisabled).toBe(true);
      expect(navState.canDownloadAll).toBe(false);
      expect(navState.downloadDisabled).toBe(false); // Can download single item
    });

    it('should enable navigation when total > 1', () => {
      render(() => <Toolbar {...defaultProps} totalCount={2} />);
      const navState = getState().navState;

      expect(navState.prevDisabled).toBe(false);
      expect(navState.nextDisabled).toBe(false);
      expect(navState.canDownloadAll).toBe(true);
    });
  });

  describe('createGuardedHandler mutation tests (line 118)', () => {
    it('should not call action when guard returns true', () => {
      // Line 118: OptionalChaining "action()"
      const onDownload = vi.fn();
      render(() => <Toolbar {...defaultProps} onDownloadCurrent={onDownload} disabled={true} />);

      fireEvent.click(screen.getByTestId('download-current-btn'));
      expect(onDownload).not.toHaveBeenCalled();
    });

    it('should call action when guard returns false', () => {
      const onDownload = vi.fn();
      render(() => <Toolbar {...defaultProps} onDownloadCurrent={onDownload} disabled={false} />);

      fireEvent.click(screen.getByTestId('download-current-btn'));
      expect(onDownload).toHaveBeenCalled();
    });

    it('should handle missing action gracefully', () => {
      // Test optional chaining - action?.()
      const { onDownloadCurrent: _, ...rest } = defaultProps;
      render(() => <Toolbar {...rest} onDownloadCurrent={undefined as never} disabled={false} />);

      // Should not throw when clicking with undefined handler
      expect(() => fireEvent.click(screen.getByTestId('download-current-btn'))).not.toThrow();
    });
  });

  describe('activeFitMode fallback mutation tests (line 224)', () => {
    it('should use currentFitMode when provided', () => {
      render(() => <Toolbar {...defaultProps} currentFitMode="fitWidth" />);
      expect(getState().activeFitMode).toBe('fitWidth');
    });

    it('should fallback to first mode when currentFitMode is undefined', () => {
      // Line 224: LogicalOperator "&&", OptionalChaining
      const { currentFitMode: _, ...rest } = defaultProps;
      render(() => <Toolbar {...rest} />);
      expect(getState().activeFitMode).toBe('original'); // First in FIT_MODE_ORDER
    });

    it('should fallback to first mode when currentFitMode is null', () => {
      render(() => <Toolbar {...defaultProps} currentFitMode={null as never} />);
      expect(getState().activeFitMode).toBe('original');
    });
  });

  describe('handleFitModeClick mutation tests (line 231, 235)', () => {
    it('should not call handler when toolbar is disabled', () => {
      // Line 231: ConditionalExpression "false"
      render(() => <Toolbar {...defaultProps} disabled={true} />);

      fireEvent.click(screen.getByTestId('fit-width-btn'));
      expect(defaultProps.onFitWidth).not.toHaveBeenCalled();
    });

    it('should call handler when toolbar is enabled', () => {
      render(() => <Toolbar {...defaultProps} disabled={false} />);

      fireEvent.click(screen.getByTestId('fit-width-btn'));
      expect(defaultProps.onFitWidth).toHaveBeenCalled();
    });

    it('should handle missing fit mode handler gracefully', () => {
      // Line 235: OptionalChaining
      const { onFitWidth: _, ...rest } = defaultProps;
      render(() => <Toolbar {...rest} />);

      // Should not throw
      expect(() => fireEvent.click(screen.getByTestId('fit-width-btn'))).not.toThrow();
    });
  });

  describe('handleClose mutation tests (line 264)', () => {
    it('should call onClose when provided', () => {
      render(() => <Toolbar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('close-btn'));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should handle close when onClose is called', () => {
      // Line 264: OptionalChaining "props.onClose()"
      // Testing that the close handler is called properly
      const onClose = vi.fn();
      render(() => <Toolbar {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('close-btn'));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('showSettingsButton mutation tests (line 302)', () => {
    it('should show settings button when onOpenSettings is a function', () => {
      // Line 302: EqualityOperator "!== function"
      render(() => <Toolbar {...defaultProps} onOpenSettings={vi.fn()} />);
      expect(getState().showSettingsButton).toBe(true);
    });

    it('should hide settings button when onOpenSettings is undefined', () => {
      const { onOpenSettings: _omitSettings, ...rest } = defaultProps;
      void _omitSettings;
      render(() => <Toolbar {...rest} />);
      expect(getState().showSettingsButton).toBe(false);
    });

    it('should hide settings button when onOpenSettings is null', () => {
      render(() => <Toolbar {...defaultProps} onOpenSettings={null as never} />);
      expect(getState().showSettingsButton).toBe(false);
    });

    it('should hide settings button when onOpenSettings is not a function', () => {
      render(() => <Toolbar {...defaultProps} onOpenSettings={'notAFunction' as never} />);
      expect(getState().showSettingsButton).toBe(false);
    });
  });

  describe('isFitDisabled mutation tests', () => {
    it('should disable when toolbar is disabled', () => {
      render(() => <Toolbar {...defaultProps} disabled={true} />);
      expect(getState().isFitOriginalDisabled).toBe(true);
      expect(getState().isFitWidthDisabled).toBe(true);
    });

    it('should disable when mode is active', () => {
      render(() => <Toolbar {...defaultProps} currentFitMode="original" disabled={false} />);
      expect(getState().isFitOriginalDisabled).toBe(true); // active mode
      expect(getState().isFitWidthDisabled).toBe(false);
    });

    it('should disable when handler is missing', () => {
      const { onFitWidth: _omitFitWidth, ...rest } = defaultProps;
      void _omitFitWidth;
      render(() => <Toolbar {...rest} currentFitMode="original" disabled={false} />);
      expect(getState().isFitWidthDisabled).toBe(true); // no handler
    });
  });
});
